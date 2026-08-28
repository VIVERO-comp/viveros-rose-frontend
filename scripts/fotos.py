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
#   --catalogo      la herramienta del catalogo: buscador, principal/hover/
#                   circulo, recorte, mover, paneles y subida de fotos desde
#                   el navegador (arrastrar o elegir archivos): el archivo se
#                   COPIA a la carpeta pasada por parametro y la asignacion al
#                   producto queda como decision pendiente hasta Guardar.
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
import urllib.parse
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

RAIZ = os.path.normpath(os.path.join(os.path.dirname(__file__), ".."))
MAPA_PATH = os.path.join(RAIZ, "scripts", "fotos-mapa.json")
FOTOS_JSON_PATH = os.path.join(RAIZ, "src", "data", "fotos.json")
PRODUCTS_TS = os.path.join(RAIZ, "src", "data", "products.ts")
MINIATURAS_DIR = os.path.join(RAIZ, "scripts", ".miniaturas")
ORIGINALES_DIR = os.path.join(RAIZ, "scripts", ".originales")
RESPALDOS_DIR = os.path.join(RAIZ, "scripts", "respaldos-fotos-mapa")

EXTENSIONES = {".jpg", ".jpeg", ".png", ".heic", ".webp"}
# Fotos tomadas con menos de 10 minutos de diferencia se agrupan en la
# revision: casi siempre son la misma planta, asi que se decide una sola vez.
BRECHA_GRUPO_SEG = 10 * 60
# Subida desde el navegador: originales del celular sin comprimir (van a la
# carpeta tal cual), asi que el tope es generoso.
MAX_SUBIDA = 40_000_000


def es_imagen(datos):
    """Cabeceras reales de JPEG, PNG, WebP y HEIC; el nombre y el tipo que
    manda el navegador no se creen."""
    return (
        datos[:3] == b"\xff\xd8\xff"
        or datos[:8] == b"\x89PNG\r\n\x1a\n"
        or (datos[:4] == b"RIFF" and datos[8:12] == b"WEBP")
        or (datos[4:8] == b"ftyp" and datos[8:12] in (b"heic", b"heix", b"mif1", b"msf1", b"heif"))
    )


def nombre_libre(carpeta, nombre):
    """Nombre seguro para guardar en la carpeta: solo el nombre base, y con
    sufijo -2, -3... si ya existe otro archivo con ese nombre (el contenido
    distinto ya se comprobo por hash antes de llegar aqui)."""
    nombre = os.path.basename(nombre.replace("\\", "/")).strip().lstrip(".") or "foto.jpg"
    base, ext = os.path.splitext(nombre)
    if ext.lower() not in EXTENSIONES:
        ext = ".jpg"
    candidato = base + ext
    n = 2
    while os.path.exists(os.path.join(carpeta, candidato)):
        candidato = f"{base}-{n}{ext}"
        n += 1
    return candidato


def registrar_subida(mapa, rutas, carpeta, nombre, datos):
    """Guarda una foto subida desde el navegador en la carpeta y la deja
    registrada en memoria (el mapa se escribe recien al Guardar, como toda
    decision). Devuelve (hash, archivo, repetida)."""
    h = hashlib.sha1(datos).hexdigest()[:12]
    if h in rutas:
        # Ya esta en la carpeta con este u otro nombre: no se duplica.
        return h, mapa["fotos"][h]["archivo"], True
    archivo = nombre_libre(carpeta, nombre)
    ruta = os.path.join(carpeta, archivo)
    temporal = ruta + ".parcial"
    with open(temporal, "wb") as f:
        f.write(datos)
    os.replace(temporal, ruta)
    rutas[h] = ruta
    entrada = mapa["fotos"].get(h)
    if entrada is None:
        mapa["fotos"][h] = {
            "archivo": archivo,
            "fecha": fecha_captura(ruta),
            "sku": None,
            "orden": None,
            "principal": False,
            "descartada": False,
            "subida": False,
        }
        return h, archivo, False
    # Foto de una tanda vieja que ya no estaba en la carpeta: vuelve a tener
    # archivo local (asi se puede re-subir si se mueve de producto).
    entrada["archivo"] = archivo
    return h, archivo, True


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


# Fotos de la planta en maceta de color ("maceta-<color>-<slug>.ext"): no
# entran a la lista normal (nunca son principal ni hover); se publican en
# fotos.json bajo macetasPorSku para que el frontend las muestre en la galeria
# (posiciones 2+) y las conecte con el selector de color de maceta.
COLORES_MACETA = ["beige", "gris", "marron"]


def maceta_de(nombre_archivo):
    """(color, slug) si el archivo es una foto de maceta de color, o None."""
    stem = normalizar(os.path.splitext(nombre_archivo)[0])
    m = re.match(rf"^maceta-({'|'.join(COLORES_MACETA)})-(.+)$", stem)
    return (m.group(1), m.group(2)) if m else None


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


_respaldo_hecho = False


def guardar_mapa(mapa):
    # fotos-mapa.json es la unica fuente de las decisiones: antes del primer
    # sobrescrito de cada corrida se guarda una copia con fecha, por si un
    # guardado falla a medias.
    global _respaldo_hecho
    if not _respaldo_hecho and os.path.exists(MAPA_PATH):
        os.makedirs(RESPALDOS_DIR, exist_ok=True)
        marca = datetime.now().strftime("%Y%m%d-%H%M%S")
        with open(MAPA_PATH, "rb") as origen:
            contenido = origen.read()
        with open(os.path.join(RESPALDOS_DIR, f"fotos-mapa-{marca}.json"), "wb") as copia:
            copia.write(contenido)
        _respaldo_hecho = True
    # Escritura atomica: primero un temporal, despues el rename (un corte a
    # mitad de escritura no deja el mapa corrupto).
    temporal = MAPA_PATH + ".tmp"
    with open(temporal, "w", encoding="utf-8") as f:
        json.dump(mapa, f, ensure_ascii=False, indent=2, sort_keys=True)
        f.write("\n")
    os.replace(temporal, MAPA_PATH)


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
        maceta = maceta_de(entrada["archivo"])
        if maceta:
            color, stem = maceta
            sku = por_slug.get(stem) or por_nombre.get(stem)
            if sku:
                entrada["sku"] = sku
                entrada["maceta"] = color
                # Despues de cualquier foto normal, y en el orden fijo de
                # COLORES_MACETA (mismo orden que veran las galerias).
                entrada["orden"] = 900 + COLORES_MACETA.index(color)
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
    # Orden dentro de un producto: principal primero, hover segundo, despues
    # el orden explicito (sufijo del archivo o decision de revision) y por
    # ultimo la fecha de captura.
    return (
        0 if entrada.get("principal") else 1,
        0 if entrada.get("hover") else 1,
        entrada.get("orden") if entrada.get("orden") is not None else 999,
        entrada.get("fecha") or "",
        entrada.get("archivo") or "",
    )


