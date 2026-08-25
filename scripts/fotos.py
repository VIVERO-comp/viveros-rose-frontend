#!/usr/bin/env python3
# Gestor de fotos de productos en Cloudinary.
#
# Abraham mantiene UNA carpeta plana con las fotos tal como salen del celular
# y le agrega tandas nuevas encima. Este script hace todo el trabajo:
#
#   python3 scripts/fotos.py ~/carpeta-de-fotos
#
# 1. Identifica cada foto por el hash de su contenido (renombrar o duplicar
#    un archivo no confunde al script) y solo procesa las que no conoce.
# 2. Empareja lo seguro solo (el nombre del archivo coincide con un producto
#    del catalogo); lo ambiguo va a una pagina de revision local con
#    miniaturas donde Abraham asigna el SKU, marca la principal o descarta.
# 3. Las decisiones quedan en scripts/fotos-mapa.json: nunca se vuelve a
#    preguntar por la misma foto ni se re-sube lo ya subido.
# 4. Sube a Cloudinary como productos/{SKU}/{hash} (nombre inmutable: cambiar
#    la principal o el orden NO toca Cloudinary, solo regenera fotos.json).
# 5. Regenera src/data/fotos.json (SKU -> lista ordenada de hashes, la
#    primera es la principal y la segunda el hover de la tarjeta).
#
# Banderas:
#   --sin-revision  no levanta la pagina de revision; solo asigna lo seguro,
#                   sube lo asignado y reporta cuantas quedaron pendientes.
#   --solo-revision abre la pagina de revision aunque no haya fotos nuevas
#                   (para cambiar principales o descartar fotos viejas).
#   --puerto N      puerto del servidor de revision (por defecto 8765).
#
# Borron y cuenta nueva (no necesitan carpeta):
#   --reiniciar         vacia fotos-mapa.json y fotos.json: el sitio queda en
#                       emoji tras el proximo build/deploy y la siguiente
#                       corrida del script empieza de cero.
#   --borrar-cloudinary elimina TODO lo que cuelga de productos/ en
#                       Cloudinary. Correrlo DESPUES de desplegar el
#                       fotos.json vacio, nunca antes: asi el sitio jamas
#                       referencia fotos que ya no existen.
#
# Sin dependencias: usa solo la libreria estandar (la subida firmada de
# Cloudinary es un POST multipart con firma SHA-1). Credenciales del .env
# del frontend (CLOUDINARY_CLOUD_NAME / _API_KEY / _API_SECRET).

import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
import threading
import unicodedata
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

RAIZ = os.path.normpath(os.path.join(os.path.dirname(__file__), ".."))
MAPA_PATH = os.path.join(RAIZ, "scripts", "fotos-mapa.json")
FOTOS_JSON_PATH = os.path.join(RAIZ, "src", "data", "fotos.json")
PRODUCTS_TS = os.path.join(RAIZ, "src", "data", "products.ts")
MINIATURAS_DIR = os.path.join(RAIZ, "scripts", ".miniaturas")

EXTENSIONES = {".jpg", ".jpeg", ".png", ".heic", ".webp"}
# Fotos tomadas con menos de 10 minutos de diferencia se agrupan en la
# revision: casi siempre son la misma planta, asi que se decide una sola vez.
BRECHA_GRUPO_SEG = 10 * 60


def cargar_env():
    env = {}
    ruta = os.path.join(RAIZ, ".env")
    if os.path.exists(ruta):
        with open(ruta, encoding="utf-8") as f:
            for linea in f:
                linea = linea.strip()
                if linea and not linea.startswith("#") and "=" in linea:
                    clave, valor = linea.split("=", 1)
                    env[clave.strip()] = valor.strip()
    faltan = [k for k in ("CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET") if not env.get(k)]
    if faltan:
        sys.exit(f"Faltan en el .env del frontend: {', '.join(faltan)}")
    return env


