// Contrato de la API v1 (db-unbosque-api, app/schemas).
// Los montos llegan como string (Decimal de Pydantic) y el servicio los convierte a number.

export interface ErrorApi {
  codigo: string;
  mensaje: string;
  detalle: string | null;
}

export interface Empresa {
  id_empresa: number;
  nit: string;
  razon_social: string;
  id_moneda: number;
  codigo_moneda: string | null;
}

export interface TipoCuenta {
  id_tipo_cuenta: number;
  clase: string;
  naturaleza: string;
}

export interface Periodo {
  id_periodo: number;
  id_empresa: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado: 'ABIERTO' | 'CERRADO';
}

export interface Cuenta {
  id_cuenta: number;
  id_empresa: number;
  id_cuenta_padre: number | null;
  id_tipo_cuenta: number;
  id_rubro: number;
  codigo: string;
  nombre: string;
  nivel: number;
  acepta_movimiento: boolean;
  clase_cuenta: string | null;
  naturaleza: string | null;
}

export interface CuentaArbol extends Cuenta {
  subcuentas: CuentaArbol[];
}

export interface Asiento {
  id_asiento: number;
  id_periodo: number;
  id_tipo_asiento: number;
  tipo_asiento: string | null;
  numero: number;
  fecha: string;
  descripcion: string;
  estado: 'BORRADOR' | 'CONTABILIZADO';
  total_debe: number;
  total_haber: number;
}

export interface Movimiento {
  id_movimiento: number;
  id_asiento: number;
  id_cuenta: number;
  codigo_cuenta: string | null;
  nombre_cuenta: string | null;
  id_tercero: number | null;
  id_centro_costo: number | null;
  debe: number;
  haber: number;
}

export interface AsientoDetalle extends Asiento {
  cuadra: boolean;
  movimientos: Movimiento[];
}

export interface SaldoCuentaReporte {
  id_cuenta: number;
  codigo: string;
  nombre: string;
  clase: string;
  naturaleza: string;
  saldo: number;
}

export interface RubroReporte {
  id_rubro: number;
  id_rubro_padre: number | null;
  codigo: string;
  nombre: string;
  orden: number;
  subtotal: number;
  cuentas: SaldoCuentaReporte[];
  subrubros: RubroReporte[];
}

export interface EstadoResultados {
  id_periodo: number;
  id_empresa: number;
  fecha_inicio: string;
  fecha_fin: string;
  ingresos: number;
  costos: number;
  gastos: number;
  utilidad_bruta: number;
  utilidad_operacional: number;
  utilidad_neta: number;
  rubros: RubroReporte[];
}

export interface BalanceGeneral {
  id_empresa: number;
  razon_social: string;
  fecha_corte: string;
  total_activo: number;
  total_pasivo: number;
  total_patrimonio: number;
  utilidad_ejercicio: number;
  diferencia_ecuacion: number;
  cuadra: boolean;
  rubros: RubroReporte[];
}

/** Fila plana para pintar árboles (plan de cuentas, rubros) en la tabla con sangría. */
export interface FilaArbol {
  codigo: string;
  nombre: string;
  nivel: number;
  valor?: number;
}
