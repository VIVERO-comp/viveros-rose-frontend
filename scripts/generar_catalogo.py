# Regenera el array `products` de src/data/products.ts a partir del export
# de Odoo (Producto (product.template).xlsx). Solo reemplaza el array; las
# interfaces, categorias y funciones del archivo quedan intactas.
#
# Uso:
#   python3 scripts/generar_catalogo.py [ruta-al-xlsx]
#
# Sin argumento usa el export en ~/Downloads. Requiere openpyxl.
#
# Precios: usa el "Precio de venta" de Odoo cuando es > 0; si esta en 0
# (aun sin definir en Odoo) cae al placeholder de $5 y lo reporta al final,
# para que se vea cuantos productos siguen sin precio real.
import openpyxl
import os
import re
import sys
import unicodedata

XLSX = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser(
    "~/Downloads/Producto (product.template).xlsx"
)
PRODUCTS_TS = os.path.join(os.path.dirname(__file__), "..", "src", "data", "products.ts")
PRECIO_PLACEHOLDER = 5

NO_PLANTAS = {"MACETA-001"}  # referencias del export que no son plantas

# Slugs de URL fijados a mano, por SKU (Referencia interna de Odoo). El slug
# normal se deriva del nombre del producto; este mapa lo sobrescribe para los
# SKU listados, de modo que la URL publica no dependa de como este escrito el
# nombre en Odoo (y un rename de URL sobreviva a las regeneraciones). Para
# fijar otro slug, agregar una entrada 'SKU': 'slug-deseado'.
SLUGS_FIJOS = {
    "PL-POTHOS": "potos",
    "PL-PHOTOS-MULTI-RAMA": "potos-multi-rama",
}

# Palabras clave (sobre el nombre sin acentos, en mayusculas) -> categoria del
# sitio. Aproximacion inicial; las categorias se afinan a mano despues.
FLORALES = [
    "ROSA", "ROSITA", "CRISANTEMO", "CHAVELITA", "DALIA", "CLAVEL", "IXORA",
    "JAZMIN", "LIRIO", "ORTENCIA", "ANTHURIO", "FLOR DE SAN JUAN", "TORENIA",
    "PETUNI", "MARIGOLD", "CELOCIA", "CIELITO AZUL", "NOVIO CHINO", "PAPO",
    "BUQUE", "KALANCHOE", "ANTORCHA", "GINGER", "CORONITA", "SALVIA",
]
EXTERIOR = [
    "PALMA", "PINO", "CIPRE", "AGAVE", "CROTO", "DURANTA", "COLEOS",
    "ALBAHACA", "MENTA", "HIERBA", "OREGANO", "ROMERO", "TOMILLO", "RUDA",
    "LAVANDA", "APIO", "AJI ", "CITRONELA", "ARBUSTO", "BAMBU", "LORITO",
    "PIE DE NINO", "RASTRERO",
]
INTERIOR = [
    "AGLONEMA", "ALOCASIA", "CALATHEA", "MONSTERA", "PHILODENDRO",
    "PHILOMENDRO", "POTHOS", "PHOTOS", "PHOTUS", "POTO", "FICUS", "DRACAENA",
    "MARGINATA", "ZAMIOCULCA", "ZAMICULCA", "SANSEVIERIA", "LENGUA DE SUEGRA",
    "PEPERONIA", "FITONIA", "HYPOESTES", "EPISCIA", "ESCUDO PERSA", "HELECHO",
    "CINTA", "TRASDESCANTIA", "JADE", "SUCULENTA", "CACTUS", "HAWORTHIA",
    "SABILA", "ARALIA", "PAPIRO", "BIJAO", "CORDILINIA", "DRACONTIUM",
    "ANITA", "MILLONARIA", "COBRA", "MOLLEJA", "PALO DE BRA", "ESPARRAGO",
    "PURPLE LADY", "POLCAS", "MICKY", "GRONFENA", "ALCANCEL", "CRINUM",
]

EMOJIS = {"interior": "🪴", "exterior": "🌳", "florales": "🌺", "frutales": "🥭"}
EMOJIS_ESPECIALES = [
    ("CACTUS", "🌵"), ("SUCULENTA", "🌵"), ("PALMA", "🌴"), ("ROSA", "🌹"),
    ("ROSITA", "🌹"), ("HELECHO", "🌿"), ("MENTA", "🌿"), ("ALBAHACA", "🌿"),
    ("OREGANO", "🌿"), ("ROMERO", "🌿"), ("TOMILLO", "🌿"), ("HIERBA", "🌿"),
]


def categoria(nombre_mayus):
    for kw in FLORALES:
        if kw in nombre_mayus:
            return "florales"
    for kw in INTERIOR:
        if kw in nombre_mayus:
            return "interior"
    for kw in EXTERIOR:
        if kw in nombre_mayus:
            return "exterior"
    return "exterior"