def sin_acentos(s):
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def normalizar(s):
    s = sin_acentos(s).lower()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def cargar_catalogo():
    """Productos del catalogo y, si todavia existen, las rutas de foto que
    products.ts tenia a mano (sirven para migrar public/fotos_productos con
    el mismo orden que ya estaba publicado)."""
    with open(PRODUCTS_TS, encoding="utf-8") as f:
        contenido = f.read()
    productos = []
    fotos_previas = {}  # nombre de archivo -> (sku, orden)
    for bloque in re.finditer(r"\n  \{\n(.*?)\n  \},", contenido, re.DOTALL):
        campos = bloque.group(1)
        sku = re.search(r"sku: '([^']+)'", campos)
        slug = re.search(r"slug: '([^']+)'", campos)
        nombre = re.search(r"name: '((?:[^'\\]|\\.)*)'", campos)
        if not (sku and slug and nombre):
            continue
        productos.append({
            "sku": sku.group(1),
            "slug": slug.group(1),
            "nombre": nombre.group(1).replace("\\'", "'"),
        })
        rutas = re.findall(r"'/fotos_productos/([^']+)'", campos)
        for orden, ruta in enumerate(rutas, start=1):
            fotos_previas[ruta] = (sku.group(1), orden)
    if not productos:
        sys.exit(f"No se pudo leer el catalogo de {PRODUCTS_TS}")
    return productos, fotos_previas


def stem_y_orden(nombre_archivo):
    """Nombre normalizado sin sufijos de serie, y el orden que el sufijo
    sugiere: base -> 1, hover -> 2, _2/_3/... -> despues del hover."""
    stem = normalizar(os.path.splitext(nombre_archivo)[0])
    m = re.match(r"^(.*)-hover$", stem)
    if m:
        return m.group(1), 2
    m = re.match(r"^(.*)-(\d{1,2})$", stem)
    if m:
        return m.group(1), int(m.group(2)) + 10
    return stem, 1


def hash_archivo(ruta):
    h = hashlib.sha1()
    with open(ruta, "rb") as f:
        for trozo in iter(lambda: f.read(1 << 20), b""):
            h.update(trozo)
    return h.hexdigest()[:12]


def fecha_captura(ruta):
    """Fecha de captura via metadatos de macOS (mdls); si no hay, la fecha de
    modificacion del archivo."""
    try:
        salida = subprocess.run(
            ["mdls", "-raw", "-name", "kMDItemContentCreationDate", ruta],
            capture_output=True, text=True, timeout=10,
        ).stdout.strip()
        if salida and salida != "(null)":
            return salida  # formato "2026-08-20 14:03:11 +0000", ordena bien
    except Exception:
        pass
    return datetime.fromtimestamp(os.path.getmtime(ruta), tz=timezone.utc).strftime("%Y-%m-%d %H:%M:%S +0000")


def cargar_mapa():
    if os.path.exists(MAPA_PATH):
        with open(MAPA_PATH, encoding="utf-8") as f:
            return json.load(f)
    return {"version": 1, "fotos": {}}


def guardar_mapa(mapa):
    with open(MAPA_PATH, "w", encoding="utf-8") as f:
        json.dump(mapa, f, ensure_ascii=False, indent=2, sort_keys=True)
        f.write("\n")


def escanear(carpeta, mapa):
    """Registra en el mapa las fotos nuevas de la carpeta. Devuelve
    hash -> ruta local de todo lo visto en esta corrida."""
    rutas = {}
    nuevas = []
    for nombre in sorted(os.listdir(carpeta)):
        if nombre.startswith("."):
            continue
        if os.path.splitext(nombre)[1].lower() not in EXTENSIONES:
            continue
        ruta = os.path.join(carpeta, nombre)
        if not os.path.isfile(ruta):
            continue
        h = hash_archivo(ruta)
        rutas[h] = ruta
        entrada = mapa["fotos"].get(h)
        if entrada is None:
            mapa["fotos"][h] = {
                "archivo": nombre,
                "fecha": fecha_captura(ruta),
                "sku": None,
                "orden": None,
                "principal": False,
                "descartada": False,
                "subida": False,
            }
            nuevas.append(h)
        else:
            # Mismo contenido con otro nombre: solo se actualiza la referencia.
            entrada["archivo"] = nombre
    return rutas, nuevas


