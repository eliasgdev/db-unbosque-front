const LOCALE = 'es-CO';
const formatos = new Map<string, Intl.NumberFormat>();

function formato(clave: string, opciones: Intl.NumberFormatOptions) {
  let f = formatos.get(clave);
  if (!f) {
    f = new Intl.NumberFormat(LOCALE, opciones);
    formatos.set(clave, f);
  }
  return f;
}

/** Monto con separadores colombianos; con `moneda` agrega el símbolo (COP, USD...). */
export function formatoMonto(
  valor: number | null | undefined,
  moneda?: string | null,
  decimales = 2,
): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return '—';
  if (!moneda) {
    return formato(`n${decimales}`, {
      minimumFractionDigits: decimales,
      maximumFractionDigits: decimales,
    }).format(valor);
  }
  return formato(`${moneda}${decimales}`, {
    style: 'currency',
    currency: moneda,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(valor);
}

const fechaCorta = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});
const fechaLarga = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

/** Las fechas de la API llegan como 'AAAA-MM-DD' (o ISO con hora); se muestran sin desfase de zona horaria. */
export function formatoFecha(valor: string | null | undefined, largo = false): string {
  if (!valor) return '—';
  const fecha = new Date(valor.length === 10 ? `${valor}T00:00:00Z` : valor);
  if (Number.isNaN(fecha.getTime())) return valor;
  return (largo ? fechaLarga : fechaCorta).format(fecha).replace('.', '');
}

export function porcentaje(parte: number, total: number): string {
  if (!total) return '—';
  return formato('pct', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(parte / total);
}

export type Tono = 'ok' | 'aviso' | 'error' | 'info' | 'neutro' | 'acento';

/** Color de la etiqueta según el valor de los campos de estado y clasificación que envía la API. */
const TONOS: Record<string, Tono> = {
  ABIERTO: 'ok',
  CERRADO: 'neutro',
  BORRADOR: 'aviso',
  CONTABILIZADO: 'ok',
  CLIENTE: 'info',
  PROVEEDOR: 'acento',
  OTRO: 'neutro',
  ACTIVO: 'info',
  PASIVO: 'aviso',
  PATRIMONIO: 'acento',
  INGRESO: 'ok',
  COSTO: 'error',
  GASTO: 'error',
  DEBITO: 'neutro',
  CREDITO: 'neutro',
};

export function tono(valor: unknown): Tono {
  return TONOS[String(valor)] ?? 'neutro';
}

/** Texto legible para los valores en mayúsculas de la API (CONTABILIZADO → Contabilizado). */
export function etiqueta(valor: unknown): string {
  const texto = String(valor ?? '');
  const especiales: Record<string, string> = { DEBITO: 'Débito', CREDITO: 'Crédito' };
  return especiales[texto] ?? texto.charAt(0) + texto.slice(1).toLowerCase();
}
