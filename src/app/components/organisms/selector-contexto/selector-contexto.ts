import { Component, computed, inject } from '@angular/core';
import { Select } from '../../atoms/select/select';
import { AvisoApi } from '../../molecules/aviso-api/aviso-api';
import { ContabilidadService } from '../../../core/services/contabilidad.service';
import { SeleccionService } from '../../../core/services/seleccion.service';

@Component({
  selector: 'app-selector-contexto',
  imports: [Select, AvisoApi],
  template: `
    <div class="selector-contexto">
      <app-select label="Empresa" [options]="empresas()" [(value)]="seleccion.empresaId" />
      <app-select label="Periodo" [options]="periodos()" [(value)]="seleccion.periodoId" />
    </div>
    <app-aviso-api [error]="empresasResource.error() ?? periodosResource.error()" />
  `,
})
export class SelectorContexto {
  private readonly service = inject(ContabilidadService);
  readonly seleccion = inject(SeleccionService);

  readonly empresasResource = this.service.empresas();
  readonly periodosResource = this.service.periodos(this.seleccion.empresaId);

  readonly empresas = computed(() =>
    this.empresasResource.hasValue()
      ? this.empresasResource.value().map((e) => ({ value: String(e.id_empresa), label: `${e.razon_social} (${e.nit})` }))
      : [],
  );
  readonly periodos = computed(() =>
    this.periodosResource.hasValue()
      ? this.periodosResource
          .value()
          .map((p) => ({ value: String(p.id_periodo), label: `${p.fecha_inicio} – ${p.fecha_fin} (${p.estado})` }))
      : [],
  );
}