def emparejar(mapa, hashes, productos, fotos_previas):
    """Asigna SKU a las fotos cuyo nombre coincide EXACTO con un producto
    (por slug, por nombre normalizado o por las rutas viejas de products.ts).
    Lo que no coincide queda pendiente para la revision."""
    por_slug = {p["slug"]: p["sku"] for p in productos}
    por_nombre = {normalizar(p["nombre"]): p["sku"] for p in productos}
    asignadas = []
    for h in hashes:
        entrada = mapa["fotos"][h]
        if entrada["sku"] or entrada["descartada"]:
            continue
        previa = fotos_previas.get(entrada["archivo"])
        if previa:
            entrada["sku"], entrada["orden"] = previa
            asignadas.append(h)
            continue
        stem, orden = stem_y_orden(entrada["archivo"])
        sku = por_slug.get(stem) or por_nombre.get(stem)
        if sku:
            entrada["sku"] = sku
            entrada["orden"] = orden
            asignadas.append(h)
    return asignadas


def pendientes_de(mapa):
    return [h for h, e in mapa["fotos"].items() if not e["sku"] and not e["descartada"]]


def clave_orden(entrada):
    # Orden dentro de un producto: principal primero, despues el orden
    # explicito (sufijo del archivo o decision de revision) y por ultimo la
    # fecha de captura.
    return (
        0 if entrada.get("principal") else 1,
        entrada.get("orden") if entrada.get("orden") is not None else 999,
        entrada.get("fecha") or "",
        entrada.get("archivo") or "",
    )


def fotos_por_sku(mapa, solo_subidas=True):
    por_sku = {}
    for h, e in mapa["fotos"].items():
        if e["descartada"] or not e["sku"]:
            continue
        if solo_subidas and not e["subida"]:
            continue
        por_sku.setdefault(e["sku"], []).append(h)
    for sku, hashes in por_sku.items():
        hashes.sort(key=lambda h: clave_orden(mapa["fotos"][h]))
    return por_sku


# ---------------------------------------------------------------------------
# Subida firmada a Cloudinary (sin SDK).

def firmar(params, secreto):
    base = "&".join(f"{k}={params[k]}" for k in sorted(params))
    return hashlib.sha1((base + secreto).encode("utf-8")).hexdigest()


def subir_foto(env, ruta, public_id):
    # curl en vez de urllib: el Python de Homebrew no trae los certificados
    # SSL del sistema y curl si los usa.
    marca = str(int(datetime.now(tz=timezone.utc).timestamp()))
    firma = firmar({"public_id": public_id, "timestamp": marca}, env["CLOUDINARY_API_SECRET"])
    resultado = subprocess.run(
        [
            "curl", "-sS", "--fail-with-body",
            "-F", f"file=@{ruta}",
            "-F", f"api_key={env['CLOUDINARY_API_KEY']}",
            "-F", f"timestamp={marca}",
            "-F", f"public_id={public_id}",
            "-F", f"signature={firma}",
            f"https://api.cloudinary.com/v1_1/{env['CLOUDINARY_CLOUD_NAME']}/image/upload",
        ],
        capture_output=True, text=True, timeout=300,
    )
    if resultado.returncode != 0:
        raise RuntimeError((resultado.stdout + resultado.stderr).strip()[:300])
    return json.loads(resultado.stdout)


