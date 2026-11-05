import { CuentaArbol, FilaReporte, RubroReporte } from '../models/contabilidad';

/** Recorre el árbol del plan de cuentas en preorden y lo devuelve como lista plana. */
export function aplanarCuentas(cuentas: CuentaArbol[]): Omit<CuentaArbol, 'subcuentas'>[] {
  return cuentas.flatMap(({ subcuentas, ...cuenta }) => [cuenta, ...aplanarCuentas(subcuentas)]);
}

/** Convierte la jerarquía RUBRO_ESTADO de un reporte en filas: rubro (subtotal) y sus cuentas (saldo). */
export function aplanarRubros(rubros: RubroReporte[], nivel = 1): FilaReporte[] {
  return [...rubros]
    .sort((a, b) => a.orden - b.orden)
    .flatMap((r) => [
      { tipo: 'rubro' as const, codigo: r.codigo, nombre: r.nombre, nivel, valor: r.subtotal },
      ...aplanarRubros(r.subrubros, nivel + 1),
      ...r.cuentas.map((c) => ({
        tipo: 'cuenta' as const,
        codigo: c.codigo,
        nombre: c.nombre,
        nivel: nivel + 1,
        valor: c.saldo,
      })),
    ]);
}
