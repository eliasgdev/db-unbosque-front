import { Component, inject } from '@angular/core';
import { DataTable } from '../../components/organisms/data-table/data-table';
import { StatCard } from '../../components/molecules/stat-card/stat-card';
import { ContabilidadService } from '../../core/services/contabilidad.service';
import { SeleccionService } from '../../core/services/seleccion.service';

@Component({
  selector: 'app-estado-resultados',
  imports: [DataTable, StatCard],
  template: `
    <h2>Estado de resultados</h2>
    @if (reporte.value(); as r) {
      <section class="stats">
        <app-stat-card label="Ingresos" [value]="r.ingresos" />
        <app-stat-card label="Costos" [value]="r.costos" />
        <app-stat-card label="Gastos" [value]="r.gastos" />
        <app-stat-card label="Utilidad bruta" [value]="r.utilidad_bruta" />
        <app-stat-card label="Utilidad neta" [value]="r.utilidad_neta" />
      </section>
      <app-data-table [columns]="columns" [rows]="r.cuentas" />
    } @else {
      <p>Seleccione una empresa y un periodo.</p>
    }
  `,
})
export class EstadoResultadosPage {
  private readonly seleccion = inject(SeleccionService);

  readonly columns = ['codigo', 'clasificacion', 'tipo_cuenta', 'saldo'];
  readonly reporte = inject(ContabilidadService).estadoResultados(this.seleccion.periodoId);
}