def subir_pendientes(env, mapa, rutas):
    listas = [
        h for h, e in mapa["fotos"].items()
        if e["sku"] and not e["descartada"] and not e["subida"] and h in rutas
    ]
    sin_archivo = [
        h for h, e in mapa["fotos"].items()
        if e["sku"] and not e["descartada"] and not e["subida"] and h not in rutas
    ]
    subidas = 0
    for h in sorted(listas, key=lambda h: mapa["fotos"][h]["archivo"]):
        entrada = mapa["fotos"][h]
        public_id = f"productos/{entrada['sku']}/{h}"
        try:
            subir_foto(env, rutas[h], public_id)
        except Exception as error:
            print(f"  ERROR subiendo {entrada['archivo']} ({public_id}): {error}")
            continue
        entrada["subida"] = True
        subidas += 1
        print(f"  Subida {entrada['archivo']} -> {public_id}")
        guardar_mapa(mapa)  # progreso a salvo si la corrida se corta
    return subidas, sin_archivo


def peticion_admin(env, metodo, ruta):
    """Llamada a la Admin API con curl. Las credenciales van por stdin
    (curl -K -) para que no aparezcan en la lista de procesos."""
    config = f'user = "{env["CLOUDINARY_API_KEY"]}:{env["CLOUDINARY_API_SECRET"]}"\n'
    resultado = subprocess.run(
        [
            "curl", "-sS", "--fail-with-body", "-X", metodo, "-K", "-",
            f"https://api.cloudinary.com/v1_1/{env['CLOUDINARY_CLOUD_NAME']}{ruta}",
        ],
        input=config, capture_output=True, text=True, timeout=120,
    )
    if resultado.returncode != 0:
        raise RuntimeError((resultado.stdout + resultado.stderr).strip()[:300])
    return json.loads(resultado.stdout)


def reiniciar(env):
    """Borron y cuenta nueva local: vacia el mapeo y fotos.json. NO toca
    Cloudinary (eso es --borrar-cloudinary, despues del deploy)."""
    mapa = cargar_mapa()
    subidas = sum(1 for e in mapa["fotos"].values() if e["subida"])
    productos_con_foto = len(fotos_por_sku(mapa, solo_subidas=True))
    vacio = {"version": 1, "fotos": {}}
    guardar_mapa(vacio)
    generar_fotos_json(env, vacio)
    print("Reiniciado:")
    print(f"  fotos-mapa.json vaciado ({len(mapa['fotos'])} fotos conocidas, {subidas} subidas)")
    print(f"  fotos.json vaciado ({productos_con_foto} productos vuelven al emoji tras el proximo build/deploy)")
    print("Las fotos siguen en Cloudinary: cuando el deploy este arriba,")
    print("correr --borrar-cloudinary para eliminarlas de alla.")


def borrar_cloudinary(env):
    """Elimina todo lo que cuelga de productos/ en Cloudinary (recursos y
    derivados). Pensado para DESPUES de desplegar el fotos.json vacio."""
    fotos_json = {}
    if os.path.exists(FOTOS_JSON_PATH):
        with open(FOTOS_JSON_PATH, encoding="utf-8") as f:
            fotos_json = json.load(f).get("porSku", {})
    if fotos_json:
        print("OJO: fotos.json todavia referencia fotos. El orden seguro es")
        print("desplegar primero el fotos.json vacio (--reiniciar + deploy) y")
        print("borrar en Cloudinary despues. Abortando sin borrar.")
        sys.exit(1)
    total = 0
    while True:
        r = peticion_admin(env, "DELETE", "/resources/image/upload?prefix=productos/")
        total += sum(1 for v in r.get("deleted", {}).values() if v == "deleted")
        if not r.get("partial"):
            break
    # La carpeta vacia (si el modo de carpetas de la cuenta la deja viva).
    try:
        peticion_admin(env, "DELETE", "/folders/productos")
    except Exception:
        pass
    print(f"Eliminadas de Cloudinary: {total} fotos bajo productos/")


