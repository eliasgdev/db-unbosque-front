import { Component, computed, inject, signal } from '@angular/core';
import { DataTable } from '../../components/organisms/data-table/data-table';
import { SearchField } from '../../components/molecules/search-field/search-field';
import { ContabilidadService } from '../../core/services/contabilidad.service';
import { SeleccionService } from '../../core/services/seleccion.service';

@Component({
  selector: 'app-plan-cuentas',
  imports: [DataTable, SearchField],
  template: `
    <h2>Plan de cuentas</h2>
    @if (seleccion.nit()) {
      <app-search-field [(term)]="term" />
      <app-data-table [columns]="columns" [rows]="filtradas()" />
    } @else {
      <p>Seleccione una empresa.</p>
    }
  `,
})
export class PlanCuentas {
  readonly seleccion = inject(SeleccionService);
  private readonly cuentas = inject(ContabilidadService).cuentas(this.seleccion.nit);

  readonly columns = ['codigo', 'clasificacion', 'nivel', 'tipo_cuenta', 'naturaleza', 'cuenta_padre'];
  readonly term = signal('');
  readonly filtradas = computed(() => {
    const t = this.term().toLowerCase();
    return this.cuentas.value().filter((c) => `${c.codigo} ${c.clasificacion}`.toLowerCase().includes(t));
  });
}
