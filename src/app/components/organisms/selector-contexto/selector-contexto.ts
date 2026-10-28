import { Component, computed, inject } from '@angular/core';
import { Select } from '../../atoms/select/select';
import { ContabilidadService } from '../../../core/services/contabilidad.service';
import { SeleccionService } from '../../../core/services/seleccion.service';

@Component({
  selector: 'app-selector-contexto',
  imports: [Select],
  template: `
    <div class="selector-contexto">
      <app-select label="Empresa" [options]="empresas()" [(value)]="seleccion.nit" />
      <app-select label="Periodo" [options]="periodos()" [(value)]="seleccion.periodoId" />
    </div>
  `,
})
export class SelectorContexto {
  private readonly service = inject(ContabilidadService);
  readonly seleccion = inject(SeleccionService);

  private readonly empresasResource = this.service.empresas();
  private readonly periodosResource = this.service.periodos(this.seleccion.nit);

  readonly empresas = computed(() => this.empresasResource.value().map((e) => ({ value: e.nit, label: e.registro })));
  readonly periodos = computed(() =>
    this.periodosResource.value().map((p) => ({ value: String(p.id), label: `${p.fecha_inicio} – ${p.fecha_fin} (${p.estado})` })),
  );
}