def generar_fotos_json(env, mapa):
    datos = {
        "cloud": env["CLOUDINARY_CLOUD_NAME"],
        "porSku": fotos_por_sku(mapa, solo_subidas=True),
    }
    nuevo = json.dumps(datos, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    actual = None
    if os.path.exists(FOTOS_JSON_PATH):
        with open(FOTOS_JSON_PATH, encoding="utf-8") as f:
            actual = f.read()
    if nuevo != actual:
        with open(FOTOS_JSON_PATH, "w", encoding="utf-8") as f:
            f.write(nuevo)
        return True
    return False


# ---------------------------------------------------------------------------
# Pagina de revision (servidor local).

def miniatura(rutas, h):
    """Miniatura JPEG (300px) generada con sips, el conversor nativo de macOS
    (tambien convierte HEIC, que Chrome no muestra directo)."""
    os.makedirs(MINIATURAS_DIR, exist_ok=True)
    destino = os.path.join(MINIATURAS_DIR, f"{h}.jpg")
    if not os.path.exists(destino):
        subprocess.run(
            ["sips", "-Z", "300", "-s", "format", "jpeg", rutas[h], "--out", destino],
            capture_output=True, timeout=30,
        )
    return destino if os.path.exists(destino) else None


def grupos_pendientes(mapa, rutas):
    """Pendientes agrupadas por cercania de fecha de captura (una decision
    por planta, no por foto)."""
    pend = [h for h in pendientes_de(mapa) if h in rutas]
    pend.sort(key=lambda h: (mapa["fotos"][h]["fecha"], mapa["fotos"][h]["archivo"]))
    grupos = []
    ultima = None
    for h in pend:
        fecha = mapa["fotos"][h]["fecha"]
        try:
            momento = datetime.strptime(fecha[:19], "%Y-%m-%d %H:%M:%S")
        except ValueError:
            momento = None
        if not grupos or momento is None or ultima is None or (momento - ultima).total_seconds() > BRECHA_GRUPO_SEG:
            grupos.append([])
        grupos[-1].append(h)
        ultima = momento or ultima
    return grupos


PAGINA_HTML = """<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Revisión de fotos</title>
<style>
  :root { --verde: #1b5e20; --linea: #d7e0d9; --tinta: #1b2a1f; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, system-ui, sans-serif; margin: 0; color: var(--tinta); background: #f6f8f6; }
  header { position: sticky; top: 0; background: #fff; border-bottom: 1px solid var(--linea); padding: 12px 20px; display: flex; align-items: center; gap: 16px; z-index: 5; }
  h1 { font-size: 17px; margin: 0; flex: 1; }
  main { max-width: 1080px; margin: 0 auto; padding: 20px; }
  h2 { font-size: 15px; margin: 28px 0 10px; }
  .grupo { background: #fff; border: 1px solid var(--linea); border-radius: 10px; padding: 14px; margin-bottom: 14px; }
  .grupo-cab { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-bottom: 10px; }
  .grupo-cab .fecha { color: #667; font-size: 12px; }
  input[list] { padding: 8px 10px; border: 1px solid var(--linea); border-radius: 8px; font-size: 14px; min-width: 320px; }
  .fila-fotos { display: flex; gap: 10px; flex-wrap: wrap; }
  figure { margin: 0; width: 150px; }
  figure img { width: 150px; height: 150px; object-fit: cover; border-radius: 8px; display: block; border: 2px solid transparent; }
  figure.descartada img { opacity: 0.3; }
  figcaption { font-size: 11px; color: #667; word-break: break-all; margin-top: 4px; }
  .acciones { display: flex; gap: 6px; margin-top: 4px; }
  button { font-size: 12px; padding: 4px 8px; border-radius: 6px; border: 1px solid var(--linea); background: #fff; cursor: pointer; }
  button.primario { background: var(--verde); border-color: var(--verde); color: #fff; font-size: 14px; padding: 8px 16px; }
  .prod { background: #fff; border: 1px solid var(--linea); border-radius: 10px; padding: 12px 14px; margin-bottom: 10px; }
  .prod h3 { font-size: 14px; margin: 0 0 8px; }
  .prod .fila-fotos figure { width: 110px; }
  .prod .fila-fotos img { width: 110px; height: 110px; }
  figure.principal img { border-color: var(--verde); }
  figure .estrella { position: absolute; }
  .marca-principal { font-size: 11px; color: var(--verde); font-weight: 600; }
  .aviso { background: #fff8e1; border: 1px solid #e8d9a0; border-radius: 8px; padding: 10px 14px; font-size: 13px; }
  #estado { font-size: 13px; color: #667; }
</style>
</head>
<body>
<header>
  <h1>Revisión de fotos</h1>
  <span id="estado"></span>
  <button class="primario" onclick="guardar(false)">Guardar</button>
  <button class="primario" onclick="guardar(true)">Guardar y terminar</button>
</header>
<main>
  <div id="contenido"></div>
</main>
<script>
const DATOS = __DATOS__;
const cambios = { asignar: {}, descartar: {}, principal: {} };

function opcionesProductos() {
  return DATOS.productos.map(p => `<option value="${p.sku} — ${p.nombre}"></option>`).join('');
}

function skuDeEntrada(valor) {
  const sku = (valor || '').split('—')[0].trim();
  return DATOS.productos.some(p => p.sku === sku) ? sku : null;
}

function pintar() {
  const c = document.getElementById('contenido');
  let html = '';
  if (DATOS.grupos.length) {
    html += `<h2>Fotos por asignar (${DATOS.grupos.reduce((n, g) => n + g.length, 0)})</h2>`;
    html += `<p class="aviso">Escribe el producto del grupo (busca por nombre o SKU). Las fotos tomadas juntas vienen agrupadas; si una no pertenece al grupo, descártala aquí y asígnala en la siguiente corrida, o descártala para siempre.</p>`;
    DATOS.grupos.forEach((grupo, gi) => {
      html += `<div class="grupo">
        <div class="grupo-cab">
          <input list="productos" id="grupo-${gi}" placeholder="SKU o nombre del producto…"
                 oninput="asignarGrupo(${gi}, this.value)">
          <span class="fecha">${DATOS.fotos[grupo[0]].fecha}</span>
        </div>
        <div class="fila-fotos">` +
        grupo.map(h => `
          <figure id="fig-${h}">
            <img src="/miniatura/${h}" alt="">
            <figcaption>${DATOS.fotos[h].archivo}</figcaption>
            <div class="acciones"><button onclick="alternarDescarte('${h}')">Descartar</button></div>
          </figure>`).join('') +
        `</div></div>`;
    });
  } else {
    html += '<p>No hay fotos nuevas por asignar.</p>';
  }
  if (DATOS.asignados.length) {
    html += '<h2>Productos con fotos — clic en una foto para hacerla principal</h2>';
    DATOS.asignados.forEach(prod => {
      html += `<div class="prod"><h3>${prod.sku} — ${prod.nombre}</h3><div class="fila-fotos">` +
        prod.fotos.map(h => `
          <figure id="fig-${h}" class="${prod.principal === h ? 'principal' : ''}" style="cursor:pointer"
                  onclick="hacerPrincipal('${prod.sku}', '${h}')">
            <img src="/miniatura/${h}" alt="" title="Hacer principal">
            <figcaption>${prod.principal === h ? '<span class=marca-principal>PRINCIPAL</span> ' : ''}${DATOS.fotos[h].archivo}</figcaption>
          </figure>`).join('') +
        `</div></div>`;
    });
  }
  html += `<datalist id="productos">${opcionesProductos()}</datalist>`;
  c.innerHTML = html;
}

function asignarGrupo(gi, valor) {
  const sku = skuDeEntrada(valor);
  document.getElementById(`grupo-${gi}`).style.borderColor = sku ? 'var(--verde)' : '';
  DATOS.grupos[gi].forEach(h => {
    if (!cambios.descartar[h]) cambios.asignar[h] = sku;
  });
  refrescarEstado();
}

function alternarDescarte(h) {
  cambios.descartar[h] = !cambios.descartar[h];
  if (cambios.descartar[h]) delete cambios.asignar[h];
  document.getElementById(`fig-${h}`).classList.toggle('descartada', cambios.descartar[h]);
  refrescarEstado();
}

function hacerPrincipal(sku, h) {
  cambios.principal[sku] = h;
  const prod = DATOS.asignados.find(p => p.sku === sku);
  prod.principal = h;
  pintar();
  refrescarEstado();
}

function refrescarEstado() {
  const n = Object.values(cambios.asignar).filter(Boolean).length +
    Object.values(cambios.descartar).filter(Boolean).length +
    Object.keys(cambios.principal).length;
  document.getElementById('estado').textContent = n ? `${n} decisiones sin guardar` : '';
}

async function guardar(terminar) {
  const carga = {
    asignar: Object.fromEntries(Object.entries(cambios.asignar).filter(([, v]) => v)),
    descartar: Object.keys(cambios.descartar).filter(h => cambios.descartar[h]),
    principal: cambios.principal,
    terminar,
  };
  const resp = await fetch('/decisiones', { method: 'POST', body: JSON.stringify(carga) });
  if (!resp.ok) { alert('No se pudieron guardar las decisiones.'); return; }
  if (terminar) {
    document.body.innerHTML = '<main><h1>Listo.</h1><p>Ya puedes volver a la terminal: el script sigue con la subida.</p></main>';
  } else {
    location.reload();
  }
}

pintar();
</script>
</body>
</html>
"""


def datos_revision(mapa, rutas, productos):
    nombres = {p["sku"]: p["nombre"] for p in productos}
    por_sku = fotos_por_sku(mapa, solo_subidas=False)
    asignados = []
    for sku in sorted(por_sku):
        fotos = [h for h in por_sku[sku] if h in rutas]
        if not fotos:
            continue
        asignados.append({
            "sku": sku,
            "nombre": nombres.get(sku, "(fuera del catalogo)"),
            "fotos": fotos,
            "principal": fotos[0],
        })
    return {
        "productos": [{"sku": p["sku"], "nombre": p["nombre"]} for p in productos],
        "fotos": {h: {"archivo": e["archivo"], "fecha": e["fecha"]} for h, e in mapa["fotos"].items()},
        "grupos": grupos_pendientes(mapa, rutas),
        "asignados": asignados,
    }


def servir_revision(mapa, rutas, productos, puerto):
    """Levanta la pagina en localhost y bloquea hasta 'Guardar y terminar'."""
    terminado = threading.Event()

    class Manejador(BaseHTTPRequestHandler):
        def log_message(self, *args):
            pass

        def responder(self, cuerpo, tipo="text/html; charset=utf-8", codigo=200):
            self.send_response(codigo)
            self.send_header("Content-Type", tipo)
            self.send_header("Content-Length", str(len(cuerpo)))
            self.end_headers()
            self.wfile.write(cuerpo)

        def do_GET(self):
            if self.path == "/":
                datos = datos_revision(mapa, rutas, productos)
                pagina = PAGINA_HTML.replace("__DATOS__", json.dumps(datos, ensure_ascii=False))
                self.responder(pagina.encode("utf-8"))
            elif self.path.startswith("/miniatura/"):
                h = self.path.rsplit("/", 1)[1]
                ruta = miniatura(rutas, h) if h in rutas else None
                if ruta:
                    with open(ruta, "rb") as f:
                        self.responder(f.read(), "image/jpeg")
                else:
                    self.responder(b"no", "text/plain", 404)
            else:
                self.responder(b"no", "text/plain", 404)

        def do_POST(self):
            if self.path != "/decisiones":
                self.responder(b"no", "text/plain", 404)
                return
            largo = int(self.headers.get("Content-Length", "0"))
            carga = json.loads(self.rfile.read(largo) or b"{}")
            skus_validos = {p["sku"] for p in productos}
            for h, sku in carga.get("asignar", {}).items():
                if h in mapa["fotos"] and sku in skus_validos:
                    mapa["fotos"][h]["sku"] = sku
                    mapa["fotos"][h]["descartada"] = False
            for h in carga.get("descartar", []):
                if h in mapa["fotos"] and not mapa["fotos"][h]["subida"]:
                    mapa["fotos"][h]["descartada"] = True
                    mapa["fotos"][h]["sku"] = None
            for sku, h in carga.get("principal", {}).items():
                for otro, e in mapa["fotos"].items():
                    if e["sku"] == sku:
                        e["principal"] = otro == h
            guardar_mapa(mapa)
            self.responder(b'{"ok": true}', "application/json")
            if carga.get("terminar"):
                terminado.set()

    servidor = ThreadingHTTPServer(("127.0.0.1", puerto), Manejador)
    hilo = threading.Thread(target=servidor.serve_forever, daemon=True)
    hilo.start()
    url = f"http://127.0.0.1:{puerto}/"
    print(f"\nPagina de revision: {url}")
    print("Asigna, descarta o cambia principales y pulsa \"Guardar y terminar\".")
    subprocess.run(["open", url], capture_output=True)
    try:
        terminado.wait()
    except KeyboardInterrupt:
        print("\nRevision interrumpida; lo guardado hasta ahora queda en el mapa.")
    servidor.shutdown()


def main():
    parser = argparse.ArgumentParser(description="Fotos de productos en Cloudinary")
    parser.add_argument("carpeta", nargs="?", help="Carpeta plana con las fotos del celular")
    parser.add_argument("--sin-revision", action="store_true")
    parser.add_argument("--solo-revision", action="store_true")
    parser.add_argument("--puerto", type=int, default=8765)
    parser.add_argument("--reiniciar", action="store_true")
    parser.add_argument("--borrar-cloudinary", action="store_true")
    args = parser.parse_args()

    if args.reiniciar and args.borrar_cloudinary:
        # Juntas violarian el orden seguro: el borrado remoto va DESPUES de
        # desplegar el fotos.json vacio, no en el mismo paso que el vaciado.
        parser.error("--reiniciar y --borrar-cloudinary van en pasos separados: "
                     "primero --reiniciar + deploy, despues --borrar-cloudinary")
    if args.reiniciar or args.borrar_cloudinary:
        env = cargar_env()
        if args.reiniciar:
            reiniciar(env)
        if args.borrar_cloudinary:
            borrar_cloudinary(env)
        return

    if not args.carpeta:
        parser.error("falta la carpeta de fotos (o una de --reiniciar / --borrar-cloudinary)")
    carpeta = os.path.expanduser(args.carpeta)
    if not os.path.isdir(carpeta):
        sys.exit(f"No existe la carpeta {carpeta}")

    env = cargar_env()
    productos, fotos_previas = cargar_catalogo()
    mapa = cargar_mapa()

    rutas, nuevas = escanear(carpeta, mapa)
    asignadas = emparejar(mapa, list(mapa["fotos"]), productos, fotos_previas)
    guardar_mapa(mapa)
    print(f"Fotos en la carpeta: {len(rutas)} ({len(nuevas)} nuevas)")
    if asignadas:
        print(f"Asignadas solas por nombre: {len(asignadas)}")

    pendientes = [h for h in pendientes_de(mapa) if h in rutas]
    if (pendientes and not args.sin_revision) or args.solo_revision:
        servir_revision(mapa, rutas, productos, args.puerto)
        mapa = cargar_mapa()  # relee las decisiones guardadas
        pendientes = [h for h in pendientes_de(mapa) if h in rutas]

    subidas, sin_archivo = subir_pendientes(env, mapa, rutas)
    guardar_mapa(mapa)
    cambio = generar_fotos_json(env, mapa)

    print(f"\nSubidas a Cloudinary: {subidas}")
    if pendientes:
        print(f"Pendientes de asignar (revision): {len(pendientes)}")
    if sin_archivo:
        print(f"Asignadas pero sin archivo en esta carpeta (no se subieron): {len(sin_archivo)}")
    por_sku = fotos_por_sku(mapa, solo_subidas=True)
    print(f"Productos con fotos publicadas: {len(por_sku)} de {len(productos)}")
    print("src/data/fotos.json " + ("regenerado (falta rebuild/deploy del sitio)." if cambio else "sin cambios."))


if __name__ == "__main__":
    main()