def fotos_por_sku(mapa, solo_subidas=True):
    """Fotos normales (las de maceta van aparte, en macetas_por_sku)."""
    por_sku = {}
    for h, e in mapa["fotos"].items():
        if e["descartada"] or not e["sku"] or e.get("maceta"):
            continue
        if solo_subidas and not e["subida"]:
            continue
        por_sku.setdefault(e["sku"], []).append(h)
    for sku, hashes in por_sku.items():
        hashes.sort(key=lambda h: clave_orden(mapa["fotos"][h]))
    return por_sku


def mano_por_sku(mapa, solo_subidas=True):
    """SKU -> hash de la foto con la mano sosteniendo la planta (la primera
    en el orden de galeria). El frontend la usa en el circulo de cuidado."""
    por_sku = {}
    for sku, hashes in fotos_por_sku(mapa, solo_subidas).items():
        con_mano = [h for h in hashes if mapa["fotos"][h].get("mano")]
        if con_mano:
            por_sku[sku] = con_mano[0]
    return por_sku


def recortes_por_hash(mapa, solo_subidas=True):
    """hash -> [x, y, ancho, alto] en fracciones (0..1) del original. El
    frontend antepone c_crop con estos valores a toda URL de la foto."""
    usados = set()
    for hashes in fotos_por_sku(mapa, solo_subidas).values():
        usados.update(hashes)
    for colores in macetas_por_sku(mapa, solo_subidas).values():
        usados.update(colores.values())
    return {
        h: mapa["fotos"][h]["recorte"]
        for h in usados if mapa["fotos"][h].get("recorte")
    }


def macetas_por_sku(mapa, solo_subidas=True):
    """SKU -> {color: hash} con la foto de la planta en cada color de maceta."""
    por_sku = {}
    for h, e in mapa["fotos"].items():
        color = e.get("maceta")
        if e["descartada"] or not e["sku"] or not color:
            continue
        if solo_subidas and not e["subida"]:
            continue
        por_sku.setdefault(e["sku"], {})[color] = h
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
        entrada["cloud_sku"] = entrada["sku"]  # bajo que SKU vive en Cloudinary
        subidas += 1
        print(f"  Subida {entrada['archivo']} -> {public_id}")
        guardar_mapa(mapa)  # progreso a salvo si la corrida se corta
    return subidas, sin_archivo


def descargar_original(env, entrada, h):
    """Recupera el archivo original de una foto que ya no esta en la carpeta,
    desde Cloudinary (el hash garantiza que es byte a byte el mismo).
    Devuelve la ruta local o None."""
    sku_cloud = entrada.get("cloud_sku") or entrada.get("sku")
    if not sku_cloud:
        return None
    os.makedirs(ORIGINALES_DIR, exist_ok=True)
    destino = os.path.join(ORIGINALES_DIR, f"{h}.jpg")
    if not os.path.exists(destino):
        url = (f"https://res.cloudinary.com/{env['CLOUDINARY_CLOUD_NAME']}"
               f"/image/upload/productos/{sku_cloud}/{h}")
        resultado = subprocess.run(
            ["curl", "-sS", "--fail", url, "-o", destino],
            capture_output=True, text=True, timeout=120,
        )
        if resultado.returncode != 0:
            if os.path.exists(destino):
                os.remove(destino)
            return None
    if hash_archivo(destino) != h:
        os.remove(destino)  # Cloudinary lo recodifico: no sirve como original
        return None
    return destino


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
        "macetasPorSku": macetas_por_sku(mapa, solo_subidas=True),
        "manoPorSku": mano_por_sku(mapa, solo_subidas=True),
        "recortesPorHash": recortes_por_hash(mapa, solo_subidas=True),
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


