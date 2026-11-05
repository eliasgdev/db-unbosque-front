import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable, inject, resource, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Asiento,
  AsientoDetalle,
  AsientoEntrada,
  BalanceGeneral,
  CentroCosto,
  CierrePeriodo,
  CentroCostoEntrada,
  CuentaArbol,
  CuentaEntrada,
  Empresa,
  EmpresaEntrada,
  EstadoApi,
  EstadoResultados,
  Moneda,
  Periodo,
  PeriodoEntrada,
  RubroEstado,
  Tercero,
  TerceroEntrada,
  TipoAsiento,
  TipoCuenta,
} from '../models/contabilidad';

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
      Object.entries(valor).map(([k, v]) => [
        k,
        MONTOS.has(k) && typeof v === 'string' ? Number(v) : convertirMontos(v),
      ]),
    ) as T;
  }
  return valor as T;
}

@Injectable({ providedIn: 'root' })
export class ContabilidadService {
  private readonly api = environment.apiUrl;
  private readonly http = inject(HttpClient);

  /**
   * Se incrementa después de cada registro. Las consultas lo leen y lo envían como parámetro,
   * así todas las listas abiertas se vuelven a pedir y muestran el dato nuevo.
   */
  private readonly version = signal(0);

  private peticion(url: string, params: Record<string, string> = {}) {
    const v = this.version();
    return { url, params: v ? { ...params, _v: String(v) } : params };
  }

  // ---------- Consultas ----------

  salud() {
    return httpResource<EstadoApi>(() => `${this.api}/health`);
  }

  empresas() {
    return httpResource<Empresa[]>(() => this.peticion(`${this.api}/empresas`), {
      defaultValue: [],
    });
  }

  monedas() {
    return httpResource<Moneda[]>(() => `${this.api}/monedas`, { defaultValue: [] });
  }

  tiposCuenta() {
    return httpResource<TipoCuenta[]>(() => `${this.api}/tipos-cuenta`, { defaultValue: [] });
  }

  rubros() {
    return httpResource<RubroEstado[]>(() => `${this.api}/rubros-estado`, { defaultValue: [] });
  }

  tiposAsiento() {
    return httpResource<TipoAsiento[]>(() => `${this.api}/tipos-asiento`, { defaultValue: [] });
  }

  periodos(idEmpresa: Param) {
    return httpResource<Periodo[]>(
      () =>
        idEmpresa() ? this.peticion(`${this.api}/empresas/${idEmpresa()}/periodos`) : undefined,
      {
        defaultValue: [],
      },
    );
  }

  cuentas(idEmpresa: Param) {
    return httpResource<CuentaArbol[]>(
      () =>
        idEmpresa() ? this.peticion(`${this.api}/empresas/${idEmpresa()}/cuentas`) : undefined,
      {
        defaultValue: [],
      },
    );
  }

  terceros(idEmpresa: Param) {
    return httpResource<Tercero[]>(
      () =>
        idEmpresa() ? this.peticion(`${this.api}/empresas/${idEmpresa()}/terceros`) : undefined,
      {
        defaultValue: [],
      },
    );
  }

  centrosCosto(idEmpresa: Param) {
    return httpResource<CentroCosto[]>(
      () =>
        idEmpresa()
          ? this.peticion(`${this.api}/empresas/${idEmpresa()}/centros-costo`)
          : undefined,
      { defaultValue: [] },
    );
  }

  asientos(idPeriodo: Param) {
    return httpResource<Asiento[]>(
      () =>
        idPeriodo() ? this.peticion(`${this.api}/periodos/${idPeriodo()}/asientos`) : undefined,
      {
        defaultValue: [],
        parse: convertirMontos<Asiento[]>,
      },
    );
  }

  asiento(idAsiento: Param) {
    return httpResource<AsientoDetalle>(
      () => (idAsiento() ? this.peticion(`${this.api}/asientos/${idAsiento()}`) : undefined),
      {
        parse: convertirMontos<AsientoDetalle>,
      },
    );
  }

  estadoResultados(idPeriodo: Param) {
    return httpResource<EstadoResultados>(
      () =>
        idPeriodo()
          ? this.peticion(`${this.api}/periodos/${idPeriodo()}/estado-resultados`)
          : undefined,
      { parse: convertirMontos<EstadoResultados> },
    );
  }

  balanceGeneral(idEmpresa: Param, fechaCorte: Param) {
    return httpResource<BalanceGeneral>(
      () =>
        idEmpresa() && fechaCorte()
          ? this.peticion(`${this.api}/empresas/${idEmpresa()}/balance-general`, {
              fecha_corte: fechaCorte(),
            })
          : undefined,
      { parse: convertirMontos<BalanceGeneral> },
    );
  }

  /** Cierres de los periodos indicados (la API los entrega uno por periodo). */
  cierres(idsPeriodo: () => number[]) {
    return resource({
      params: () => ({ ids: idsPeriodo(), v: this.version() }),
      loader: ({ params }) =>
        Promise.all(
          params.ids.map((id) =>
            firstValueFrom(this.http.get<CierrePeriodo>(`${this.api}/periodos/${id}/cierre`)).then(
              (c) => convertirMontos<CierrePeriodo>(c),
            ),
          ),
        ),
      defaultValue: [],
    });
  }

  // ---------- Registro ----------

  crearEmpresa(datos: EmpresaEntrada) {
    return this.enviar<Empresa>('post', `${this.api}/empresas`, datos);
  }

  crearPeriodo(idEmpresa: number, datos: PeriodoEntrada) {
    return this.enviar<Periodo>('post', `${this.api}/empresas/${idEmpresa}/periodos`, datos);
  }

  cerrarPeriodo(idPeriodo: number, idCuentaPatrimonio: number) {
    return this.enviar('post', `${this.api}/periodos/${idPeriodo}/cierre`, {
      id_cuenta_patrimonio: idCuentaPatrimonio,
    });
  }

  crearCuenta(idEmpresa: number, datos: CuentaEntrada) {
    return this.enviar('post', `${this.api}/empresas/${idEmpresa}/cuentas`, datos);
  }

  crearTercero(idEmpresa: number, datos: TerceroEntrada) {
    return this.enviar<Tercero>('post', `${this.api}/empresas/${idEmpresa}/terceros`, datos);
  }

  crearCentroCosto(idEmpresa: number, datos: CentroCostoEntrada) {
    return this.enviar<CentroCosto>(
      'post',
      `${this.api}/empresas/${idEmpresa}/centros-costo`,
      datos,
    );
  }

  crearAsiento(idPeriodo: number, datos: AsientoEntrada) {
    return this.enviar<AsientoDetalle>('post', `${this.api}/periodos/${idPeriodo}/asientos`, datos);
  }

  actualizarAsiento(idAsiento: number, datos: AsientoEntrada) {
    return this.enviar<AsientoDetalle>('put', `${this.api}/asientos/${idAsiento}`, datos);
  }

  contabilizarAsiento(idAsiento: number) {
    return this.enviar<AsientoDetalle>(
      'post',
      `${this.api}/asientos/${idAsiento}/contabilizar`,
      {},
    );
  }

  private async enviar<T = unknown>(
    metodo: 'post' | 'put',
    url: string,
    cuerpo: unknown,
  ): Promise<T> {
    const resultado = await firstValueFrom(this.http.request<T>(metodo, url, { body: cuerpo }));
    this.version.update((v) => v + 1);
    return resultado;
  }
}
