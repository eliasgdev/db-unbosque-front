import { Component, computed, inject, signal } from '@angular/core';
import { Columna, DataTable } from '../../components/organisms/data-table/data-table';
import { SearchField } from '../../components/molecules/search-field/search-field';
import { AvisoApi } from '../../components/molecules/aviso-api/aviso-api';
import { Select } from '../../components/atoms/select/select';
import { ContabilidadService } from '../../core/services/contabilidad.service';
import { SeleccionService } from '../../core/services/seleccion.service';
import { aplanarCuentas } from '../../core/utils/arbol';

@Component({
  selector: 'app-plan-cuentas',
  imports: [DataTable, SearchField, Select, AvisoApi],
  template: `
    <h2>Plan de cuentas</h2>
    @if (seleccion.empresaId()) {
      <div class="filtros">
        <app-search-field [(term)]="term" />
        <app-select label="Tipo de cuenta" [options]="tipos()" [(value)]="tipo" />
      </div>
      <app-aviso-api [error]="cuentas.error() ?? tiposCuenta.error()" />
      <app-data-table [columns]="columns" [rows]="filtradas()" />
    } @else {
      <p class="aviso">Seleccione una empresa.</p>
    }
  `,
})
export class PlanCuentas {
  private readonly service = inject(ContabilidadService);
  readonly seleccion = inject(SeleccionService);
  readonly cuentas = this.service.cuentas(this.seleccion.empresaId);
  readonly tiposCuenta = this.service.tiposCuenta();

  readonly columns: Columna[] = [
    { key: 'codigo', label: 'Código' },
    { key: 'nombre', label: 'Cuenta', sangria: true },
    { key: 'nivel', label: 'Nivel' },
    { key: 'clase_cuenta', label: 'Clase' },
    { key: 'naturaleza', label: 'Naturaleza' },
    { key: 'acepta_movimiento', label: 'Acepta movimiento' },
  ];
  readonly term = signal('');
  readonly tipo = signal('');
  readonly tipos = computed(() =>
    this.tiposCuenta.hasValue()
      ? this.tiposCuenta.value().map((t) => ({ value: String(t.id_tipo_cuenta), label: `${t.clase} (${t.naturaleza})` }))
      : [],
  );
  readonly filtradas = computed(() => {
    if (!this.cuentas.hasValue()) return [];
    const t = this.term().toLowerCase();
    const tipo = this.tipo();
    return aplanarCuentas(this.cuentas.value()).filter(
      (c) => (!tipo || String(c.id_tipo_cuenta) === tipo) && `${c.codigo} ${c.nombre}`.toLowerCase().includes(t),
    );
  });
}
