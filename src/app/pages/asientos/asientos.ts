import { Component, computed, inject, linkedSignal } from '@angular/core';
import { Columna, DataTable } from '../../components/organisms/data-table/data-table';
import { AvisoApi } from '../../components/molecules/aviso-api/aviso-api';
import { Asiento } from '../../core/models/contabilidad';
import { ContabilidadService } from '../../core/services/contabilidad.service';
import { SeleccionService } from '../../core/services/seleccion.service';

@Component({
  selector: 'app-asientos',
  imports: [DataTable, AvisoApi],
  template: `
    <h2>Asientos</h2>
    @if (seleccion.periodoId()) {
      <app-aviso-api [error]="asientos.error()" />
      <app-data-table
        [columns]="columnasAsiento"
        [rows]="filas()"
        [selected]="seleccionado()"
        [clickable]="true"
        (rowClick)="seleccionado.set($event)"
      />
      @if (seleccionado(); as a) {
        <h3>Movimientos del asiento {{ a.numero }} · {{ a.descripcion }}</h3>
        <app-aviso-api [error]="detalle.error()" />
        @if (detalle.hasValue() && !detalle.value().cuadra) {
          <p class="error">El asiento no cumple la partida doble: el debe y el haber son distintos.</p>
        }
        <app-data-table [columns]="columnasMovimiento" [rows]="movimientos()" [footer]="totales()" />
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
    { key: 'numero', label: 'N.º' },
    { key: 'fecha', label: 'Fecha' },
    { key: 'tipo_asiento', label: 'Tipo' },
    { key: 'descripcion', label: 'Descripción' },
    { key: 'estado', label: 'Estado' },
    { key: 'total_debe', label: 'Debe' },
    { key: 'total_haber', label: 'Haber' },
    { key: 'cuadra', label: 'Cuadra' },
  ];
  readonly columnasMovimiento: Columna[] = [
    { key: 'codigo_cuenta', label: 'Código' },
    { key: 'nombre_cuenta', label: 'Cuenta' },
    { key: 'debe', label: 'Debe' },
    { key: 'haber', label: 'Haber' },
  ];
  readonly asientos = this.service.asientos(this.seleccion.periodoId);
  readonly filas = computed(() =>
    this.asientos.hasValue() ? this.asientos.value().map((a) => ({ ...a, cuadra: a.total_debe === a.total_haber })) : [],
  );
  readonly seleccionado = linkedSignal<string, Asiento | null>({ source: this.seleccion.periodoId, computation: () => null });
  readonly detalle = this.service.asiento(() => String(this.seleccionado()?.id_asiento ?? ''));
  readonly movimientos = computed(() => (this.detalle.hasValue() ? this.detalle.value().movimientos : []));
  readonly totales = computed(() => {
    const movs = this.movimientos();
    return ['', 'Totales', movs.reduce((s, m) => s + m.debe, 0), movs.reduce((s, m) => s + m.haber, 0)];
  });
}
