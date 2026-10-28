import { httpResource } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Asiento, BalanceGeneral, Cuenta, Empresa, EstadoResultados, Movimiento, Periodo } from '../models/contabilidad';

type Param = () => string;

@Injectable({ providedIn: 'root' })
export class ContabilidadService {
  private readonly api = environment.apiUrl;

  empresas() {
    return httpResource<Empresa[]>(() => `${this.api}/empresas`, { defaultValue: [] });
  }

  periodos(nit: Param) {
    return httpResource<Periodo[]>(() => (nit() ? `${this.api}/empresas/${nit()}/periodos` : undefined), { defaultValue: [] });
  }

  cuentas(nit: Param) {
    return httpResource<Cuenta[]>(() => (nit() ? `${this.api}/empresas/${nit()}/cuentas` : undefined), { defaultValue: [] });
  }

  asientos(periodoId: Param) {
    return httpResource<Asiento[]>(() => (periodoId() ? `${this.api}/periodos/${periodoId()}/asientos` : undefined), { defaultValue: [] });
  }

  movimientos(asientoId: Param) {
    return httpResource<Movimiento[]>(() => (asientoId() ? `${this.api}/asientos/${asientoId()}/movimientos` : undefined), { defaultValue: [] });
  }

  estadoResultados(periodoId: Param) {
    return httpResource<EstadoResultados>(() =>
      periodoId() ? { url: `${this.api}/reportes/estado-resultados`, params: { periodo_id: periodoId() } } : undefined,
    );
  }

  balanceGeneral(nit: Param, fechaCorte: Param) {
    return httpResource<BalanceGeneral>(() =>
      nit() && fechaCorte() ? { url: `${this.api}/reportes/balance-general`, params: { nit: nit(), fecha_corte: fechaCorte() } } : undefined,
    );
  }
}
