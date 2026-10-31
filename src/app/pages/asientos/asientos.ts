import { Component, computed, inject, linkedSignal } from '@angular/core';
import { Columna, DataTable } from '../../components/organisms/data-table/data-table';
import { Asiento } from '../../core/models/contabilidad';
import { ContabilidadService } from '../../core/services/contabilidad.service';
import { SeleccionService } from '../../core/services/seleccion.service';

@Component({
  selector: 'app-asientos',
  imports: [DataTable],
  template: `
    <h2>Asientos</h2>
    @if (seleccion.periodoId()) {
      <app-data-table
        [columns]="columnasAsiento"
        [rows]="asientos.value()"
        [selected]="asiento()"
        [clickable]="true"
        (rowClick)="asiento.set($event)"
      />
      @if (asiento(); as a) {
        <h3>Movimientos del asiento {{ a.id }} · {{ a.descripcion }}</h3>
        @if (!a.cuadra) {
          <p class="error">El asiento no cumple la partida doble: el debe y el haber son distintos.</p>
        }
        <app-data-table [columns]="columnasMovimiento" [rows]="movimientos.value()" [footer]="totales()" />
      } @else {
        <p class="aviso">Haga clic en un asiento para ver sus movimientos.</p>
      }
    } @else {
      <p class="aviso">Seleccione una empresa y un periodo.</p>
    }
  `,
})
export class Asientos {
  private readonly service = inject(ContabilidadService);
  readonly seleccion = inject(SeleccionService);

  readonly columnasAsiento: Columna[] = [
    { key: 'id', label: 'N.º' },
    { key: 'fecha', label: 'Fecha' },
    { key: 'descripcion', label: 'Descripción' },
    { key: 'estado', label: 'Estado' },
    { key: 'total_debe', label: 'Debe' },
    { key: 'total_haber', label: 'Haber' },
    { key: 'cuadra', label: 'Cuadra' },
  ];
  readonly columnasMovimiento: Columna[] = [
    { key: 'cuenta_codigo', label: 'Código' },
    { key: 'cuenta', label: 'Cuenta' },
    { key: 'debe', label: 'Debe' },
    { key: 'haber', label: 'Haber' },
  ];
  readonly asientos = this.service.asientos(this.seleccion.periodoId);
  readonly asiento = linkedSignal<string, Asiento | null>({ source: this.seleccion.periodoId, computation: () => null });
  readonly movimientos = this.service.movimientos(() => String(this.asiento()?.id ?? ''));
  readonly totales = computed(() => {
    const movs = this.movimientos.value();
    return ['', 'Totales', movs.reduce((s, m) => s + m.debe, 0), movs.reduce((s, m) => s + m.haber, 0)];
  });
}
