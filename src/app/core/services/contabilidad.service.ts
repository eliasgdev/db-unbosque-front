import { httpResource } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Asiento, AsientoDetalle, BalanceGeneral, CuentaArbol, Empresa, EstadoResultados, Periodo, TipoCuenta } from '../models/contabilidad';

type Param = () => string;

/** Campos que la API envía como Decimal serializado (string) y se usan como number. */
const MONTOS = new Set([
  'debe',
  'haber',
  'total_debe',
  'total_haber',
  'saldo',
  'subtotal',
  'ingresos',
  'costos',
  'gastos',
  'utilidad_bruta',
  'utilidad_operacional',
  'utilidad_neta',
  'total_activo',
  'total_pasivo',
  'total_patrimonio',
  'utilidad_ejercicio',
  'diferencia_ecuacion',
]);

function convertirMontos<T>(valor: unknown): T {
  if (Array.isArray(valor)) return valor.map((v) => convertirMontos(v)) as T;
  if (valor && typeof valor === 'object') {
    return Object.fromEntries(
      Object.entries(valor).map(([k, v]) => [k, MONTOS.has(k) && typeof v === 'string' ? Number(v) : convertirMontos(v)]),
    ) as T;
  }
  return valor as T;
}

@Injectable({ providedIn: 'root' })
export class ContabilidadService {
  private readonly api = environment.apiUrl;

  empresas() {
    return httpResource<Empresa[]>(() => `${this.api}/empresas`, { defaultValue: [] });
  }

  tiposCuenta() {
    return httpResource<TipoCuenta[]>(() => `${this.api}/tipos-cuenta`, { defaultValue: [] });
  }

  periodos(idEmpresa: Param) {
    return httpResource<Periodo[]>(() => (idEmpresa() ? `${this.api}/empresas/${idEmpresa()}/periodos` : undefined), {
      defaultValue: [],
    });
  }

  cuentas(idEmpresa: Param) {
    return httpResource<CuentaArbol[]>(() => (idEmpresa() ? `${this.api}/empresas/${idEmpresa()}/cuentas` : undefined), {
      defaultValue: [],
    });
  }

  asientos(idPeriodo: Param) {
    return httpResource<Asiento[]>(() => (idPeriodo() ? `${this.api}/periodos/${idPeriodo()}/asientos` : undefined), {
      defaultValue: [],
      parse: convertirMontos<Asiento[]>,
    });
  }

  asiento(idAsiento: Param) {
    return httpResource<AsientoDetalle>(() => (idAsiento() ? `${this.api}/asientos/${idAsiento()}` : undefined), {
      parse: convertirMontos<AsientoDetalle>,
    });
  }

  estadoResultados(idPeriodo: Param) {
    return httpResource<EstadoResultados>(
      () => (idPeriodo() ? `${this.api}/periodos/${idPeriodo()}/estado-resultados` : undefined),
      { parse: convertirMontos<EstadoResultados> },
    );
  }

  balanceGeneral(idEmpresa: Param, fechaCorte: Param) {
    return httpResource<BalanceGeneral>(
      () =>
        idEmpresa() && fechaCorte()
          ? { url: `${this.api}/empresas/${idEmpresa()}/balance-general`, params: { fecha_corte: fechaCorte() } }
          : undefined,
      { parse: convertirMontos<BalanceGeneral> },
    );
  }
}
