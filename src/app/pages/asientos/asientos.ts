import { Component, inject, linkedSignal } from '@angular/core';
import { DataTable } from '../../components/organisms/data-table/data-table';
import { Asiento } from '../../core/models/contabilidad';
import { ContabilidadService } from '../../core/services/contabilidad.service';
import { SeleccionService } from '../../core/services/seleccion.service';

@Component({
  selector: 'app-asientos',
  imports: [DataTable],
  template: `
    <h2>Asientos</h2>
    @if (seleccion.periodoId()) {
      <app-data-table [columns]="columnasAsiento" [rows]="asientos.value()" [selected]="asiento()" (rowClick)="asiento.set($event)" />
      @if (asiento(); as a) {
        <h3>Movimientos del asiento {{ a.id }}</h3>
        <app-data-table [columns]="columnasMovimiento" [rows]="movimientos.value()" />
      }
    } @else {
      <p>Seleccione una empresa y un periodo.</p>
    }
  `,
})
export class Asientos {
  private readonly service = inject(ContabilidadService);
  readonly seleccion = inject(SeleccionService);

  readonly columnasAsiento = ['id', 'fecha', 'descripcion', 'estado'];
  readonly columnasMovimiento = ['cuenta_codigo', 'cuenta', 'debe', 'haber'];
  readonly asientos = this.service.asientos(this.seleccion.periodoId);
  readonly asiento = linkedSignal<string, Asiento | null>({ source: this.seleccion.periodoId, computation: () => null });
  readonly movimientos = this.service.movimientos(() => String(this.asiento()?.id ?? ''));
}