PAGINA_HTML = r"""<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Fotos del catálogo</title>
<style>
  :root { --verde: #1b5e20; --linea: #d7e0d9; --tinta: #1b2a1f; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, system-ui, sans-serif; margin: 0; color: var(--tinta); background: #f6f8f6; }
  header { position: sticky; top: 0; background: #fff; border-bottom: 1px solid var(--linea); padding: 10px 20px; display: flex; align-items: center; gap: 12px; z-index: 5; flex-wrap: wrap; }
  h1 { font-size: 17px; margin: 0; }
  #buscador { flex: 1; min-width: 220px; }
  main { max-width: 1160px; margin: 0 auto; padding: 20px; }
  h2 { font-size: 15px; margin: 26px 0 10px; }
  input[list], input[type="search"] { padding: 8px 10px; border: 1px solid var(--linea); border-radius: 8px; font-size: 14px; }
  figure input[list] { min-width: 0; width: 100%; font-size: 12px; padding: 6px 8px; margin-top: 4px; }
  .grupo, .prod { background: #fff; border: 1px solid var(--linea); border-radius: 10px; padding: 14px; margin-bottom: 14px; }
  .grupo-cab { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-bottom: 10px; }
  .grupo-cab .fecha { color: #667; font-size: 12px; }
  .grupo-cab input[list] { min-width: 300px; }
  .fila-fotos { display: flex; gap: 12px; flex-wrap: wrap; }
  figure { margin: 0; width: 152px; }
  figure img { width: 152px; height: 152px; object-fit: cover; border-radius: 8px; display: block; border: 2px solid transparent; }
  figure.descartada img { opacity: 0.3; }
  figure.principal img { border-color: var(--verde); }
  figcaption { font-size: 11px; color: #667; word-break: break-all; margin-top: 4px; min-height: 14px; }
  .acciones { display: flex; gap: 4px; margin-top: 4px; flex-wrap: wrap; }
  button { font-size: 12px; padding: 4px 7px; border-radius: 6px; border: 1px solid var(--linea); background: #fff; cursor: pointer; }
  button:hover { border-color: #9ab3a0; }
  button.primario { background: var(--verde); border-color: var(--verde); color: #fff; font-size: 14px; padding: 8px 16px; }
  button.primario:disabled { opacity: 0.5; cursor: default; }
  .acciones-roles button { border-color: #b8ccbc; }
  .prod h3 { font-size: 14px; margin: 0 0 10px; }
  .aviso { background: #fff8e1; border: 1px solid #e8d9a0; border-radius: 8px; padding: 10px 14px; font-size: 13px; }
  #estado { font-size: 13px; color: #667; }
  .et { display: inline-block; font-size: 9px; font-weight: 700; letter-spacing: 0.4px; border-radius: 4px; padding: 1px 4px; margin: 0 3px 2px 0; color: #fff; }
  .et-verde { background: var(--verde); }
  .et-azul { background: #1565c0; }
  .et-lila { background: #6a3fa0; }
  .et-gris { background: #667; }

  /* Pareja tarjeta/hover + circulo, como se ven en el sitio. */
  .pareja { display: flex; gap: 18px; align-items: flex-start; margin-bottom: 12px; }
  .ctx { background-color: #eef1ee; background-repeat: no-repeat; border: 1px solid var(--linea); position: relative; overflow: hidden; }
  .ctx-tarjeta { width: 168px; height: 210px; border-radius: 12px; }
  .ctx-capa { position: absolute; inset: 0; background-repeat: no-repeat; opacity: 0; transition: opacity 0.3s; }
  .ctx-tarjeta:hover .ctx-capa { opacity: 1; }
  .ctx-circulo { width: 120px; height: 120px; border-radius: 50%; }
  .ctx-titulo { font-size: 10px; color: #667; text-align: center; margin-top: 4px; }
  .panel { background: #fff; border: 1px solid var(--linea); border-radius: 10px; padding: 4px 14px; margin-bottom: 10px; }
  .panel summary { font-size: 14px; font-weight: 600; padding: 8px 0; cursor: pointer; }
  .panel ul { margin: 4px 0 12px; padding-left: 18px; font-size: 13px; }
  .panel li { margin-bottom: 3px; }
  .mover { margin-top: 4px; }
  .mover input[list] { width: 100%; font-size: 12px; padding: 6px 8px; }

  .zona-subir { margin-top: 12px; border: 2px dashed #b9c9bd; border-radius: 10px; padding: 10px 12px; font-size: 13px; color: #445; display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
  .zona-subir.arrastrando { border-color: var(--verde); background: #eef5ef; }
  .zona-subir .progreso { color: var(--verde); }
  .zona-subir .error { color: #c62828; }
  .panel li button { margin-left: 8px; font-size: 12px; padding: 3px 8px; }
  #recorte-fondo { position: fixed; inset: 0; background: rgba(20, 30, 22, 0.55); display: flex; align-items: center; justify-content: center; z-index: 20; }
  #recorte-fondo[hidden] { display: none; }
  #recorte-caja { background: #fff; border-radius: 12px; padding: 16px; max-width: min(94vw, 1040px); }
  #recorte-caja p { margin: 0 0 10px; font-size: 13px; color: #445; }
  #recorte-cuerpo { display: flex; gap: 18px; align-items: flex-start; flex-wrap: wrap; }
  #recorte-marco { position: relative; display: inline-block; touch-action: none; cursor: crosshair; }
  #recorte-marco img { display: block; max-width: min(70vw, 620px); max-height: 60vh; user-select: none; -webkit-user-drag: none; }
  #recorte-sel { position: absolute; border: 2px solid #fff; outline: 2px dashed var(--verde); background: rgba(27, 94, 32, 0.18); pointer-events: none; }
  .recorte-botones { display: flex; gap: 8px; margin-top: 12px; }
</style>
</head>
<body>
<header>
  <h1>Fotos del catálogo</h1>
  <input id="buscador" type="search" placeholder="Buscar producto por nombre o SKU…" oninput="pintar()">
  <span id="estado"></span>
  <button id="btn-deshacer" onclick="deshacer()" disabled>Deshacer</button>
  <button class="primario" onclick="guardar(false)">Guardar</button>
  <button class="primario" onclick="guardar(true)">Guardar y terminar</button>
</header>
<main>
  <div id="contenido"></div>
</main>
<input type="file" id="selector" multiple accept="image/*,.heic" hidden onchange="subirArchivos(skuSelector, this.files); this.value = '';">
<div id="recorte-fondo" hidden onclick="if (event.target === this) cerrarRecorte()">
  <div id="recorte-caja">
    <p>Arrastra sobre la foto para marcar la parte que se verá. A la derecha, cómo queda en la tarjeta y en el círculo.</p>
    <div id="recorte-cuerpo">
      <div id="recorte-marco"
           onpointerdown="recorteDown(event)" onpointermove="recorteMove(event)"
           onpointerup="recorteUp()" onpointerleave="recorteUp()">
        <img id="recorte-img" draggable="false">
        <div id="recorte-sel" hidden></div>
      </div>
      <div>
        <div class="ctx ctx-tarjeta" id="prev-tarjeta"></div>
        <div class="ctx-titulo">Tarjeta / galería</div>
        <div class="ctx ctx-circulo" id="prev-circulo" style="margin-top:12px"></div>
        <div class="ctx-titulo">Círculo de cuidado</div>
      </div>
    </div>
    <div class="recorte-botones">
      <button class="primario" onclick="guardarRecorte()">Usar este recorte</button>
      <button onclick="limpiarRecorte()">Sin recorte</button>
      <button onclick="cerrarRecorte()">Cancelar</button>
    </div>
  </div>
</div>
<script>
const DATOS = __DATOS__;
const CARPETA = __CARPETA__;  // null cuando se corrio sin carpeta: no se puede subir
let cambios = { asignar: {}, descartar: {}, quitar: {}, principal: {}, hover: {}, circulo: {}, recortes: {} };

// --- Deshacer: una pila de instantáneas del estado local (nada esta
// guardado hasta pulsar Guardar, así que revertir es solo restaurar). ---
const pila = [];

function accion(etiqueta) {
  pila.push({ etiqueta, estado: structuredClone({
    cambios, asignados: DATOS.asignados, fotos: DATOS.fotos, sueltas: DATOS.sueltas, grupos: DATOS.grupos,
  }) });
  if (pila.length > 80) pila.shift();
}

function deshacer() {
  const ultimo = pila.pop();
  if (!ultimo) return;
  cambios = ultimo.estado.cambios;
  DATOS.asignados = ultimo.estado.asignados;
  DATOS.fotos = ultimo.estado.fotos;
  DATOS.sueltas = ultimo.estado.sueltas;
  DATOS.grupos = ultimo.estado.grupos;
  pintar();
  refrescarEstado();
}

function normalizar(s) {
  return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function opcionesProductos() {
  return DATOS.productos.map(p => `<option value="${p.sku} — ${p.nombre}"></option>`).join('');
}

function skuDeEntrada(valor) {
  const sku = (valor || '').split('—')[0].trim();
  return DATOS.productos.some(p => p.sku === sku) ? sku : null;
}

// Fichas de foto ----------------------------------------------------------

function fichaPendiente(h) {
  const descartada = cambios.descartar[h] ? 'descartada' : '';
  return `
    <figure id="fig-${h}" class="${descartada}">
      <img src="/miniatura/${h}" alt="">
      <figcaption>${DATOS.fotos[h].archivo}</figcaption>
      <input list="productos" placeholder="¿Qué es?" oninput="asignarFoto('${h}', this)">
      <div class="acciones"><button onclick="alternarDescarte('${h}')">Descartar</button></div>
    </figure>`;
}

function fichaAsignada(prod, h) {
  const marcas = [
    prod.principal === h ? '<span class="et et-verde">PRINCIPAL</span>' : '',
    prod.hover === h ? '<span class="et et-azul">HOVER</span>' : '',
    prod.circulo === h ? '<span class="et et-lila">CÍRCULO</span>' : '',
    DATOS.fotos[h].recorte ? '<span class="et et-gris">RECORTADA</span>' : '',
  ].join('');
  return `
    <figure id="fig-${h}" class="${prod.principal === h ? 'principal' : ''}">
      <img src="/miniatura/${h}" alt="">
      <figcaption>${marcas}${DATOS.fotos[h].archivo}</figcaption>
      <div class="acciones acciones-roles">
        <button onclick="hacerPrincipal('${prod.sku}', '${h}')">Principal</button>
        <button onclick="hacerHover('${prod.sku}', '${h}')">Hover</button>
        <button onclick="hacerCirculo('${prod.sku}', '${h}')">Círculo</button>
      </div>
      <div class="acciones">
        <button onclick="abrirRecorte('${h}')">Recortar</button>
        <button onclick="alternarMover('${h}')">Mover a…</button>
        <button onclick="desasignarFoto('${prod.sku}', '${h}')">Desasignar</button>
        <button onclick="descartarAsignada('${prod.sku}', '${h}')">Descartar</button>
      </div>
      <div class="mover" id="mover-${h}" hidden>
        <input list="productos" placeholder="Producto destino…" oninput="moverFoto('${prod.sku}', '${h}', this)">
      </div>
    </figure>`;
}

// Sospechosas: el nombre del archivo no cuadra con el producto asignado.
function esSospechosa(prod, h) {
  const stem = normalizar(DATOS.fotos[h].archivo.replace(/\.[a-z0-9]+$/i, ''));
  const tokens = stem.split('-').filter(t =>
    t.length >= 3 && !/^\d+$/.test(t) &&
    !['photo', 'img', 'principal', 'hover', 'foto', 'plant', 'jpeg'].includes(t));
  if (!tokens.length) return false;  // PHOTO-2026-… no dice nada
  const objetivo = normalizar(`${prod.sku} ${prod.slug || ''} ${prod.nombre}`);
  const palabras = objetivo.split('-').filter(p => p.length >= 4);
  return !tokens.some(t => objetivo.includes(t) || palabras.some(p => t.includes(p)));
}

function pintar() {
  const c = document.getElementById('contenido');
  const filtro = normalizar(document.getElementById('buscador').value).replace(/-/g, ' ');
  let html = '';

  // Paneles -------------------------------------------------------------
  const conFoto = new Set(DATOS.asignados.filter(p => p.fotos.length).map(p => p.sku));
  const sinFoto = DATOS.productos.filter(p => !conFoto.has(p.sku));
  const pendTotal = DATOS.grupos.reduce((n, g) => n + g.length, 0) + DATOS.sueltas.length;
  const sospechosas = [];
  DATOS.asignados.forEach(prod => prod.fotos.forEach(h => {
    if (esSospechosa(prod, h)) sospechosas.push({ prod, h });
  }));

  html += `<details class="panel"><summary>Productos sin foto (${sinFoto.length})</summary><ul>` +
    sinFoto.map(p => `<li>${p.sku} — ${p.nombre}` +
      (CARPETA ? `<button onclick="elegirArchivos('${p.sku}')">Subir fotos</button>` : '') +
      (subidas[p.sku] ? ` <span class="progreso">${subidas[p.sku].texto || ''}</span><span class="error">${subidas[p.sku].errores.join(' · ')}</span>` : '') +
      '</li>').join('') + '</ul></details>';

  html += `<details class="panel" ${pendTotal ? 'open' : ''}><summary>Fotos sin producto (${pendTotal})</summary>`;
  if (pendTotal) {
    html += `<p class="aviso">Escribe debajo de cada foto qué producto es (por nombre o SKU). El campo del grupo asigna el grupo entero; lo escrito foto por foto manda.</p>`;
    DATOS.grupos.forEach((grupo, gi) => {
      html += `<div class="grupo">
        <div class="grupo-cab">
          <input list="productos" id="grupo-${gi}" placeholder="SKU o nombre para todo el grupo…" oninput="asignarGrupo(${gi}, this.value)">
          <span class="fecha">${DATOS.fotos[grupo[0]].fecha}</span>
        </div>
        <div class="fila-fotos">` + grupo.map(fichaPendiente).join('') + '</div></div>';
    });
    if (DATOS.sueltas.length) {
      html += `<div class="grupo"><div class="grupo-cab"><span class="fecha">Sin archivo local (vienen de Cloudinary)</span></div>
        <div class="fila-fotos">` + DATOS.sueltas.map(fichaPendiente).join('') + '</div></div>';
    }
  } else {
    html += '<ul><li>Ninguna.</li></ul>';
  }
  html += '</details>';

  html += `<details class="panel"><summary>Asignaciones sospechosas (${sospechosas.length})</summary><ul>` +
    (sospechosas.length
      ? sospechosas.map(s => `<li><b>${DATOS.fotos[s.h].archivo}</b> está en ${s.prod.sku} — ${s.prod.nombre}</li>`).join('')
      : '<li>Ninguna: todos los nombres de archivo cuadran.</li>') +
    '</ul></details>';

  // Productos con fotos --------------------------------------------------
  html += '<h2>Productos con fotos</h2>';
  html += `<p class="aviso"><b>Principal</b> = tarjeta y 1ª de la galería · <b>Hover</b> = 2ª (al pasar el mouse) · <b>Círculo</b> = "Cuidado de…" · <b>Recortar</b> = elegir qué parte se ve · <b>Mover a…</b> = a otro producto · <b>Desasignar</b> = vuelve a pendientes · <b>Descartar</b> = eliminar del sitio. Pasa el mouse sobre la mini-tarjeta para ver el hover como en el sitio.</p>`;
  DATOS.asignados.forEach(prod => {
    if (!prod.fotos.length) return;
    if (filtro && !normalizar(`${prod.sku} ${prod.nombre}`).replace(/-/g, ' ').includes(filtro)) return;
    const circulo = prod.circulo || prod.principal;
    html += `<div class="prod"><h3>${prod.sku} — ${prod.nombre}</h3>
      <div class="pareja">
        <div>
          <div class="ctx ctx-tarjeta" data-ctx data-h="${prod.principal || ''}">
            ${prod.hover ? `<div class="ctx-capa" data-ctx data-h="${prod.hover}"></div>` : ''}
          </div>
          <div class="ctx-titulo">Tarjeta ${prod.hover ? '(pasa el mouse: hover)' : '(sin hover)'}</div>
        </div>
        <div>
          <div class="ctx ctx-circulo" data-ctx data-h="${circulo || ''}"></div>
          <div class="ctx-titulo">Círculo</div>
        </div>
      </div>
      <div class="fila-fotos">` + prod.fotos.map(h => fichaAsignada(prod, h)).join('') + '</div>' +
      zonaSubir(prod.sku) + '</div>';
  });

  html += `<datalist id="productos">${opcionesProductos()}</datalist>`;
  c.innerHTML = html;
  aplicarContextos();
  actualizarDeshacer();
}

// --- Subida desde el navegador ------------------------------------------
// El archivo se copia a la carpeta de fotos (la del parámetro) y queda
// registrado en el servidor; la asignación al producto es una decisión más
// (cambios.asignar) y se persiste con Guardar, como todo lo demás.
const subidas = {};  // sku -> { texto, errores[] }
let skuSelector = null;

function zonaSubir(sku) {
  if (!CARPETA) return '<div class="zona-subir">Para subir fotos corre el script con la carpeta de fotos.</div>';
  const est = subidas[sku] || { texto: '', errores: [] };
  return `<div class="zona-subir" data-sku="${sku}"
      ondragover="event.preventDefault(); this.classList.add('arrastrando')"
      ondragleave="this.classList.remove('arrastrando')"
      ondrop="event.preventDefault(); this.classList.remove('arrastrando'); subirArchivos('${sku}', event.dataTransfer.files)">
    <span>Subir fotos a este producto: arrastra aquí o</span>
    <button onclick="elegirArchivos('${sku}')">Elegir archivos…</button>
    <span class="progreso">${est.texto}</span>
    <span class="error">${est.errores.join(' · ')}</span>
  </div>`;
}

function elegirArchivos(sku) {
  skuSelector = sku;
  document.getElementById('selector').click();
}

// Deja la foto en el producto, venga de donde venga: nueva, pendiente
// (grupos/sueltas) o asignada a otro producto (entonces es un "mover").
function incorporarFoto(sku, h, archivo) {
  DATOS.grupos = DATOS.grupos.map(g => g.filter(x => x !== h)).filter(g => g.length);
  DATOS.sueltas = DATOS.sueltas.filter(x => x !== h);
  DATOS.asignados.forEach(p => { if (p.sku !== sku && p.fotos.includes(h)) sacarDeProducto(p, h); });
  if (!DATOS.fotos[h]) DATOS.fotos[h] = { archivo, fecha: '', recorte: null };
  let destino = prodDe(sku);
  if (!destino) {
    const p = DATOS.productos.find(x => x.sku === sku);
    destino = { sku, nombre: p.nombre, slug: p.slug, fotos: [], principal: null, hover: null, circulo: null };
    DATOS.asignados.push(destino);
    DATOS.asignados.sort((a, b) => a.sku.localeCompare(b.sku));
  }
  if (!destino.fotos.includes(h)) destino.fotos.push(h);
  if (!destino.principal) destino.principal = h;
  cambios.asignar[h] = sku;
  delete cambios.quitar[h];
  delete cambios.descartar[h];
}

async function subirArchivos(sku, archivos) {
  const lista = Array.from(archivos || []).filter(a => a.size);
  if (!sku || !lista.length) return;
  accion('subir');
  const est = subidas[sku] = { texto: '', errores: [] };
  let nuevas = 0, repetidas = 0;
  for (let i = 0; i < lista.length; i++) {
    const a = lista[i];
    est.texto = `Subiendo ${i + 1} de ${lista.length}: ${a.name}…`;
    pintar();
    try {
      const resp = await fetch(`/subir?sku=${encodeURIComponent(sku)}&nombre=${encodeURIComponent(a.name)}`, {
        method: 'POST', body: a,
      });
      const r = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(r.error || `error ${resp.status}`);
      incorporarFoto(sku, r.hash, r.archivo);
      if (r.repetida) repetidas++; else nuevas++;
    } catch (e) {
      est.errores.push(`${a.name}: ${e.message}`);
    }
  }
  est.texto = `${nuevas} copiada${nuevas === 1 ? '' : 's'} a la carpeta` +
    (repetidas ? `, ${repetidas} ya estaba${repetidas === 1 ? '' : 'n'}` : '') +
    '. Pulsa Guardar para asignar y subir a Cloudinary.';
  pintar(); refrescarEstado();
}

// --- Previsualizaciones fieles: misma matemática de cover que el sitio ---
const dimensiones = {};  // hash -> {w, h}

function conDimensiones(h, fn) {
  if (dimensiones[h]) { fn(dimensiones[h]); return; }
  const img = new Image();
  img.onload = () => { dimensiones[h] = { w: img.naturalWidth, h: img.naturalHeight }; fn(dimensiones[h]); };
  img.src = `/foto/${h}`;
}

function pintarCover(el, h, rec) {
  if (!h) { el.style.backgroundImage = ''; return; }
  conDimensiones(h, dim => {
    const cw = el.clientWidth, ch = el.clientHeight;
    if (!cw || !ch) return;
    const [rx, ry, rw, rh] = rec || [0, 0, 1, 1];
    const escala = Math.max(cw / (rw * dim.w), ch / (rh * dim.h));
    el.style.backgroundImage = `url('/foto/${h}')`;
    el.style.backgroundSize = `${dim.w * escala}px ${dim.h * escala}px`;
    el.style.backgroundPosition =
      `${cw / 2 - (rx + rw / 2) * dim.w * escala}px ${ch / 2 - (ry + rh / 2) * dim.h * escala}px`;
  });
}

function aplicarContextos() {
  document.querySelectorAll('[data-ctx]').forEach(el => {
    const h = el.dataset.h;
    pintarCover(el, h, h && (h in cambios.recortes ? cambios.recortes[h] : DATOS.fotos[h]?.recorte));
  });
}

// --- Acciones sobre pendientes ---
const individuales = {};

function asignarGrupo(gi, valor) {
  const sku = skuDeEntrada(valor);
  document.getElementById(`grupo-${gi}`).style.borderColor = sku ? 'var(--verde)' : '';
  accion('asignar grupo');
  DATOS.grupos[gi].forEach(h => {
    if (!cambios.descartar[h] && !individuales[h]) cambios.asignar[h] = sku;
  });
  refrescarEstado();
}

function asignarFoto(h, campo) {
  const valor = campo.value;
  const sku = skuDeEntrada(valor);
  individuales[h] = Boolean(valor.trim());
  accion('asignar foto');
  if (sku) {
    cambios.asignar[h] = sku;
    delete cambios.descartar[h];
    document.getElementById(`fig-${h}`).classList.remove('descartada');
  } else {
    delete cambios.asignar[h];
  }
  campo.style.borderColor = sku ? 'var(--verde)' : (valor.trim() ? '#c62828' : '');
  refrescarEstado();
}

function alternarDescarte(h) {
  accion('descartar');
  cambios.descartar[h] = !cambios.descartar[h];
  if (cambios.descartar[h]) { delete cambios.asignar[h]; delete cambios.quitar[h]; }
  document.getElementById(`fig-${h}`).classList.toggle('descartada', cambios.descartar[h]);
  refrescarEstado();
}

// --- Acciones sobre fotos asignadas ---
function prodDe(sku) { return DATOS.asignados.find(p => p.sku === sku); }

function sacarDeProducto(prod, h) {
  prod.fotos = prod.fotos.filter(x => x !== h);
  if (prod.principal === h) prod.principal = prod.fotos[0] || null;
  if (prod.hover === h) prod.hover = null;
  if (prod.circulo === h) prod.circulo = null;
}

function hacerPrincipal(sku, h) {
  accion('principal');
  const prod = prodDe(sku);
  cambios.principal[sku] = h;
  prod.principal = h;
  if (prod.hover === h) prod.hover = null;
  pintar(); refrescarEstado();
}

function hacerHover(sku, h) {
  accion('hover');
  const prod = prodDe(sku);
  cambios.hover[sku] = h;
  prod.hover = h;
  if (prod.principal === h) prod.principal = null;
  pintar(); refrescarEstado();
}

function hacerCirculo(sku, h) {
  accion('círculo');
  const prod = prodDe(sku);
  cambios.circulo[sku] = prod.circulo === h ? null : h;
  prod.circulo = cambios.circulo[sku];
  pintar(); refrescarEstado();
}

function alternarMover(h) {
  const div = document.getElementById(`mover-${h}`);
  div.hidden = !div.hidden;
  if (!div.hidden) div.querySelector('input').focus();
}

function moverFoto(skuOrigen, h, campo) {
  const sku = skuDeEntrada(campo.value);
  campo.style.borderColor = sku ? 'var(--verde)' : (campo.value.trim() ? '#c62828' : '');
  if (!sku || sku === skuOrigen) return;
  accion('mover');
  sacarDeProducto(prodDe(skuOrigen), h);
  let destino = prodDe(sku);
  if (!destino) {
    const p = DATOS.productos.find(x => x.sku === sku);
    destino = { sku, nombre: p.nombre, slug: p.slug, fotos: [], principal: null, hover: null, circulo: null };
    DATOS.asignados.push(destino);
    DATOS.asignados.sort((a, b) => a.sku.localeCompare(b.sku));
  }
  destino.fotos.push(h);
  if (!destino.principal) destino.principal = h;
  cambios.asignar[h] = sku;
  delete cambios.quitar[h];
  delete cambios.descartar[h];
  pintar(); refrescarEstado();
}

function desasignarFoto(sku, h) {
  accion('desasignar');
  sacarDeProducto(prodDe(sku), h);
  DATOS.sueltas.push(h);
  cambios.quitar[h] = true;
  delete cambios.asignar[h];
  pintar(); refrescarEstado();
}

function descartarAsignada(sku, h) {
  accion('descartar');
  sacarDeProducto(prodDe(sku), h);
  cambios.descartar[h] = true;
  delete cambios.asignar[h];
  delete cambios.quitar[h];
  pintar(); refrescarEstado();
}

// --- Recorte -------------------------------------------------------------
let hRecorte = null;
let selInicio = null;

function recorteActual() {
  return hRecorte in cambios.recortes ? cambios.recortes[hRecorte] : DATOS.fotos[hRecorte].recorte;
}

function abrirRecorte(h) {
  hRecorte = h;
  const img = document.getElementById('recorte-img');
  const sel = document.getElementById('recorte-sel');
  sel.hidden = true;
  img.onload = () => {
    const rec = recorteActual();
    if (rec) pintarSel(rec);
    previsualizarRecorte(rec);
  };
  img.src = `/foto/${h}`;
  document.getElementById('recorte-fondo').hidden = false;
  if (img.complete && img.naturalWidth) img.onload();
}

function previsualizarRecorte(rec) {
  pintarCover(document.getElementById('prev-tarjeta'), hRecorte, rec);
  pintarCover(document.getElementById('prev-circulo'), hRecorte, rec);
}

function pintarSel([x, y, w, h]) {
  const img = document.getElementById('recorte-img');
  const sel = document.getElementById('recorte-sel');
  sel.style.left = `${x * img.clientWidth}px`;
  sel.style.top = `${y * img.clientHeight}px`;
  sel.style.width = `${w * img.clientWidth}px`;
  sel.style.height = `${h * img.clientHeight}px`;
  sel.hidden = false;
}

function seleccionFracciones() {
  const img = document.getElementById('recorte-img');
  const sel = document.getElementById('recorte-sel');
  if (sel.hidden || sel.offsetWidth < 10 || sel.offsetHeight < 10) return null;
  return [
    sel.offsetLeft / img.clientWidth,
    sel.offsetTop / img.clientHeight,
    sel.offsetWidth / img.clientWidth,
    sel.offsetHeight / img.clientHeight,
  ].map(v => Math.round(v * 10000) / 10000);
}

function puntoEnImagen(ev) {
  const r = document.getElementById('recorte-img').getBoundingClientRect();
  return [
    Math.min(Math.max(ev.clientX - r.left, 0), r.width),
    Math.min(Math.max(ev.clientY - r.top, 0), r.height),
  ];
}

function recorteDown(ev) {
  ev.preventDefault();
  selInicio = puntoEnImagen(ev);
}

function recorteMove(ev) {
  if (!selInicio) return;
  const [x2, y2] = puntoEnImagen(ev);
  const img = document.getElementById('recorte-img');
  pintarSel([
    Math.min(selInicio[0], x2) / img.clientWidth,
    Math.min(selInicio[1], y2) / img.clientHeight,
    Math.abs(x2 - selInicio[0]) / img.clientWidth,
    Math.abs(y2 - selInicio[1]) / img.clientHeight,
  ]);
  previsualizarRecorte(seleccionFracciones());
}

function recorteUp() {
  if (selInicio) previsualizarRecorte(seleccionFracciones() || recorteActual());
  selInicio = null;
}

function guardarRecorte() {
  const rec = seleccionFracciones();
  if (rec) {
    accion('recorte');
    cambios.recortes[hRecorte] = rec;
    DATOS.fotos[hRecorte].recorte = rec;
  }
  cerrarRecorte(); pintar(); refrescarEstado();
}

function limpiarRecorte() {
  accion('recorte');
  cambios.recortes[hRecorte] = null;
  DATOS.fotos[hRecorte].recorte = null;
  cerrarRecorte(); pintar(); refrescarEstado();
}

function cerrarRecorte() {
  document.getElementById('recorte-fondo').hidden = true;
  hRecorte = null;
  selInicio = null;
}

// --- Estado y guardado ---------------------------------------------------
function actualizarDeshacer() {
  const b = document.getElementById('btn-deshacer');
  b.disabled = !pila.length;
  b.textContent = pila.length ? `Deshacer (${pila[pila.length - 1].etiqueta})` : 'Deshacer';
}

function refrescarEstado() {
  const n = Object.values(cambios.asignar).filter(Boolean).length +
    Object.values(cambios.descartar).filter(Boolean).length +
    Object.values(cambios.quitar).filter(Boolean).length +
    Object.keys(cambios.principal).length +
    Object.keys(cambios.hover).length +
    Object.keys(cambios.circulo).length +
    Object.keys(cambios.recortes).length;
  document.getElementById('estado').textContent = n ? `${n} decisiones sin guardar` : '';
  actualizarDeshacer();
}

async function guardar(terminar) {
  const carga = {
    asignar: Object.fromEntries(Object.entries(cambios.asignar).filter(([, v]) => v)),
    descartar: Object.keys(cambios.descartar).filter(h => cambios.descartar[h]),
    quitar: Object.keys(cambios.quitar).filter(h => cambios.quitar[h]),
    principal: cambios.principal,
    hover: cambios.hover,
    circulo: cambios.circulo,
    recortes: cambios.recortes,
    terminar,
  };
  document.getElementById('estado').textContent = 'Guardando… (si hay fotos movidas, se re-suben a Cloudinary)';
  const resp = await fetch('/decisiones', { method: 'POST', body: JSON.stringify(carga) });
  if (!resp.ok) {
    document.getElementById('estado').textContent = '';
    alert('No se pudieron guardar las decisiones.');
    return;
  }
  if (terminar) {
    document.body.innerHTML = '<main><h1>Listo.</h1><p>Decisiones guardadas y fotos.json regenerado. Ya puedes cerrar esta pestaña.</p></main>';
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
    mano = mano_por_sku(mapa, solo_subidas=False)
    asignados = []
    for sku in sorted(por_sku):
        # TODAS las fotos del producto, tambien las de tandas viejas que ya
        # no estan en la carpeta (la miniatura sale de Cloudinary).
        fotos = por_sku[sku]
        asignados.append({
            "sku": sku,
            "nombre": nombres.get(sku, "(fuera del catalogo)"),
            "fotos": fotos,
            "principal": fotos[0],
            "hover": fotos[1] if len(fotos) > 1 else None,
            "circulo": mano.get(sku),
        })
    # Pendientes de tandas viejas (o desasignadas) sin archivo en la carpeta:
    # no entran a los grupos por fecha, van sueltas (miniatura via Cloudinary).
    sueltas = [h for h in pendientes_de(mapa) if h not in rutas]
    sueltas.sort(key=lambda h: mapa["fotos"][h]["archivo"])
    return {
        "productos": [
            {"sku": p["sku"], "nombre": p["nombre"], "slug": p["slug"]}
            for p in productos
        ],
        "fotos": {
            h: {
                "archivo": e["archivo"],
                "fecha": e["fecha"],
                "recorte": e.get("recorte"),
            }
            for h, e in mapa["fotos"].items()
        },
        "grupos": grupos_pendientes(mapa, rutas),
        "sueltas": sueltas,
        "asignados": asignados,
    }


def servir_revision(env, mapa, rutas, productos, puerto, carpeta=None):
    """Levanta la pagina en localhost y bloquea hasta 'Guardar y terminar'.
    Con carpeta, la pagina permite subir fotos (se copian ahi)."""
    terminado = threading.Event()
    base_cloud = f"https://res.cloudinary.com/{env['CLOUDINARY_CLOUD_NAME']}/image/upload"

    def url_cloud(h, ancho):
        e = mapa["fotos"].get(h)
        if e and e.get("subida") and e.get("sku"):
            return f"{base_cloud}/f_jpg,c_fit,w_{ancho}/productos/{e['sku']}/{h}"
        return None

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
                pagina = (
                    PAGINA_HTML
                    .replace("__DATOS__", json.dumps(datos, ensure_ascii=False))
                    .replace("__CARPETA__", json.dumps(carpeta))
                )
                self.responder(pagina.encode("utf-8"))
            elif self.path.startswith("/miniatura/"):
                h = self.path.rsplit("/", 1)[1]
                ruta = miniatura(rutas, h) if h in rutas else None
                if ruta:
                    with open(ruta, "rb") as f:
                        self.responder(f.read(), "image/jpeg")
                else:
                    # Foto de una tanda vieja sin archivo local: la sirve
                    # Cloudinary, que la tiene subida.
                    remota = url_cloud(h, 300)
                    if remota:
                        self.send_response(302)
                        self.send_header("Location", remota)
                        self.end_headers()
                    else:
                        self.responder(b"no", "text/plain", 404)
            elif self.path.startswith("/foto/"):
                # Vista grande para el recorte.
                h = self.path.rsplit("/", 1)[1]
                if h in rutas:
                    os.makedirs(MINIATURAS_DIR, exist_ok=True)
                    destino = os.path.join(MINIATURAS_DIR, f"{h}-grande.jpg")
                    if not os.path.exists(destino):
                        subprocess.run(
                            ["sips", "-Z", "1100", "-s", "format", "jpeg", rutas[h], "--out", destino],
                            capture_output=True, timeout=30,
                        )
                    if os.path.exists(destino):
                        with open(destino, "rb") as f:
                            self.responder(f.read(), "image/jpeg")
                        return
                remota = url_cloud(h, 1100)
                if remota:
                    self.send_response(302)
                    self.send_header("Location", remota)
                    self.end_headers()
                else:
                    self.responder(b"no", "text/plain", 404)
            else:
                self.responder(b"no", "text/plain", 404)

        def responder_json(self, datos, codigo=200):
            self.responder(json.dumps(datos, ensure_ascii=False).encode("utf-8"), "application/json", codigo)

        def do_POST(self):
            if self.path.startswith("/subir?"):
                self.subir()
                return
            if self.path != "/decisiones":
                self.responder(b"no", "text/plain", 404)
                return
            largo = int(self.headers.get("Content-Length", "0"))
            carga = json.loads(self.rfile.read(largo) or b"{}")
            skus_validos = {p["sku"] for p in productos}
            for h, sku in carga.get("asignar", {}).items():
                if h in mapa["fotos"] and sku in skus_validos:
                    entrada = mapa["fotos"][h]
                    if entrada.get("sku") != sku:
                        if entrada["subida"]:
                            # En Cloudinary vive bajo el SKU viejo: recordarlo
                            # (para recuperar el original) y re-subirla.
                            entrada.setdefault("cloud_sku", entrada.get("sku"))
                            entrada["subida"] = False
                        # Los roles no viajan al producto nuevo.
                        entrada["principal"] = False
                        entrada["hover"] = False
                        entrada["mano"] = False
                        entrada["orden"] = None
                    entrada["sku"] = sku
                    entrada["descartada"] = False
            for h in carga.get("quitar", []):
                # Vuelve a pendientes: pierde el producto pero se puede reasignar.
                if h in mapa["fotos"]:
                    entrada = mapa["fotos"][h]
                    if entrada["subida"]:
                        entrada.setdefault("cloud_sku", entrada.get("sku"))
                    entrada["sku"] = None
                    entrada["orden"] = None
                    entrada["principal"] = False
                    entrada["hover"] = False
                    entrada["mano"] = False
                    entrada["descartada"] = False
                    entrada.pop("maceta", None)
            for h in carga.get("descartar", []):
                # Tambien las ya subidas: solo salen de fotos.json, Cloudinary
                # guarda el archivo pero nada lo referencia.
                if h in mapa["fotos"]:
                    mapa["fotos"][h]["descartada"] = True
                    mapa["fotos"][h]["sku"] = None
                    mapa["fotos"][h]["principal"] = False
            for sku, h in carga.get("principal", {}).items():
                for otro, e in mapa["fotos"].items():
                    if e["sku"] == sku:
                        e["principal"] = otro == h
                        if otro == h:
                            e["hover"] = False  # una foto no es ambas cosas
            for sku, h in carga.get("hover", {}).items():
                for otro, e in mapa["fotos"].items():
                    if e["sku"] == sku:
                        e["hover"] = otro == h
                        if otro == h:
                            e["principal"] = False
            for sku, h in carga.get("circulo", {}).items():
                # h puede ser null: ningun circulo explicito para ese SKU.
                for otro, e in mapa["fotos"].items():
                    if e["sku"] == sku:
                        e["mano"] = otro == h
            for h, rec in carga.get("recortes", {}).items():
                if h not in mapa["fotos"]:
                    continue
                if not rec:
                    mapa["fotos"][h].pop("recorte", None)
                    continue
                try:
                    x, y, w, alto = (round(float(v), 4) for v in rec)
                except (TypeError, ValueError):
                    continue
                if 0 <= x < 1 and 0 <= y < 1 and 0.02 < w <= 1 and 0.02 < alto <= 1:
                    if w > 0.98 and alto > 0.98:
                        mapa["fotos"][h].pop("recorte", None)  # casi entera
                    else:
                        mapa["fotos"][h]["recorte"] = [x, y, min(w, 1 - x), min(alto, 1 - y)]
            guardar_mapa(mapa)
            # El guardado deja todo aplicado: se recuperan los originales de
            # las fotos movidas (si ya no estan en la carpeta), se re-suben
            # bajo su SKU nuevo y se regenera fotos.json — el dev server del
            # sitio lo recoge al instante.
            for h, e in mapa["fotos"].items():
                if e["sku"] and not e["descartada"] and not e["subida"] and h not in rutas:
                    ruta = descargar_original(env, e, h)
                    if ruta:
                        rutas[h] = ruta
            subir_pendientes(env, mapa, rutas)
            guardar_mapa(mapa)
            generar_fotos_json(env, mapa)
            self.responder(b'{"ok": true}', "application/json")
            if carga.get("terminar"):
                terminado.set()

        def subir(self):
            """Copia a la carpeta una foto que viene del navegador (cuerpo
            crudo; sku y nombre en la query). No toca el mapa en disco ni
            Cloudinary: eso pasa al Guardar, con la asignacion."""
            largo = int(self.headers.get("Content-Length", "0"))
            if not carpeta:
                self.rfile.read(largo)
                self.responder_json({"error": "el script corrio sin carpeta de fotos"}, 400)
                return
            if largo > MAX_SUBIDA:
                self.responder_json({"error": f"supera el tope de {MAX_SUBIDA // 1_000_000} MB"}, 413)
                return
            consulta = urllib.parse.parse_qs(urllib.parse.urlsplit(self.path).query)
            sku = (consulta.get("sku") or [""])[0]
            nombre = (consulta.get("nombre") or [""])[0]
            datos = self.rfile.read(largo)
            if sku not in {p["sku"] for p in productos}:
                self.responder_json({"error": "producto desconocido"}, 400)
                return
            if not es_imagen(datos):
                self.responder_json({"error": "no es una imagen (JPEG, PNG, WebP o HEIC)"}, 422)
                return
            with candado:
                h, archivo, repetida = registrar_subida(mapa, rutas, carpeta, nombre, datos)
            self.responder_json({"hash": h, "archivo": archivo, "repetida": repetida})

    candado = threading.Lock()  # subidas en paralelo no pisan el mapa en memoria
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
    parser.add_argument("--catalogo", action="store_true",
                        help="abre la herramienta del catalogo de fotos "
                             "(la carpeta es opcional: lo remoto sale de Cloudinary)")
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

    if not args.carpeta and not args.catalogo:
        parser.error("falta la carpeta de fotos (o una de --catalogo / --reiniciar / --borrar-cloudinary)")

    env = cargar_env()
    productos, fotos_previas = cargar_catalogo()
    mapa = cargar_mapa()

    rutas, nuevas, carpeta = {}, [], None
    if args.carpeta:
        carpeta = os.path.expanduser(args.carpeta)
        if not os.path.isdir(carpeta):
            sys.exit(f"No existe la carpeta {carpeta}")
        rutas, nuevas = escanear(carpeta, mapa)
        asignadas = emparejar(mapa, list(mapa["fotos"]), productos, fotos_previas)
        guardar_mapa(mapa)
        print(f"Fotos en la carpeta: {len(rutas)} ({len(nuevas)} nuevas)")
        if asignadas:
            print(f"Asignadas solas por nombre: {len(asignadas)}")

    pendientes = [h for h in pendientes_de(mapa) if h in rutas]
    if (pendientes and not args.sin_revision) or args.solo_revision or args.catalogo:
        servir_revision(env, mapa, rutas, productos, args.puerto, carpeta)
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
