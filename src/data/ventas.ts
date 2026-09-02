// Ventas reales por producto (unidades acumuladas), la señal de "mas
// vendidas" del sitio: ordenan el catalogo en "Destacadas", definen la
// coleccion "Las mas vendidas" y eligen la fila del home. Fuente: las ventas
// de Abraham a los supermercados (pasadas a mano, agosto 2026); los pedidos
// cancelados no se cuentan. Para actualizar, sumar las unidades nuevas a
// cada SKU.
//
// Insumos vendidos que no estan en el catalogo del sitio (solo se venden a
// supermercados; en Odoo llevan el prefijo IN-, anotados para no perder el
// dato): IN-TIERRA-NEGRA 210, IN-ABONO-ORGANICO 37, IN-CASCARILLA-DE-ARROZ 24.
export const ventasPorSku: Record<string, number> = {
  'PL-ROMERO': 74,
  'PL-ALBAHACA-VERDE': 50,
  'PL-CACTUS-PEQUENO': 10,
  'PLT-CHAVELITAS-01': 5,
  'PL-LENGUA-DE-SUEGRA-ENANA': 4,
  'PLT-HIERBABUENA-01': 4,
  'PL-AJI-BOLITA': 3,
  'PL-CELOCIA': 2,
  'PLT-RUDA-01': 2,
};

export function ventasDe(sku: string): number {
  return ventasPorSku[sku] ?? 0;
}

// Ventas totales de un producto: el `ventas` que inyecta catalogo-build en
// cada build (manuales + confirmadas en Odoo, via sold_units del stock
// proxy) o, si el proxy no respondio, solo las manuales de este archivo.
export function ventasTotales(p: { sku: string; ventas?: number }): number {
  return p.ventas ?? ventasDe(p.sku);
}
