export interface Empresa {
  nit: string;
  registro: string;
  moneda_base: number | null;
}

export interface Periodo {
  id: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
}

export interface Cuenta {
  codigo: string;
  clasificacion: string;
  nivel: number;
  tipo_cuenta: string;
  naturaleza: string;
  cuenta_padre: string | null;
}

export interface Asiento {
  id: number;
  fecha: string;
  descripcion: string;
  estado: string;
}

export interface Movimiento {
  id: number;
  cuenta_codigo: string;
  cuenta: string;
  debe: number;
  haber: number;
}

export interface SaldoCuenta {
  codigo: string;
  clasificacion: string;
  tipo_cuenta: string;
  saldo: number;
}

export interface EstadoResultados {
  periodo_id: number;
  ingresos: number;
  costos: number;
  gastos: number;
  utilidad_bruta: number;
  utilidad_neta: number;
  cuentas: SaldoCuenta[];
}

export interface BalanceGeneral {
  nit: string;
  fecha_corte: string;
  activo: number;
  pasivo: number;
  patrimonio: number;
  utilidad_ejercicio: number;
  cuadra: boolean;
  cuentas: SaldoCuenta[];
}
