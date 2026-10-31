import { Component, computed, inject, signal } from '@angular/core';
import { Columna, DataTable } from '../../components/organisms/data-table/data-table';
import { SearchField } from '../../components/molecules/search-field/search-field';
import { Select } from '../../components/atoms/select/select';
import { ContabilidadService } from '../../core/services/contabilidad.service';
import { SeleccionService } from '../../core/services/seleccion.service';

@Component({
  selector: 'app-plan-cuentas',
  imports: [DataTable, SearchField, Select],
  template: `
    <h2>Plan de cuentas</h2>
    @if (seleccion.nit()) {
      <div class="filtros">
        <app-search-field [(term)]="term" />
        <app-select label="Tipo de cuenta" [options]="tipos()" [(value)]="tipo" />
      </div>
      <app-data-table [columns]="columns" [rows]="filtradas()" />
    } @else {
      <p class="aviso">Seleccione una empresa.</p>
    }
  `,
})
export class PlanCuentas {
  private readonly service = inject(ContabilidadService);
  readonly seleccion = inject(SeleccionService);
  private readonly cuentas = this.service.cuentas(this.seleccion.nit);
  private readonly tiposCuenta = this.service.tiposCuenta();

  readonly columns: Columna[] = [
    { key: 'codigo', label: 'Código' },
    { key: 'clasificacion', label: 'Clasificación', sangria: true },
    { key: 'nivel', label: 'Nivel' },
    { key: 'tipo_cuenta', label: 'Tipo' },
    { key: 'naturaleza', label: 'Naturaleza' },
    { key: 'cuenta_padre', label: 'Cuenta padre' },
  ];
  readonly term = signal('');
  readonly tipo = signal('');
  readonly tipos = computed(() =>
    this.tiposCuenta.value().map((t) => ({ value: t.tipo_cuenta, label: `${t.tipo_cuenta} (${t.naturaleza})` })),
  );
  readonly filtradas = computed(() => {
    const t = this.term().toLowerCase();
    const tipo = this.tipo();
    return this.cuentas
      .value()
      .filter((c) => (!tipo || c.tipo_cuenta === tipo) && `${c.codigo} ${c.clasificacion}`.toLowerCase().includes(t));
  });
}
