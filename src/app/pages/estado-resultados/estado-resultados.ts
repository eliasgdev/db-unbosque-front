import { Component, computed, inject } from '@angular/core';
import { Columna, DataTable } from '../../components/organisms/data-table/data-table';
import { StatCard } from '../../components/molecules/stat-card/stat-card';
import { AvisoApi } from '../../components/molecules/aviso-api/aviso-api';
import { ContabilidadService } from '../../core/services/contabilidad.service';
import { SeleccionService } from '../../core/services/seleccion.service';
import { aplanarRubros } from '../../core/utils/arbol';

@Component({
  selector: 'app-estado-resultados',
  imports: [DataTable, StatCard, AvisoApi],
  template: `
    <h2>Estado de resultados</h2>
    @if (seleccion.periodoId()) {
      <app-aviso-api [error]="reporte.error()" />
      @if (reporte.hasValue()) {
        @let r = reporte.value();
        <p>Periodo {{ r.fecha_inicio }} – {{ r.fecha_fin }}</p>
        <section class="stats">
          <app-stat-card label="Ingresos" [value]="r.ingresos" />
          <app-stat-card label="Costos" [value]="r.costos" />
          <app-stat-card label="Gastos" [value]="r.gastos" />
          <app-stat-card label="Utilidad bruta" [value]="r.utilidad_bruta" />
          <app-stat-card label="Utilidad operacional" [value]="r.utilidad_operacional" />
          <app-stat-card label="Utilidad neta" [value]="r.utilidad_neta" />
        </section>
        <app-data-table [columns]="columns" [rows]="filas()" />
      }
    } @else {
      <p class="aviso">Seleccione una empresa y un periodo.</p>
    }
  `,
})
export class EstadoResultadosPage {
  readonly seleccion = inject(SeleccionService);

  readonly columns: Columna[] = [
    { key: 'codigo', label: 'Código' },
    { key: 'nombre', label: 'Rubro / cuenta', sangria: true },
    { key: 'valor', label: 'Valor' },
  ];
  readonly reporte = inject(ContabilidadService).estadoResultados(this.seleccion.periodoId);
  readonly filas = computed(() => (this.reporte.hasValue() ? aplanarRubros(this.reporte.value().rubros) : []));
}