def emoji_de(nombre_mayus, cat):
    for kw, e in EMOJIS_ESPECIALES:
        if kw in nombre_mayus:
            return e
    return EMOJIS[cat]


def sin_acentos(s):
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def slug_de(nombre):
    s = sin_acentos(nombre).lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s


def nombre_bonito(nombre):
    # De MAYUSCULAS a "Tipo oracion" (primera letra en mayuscula).
    limpio = " ".join(nombre.split())
    return limpio[:1].upper() + limpio[1:].lower()


def precio_de(valor):
    # Precio real de Odoo si existe; placeholder si sigue en 0.
    if valor and float(valor) > 0:
        return float(valor), False
    return float(PRECIO_PLACEHOLDER), True


def fmt_precio(p):
    return str(int(p)) if p == int(p) else str(p)


wb = openpyxl.load_workbook(XLSX, read_only=True, data_only=True)
ws = wb.worksheets[0]
filas = list(ws.iter_rows(values_only=True))
encabezado = [str(c or "") for c in filas[0]]
COL_NOMBRE = encabezado.index("Nombre")
COL_REF = encabezado.index("Referencia interna")
COL_PRECIO = encabezado.index("Precio de venta")
filas = [r for r in filas[1:] if any(c not in (None, "") for c in r)]

productos = []
slugs_vistos = {}
excluidos = []
sin_precio = []
for r in filas:
    nombre_raw, ref = str(r[COL_NOMBRE]).strip(), str(r[COL_REF]).strip()
    if ref in NO_PLANTAS:
        excluidos.append((ref, nombre_raw))
        continue
    nombre_mayus = sin_acentos(nombre_raw).upper()
    cat = categoria(nombre_mayus)
    nombre = nombre_bonito(nombre_raw)
    if ref in SLUGS_FIJOS:
        # Un slug fijado nunca se desambigua con sufijo: si choca con otro
        # slug ya emitido, hay que resolverlo a mano en SLUGS_FIJOS.
        slug = SLUGS_FIJOS[ref]
        if slug in slugs_vistos:
            raise SystemExit(
                f"ERROR: el slug fijo '{slug}' ({ref}) choca con el de otro "
                "producto; corregir SLUGS_FIJOS antes de regenerar."
            )
        slugs_vistos[slug] = 1
    else:
        slug = slug_de(nombre_raw)
        if slug in slugs_vistos:
            slugs_vistos[slug] += 1
            slug = f"{slug}-{slugs_vistos[slug]}"
        else:
            slugs_vistos[slug] = 1
    precio, es_placeholder = precio_de(r[COL_PRECIO])
    if es_placeholder:
        sin_precio.append(ref)
    productos.append({
        "sku": ref,
        "slug": slug,
        "category": cat,
        "name": nombre,
        "price": precio,
        "placeholder": es_placeholder,
        "emoji": emoji_de(nombre_mayus, cat),
    })

productos.sort(key=lambda p: p["name"])


def esc(s):
    return s.replace("\\", "\\\\").replace("'", "\\'")


bloques = []
for p in productos:
    nota_precio = " // pendiente de precio en Odoo" if p["placeholder"] else ""
    bloques.append(f"""  {{
    sku: '{esc(p["sku"])}',
    slug: '{esc(p["slug"])}',
    category: '{p["category"]}',
    name: '{esc(p["name"])}',
    scientificName: '',
    price: {fmt_precio(p["price"])},{nota_precio}
    description:
      '{esc(p["name"])} de nuestro vivero en Panamá. Foto y descripción detallada muy pronto; consúltanos por tamaños disponibles.',
    care: {{ light: 'Luz indirecta', water: '2 veces por semana', difficulty: 'Media' }},
    available: 0,
    emoji: '{p["emoji"]}',
  }},""")

array_nuevo = "export const products: Product[] = [\n" + "\n".join(bloques) + "\n];"

with open(PRODUCTS_TS, encoding="utf-8") as f:
    contenido = f.read()

patron = re.compile(r"export const products: Product\[\] = \[.*?\n\];", re.DOTALL)
assert patron.search(contenido), "No se encontro el array products en products.ts"
contenido = patron.sub(lambda _: array_nuevo, contenido, count=1)

with open(PRODUCTS_TS, "w", encoding="utf-8") as f:
    f.write(contenido)

from collections import Counter

print(f"Fuente: {XLSX}")
print(f"Productos escritos: {len(productos)}")
print("Excluidos (no plantas):", excluidos)
print("Por categoria:", dict(Counter(p["category"] for p in productos)))
if sin_precio:
    print(f"ATENCION: {len(sin_precio)} productos sin precio en Odoo (quedaron en ${PRECIO_PLACEHOLDER}):")
    for ref in sin_precio:
        print("  -", ref)
else:
    print("Todos los productos tienen precio real de Odoo.")
