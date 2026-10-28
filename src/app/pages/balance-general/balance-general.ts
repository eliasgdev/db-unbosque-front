import { Component, inject, signal } from '@angular/core';
import { DataTable } from '../../components/organisms/data-table/data-table';
import { StatCard } from '../../components/molecules/stat-card/stat-card';
import { Input } from '../../components/atoms/input/input';
import { ContabilidadService } from '../../core/services/contabilidad.service';
import { SeleccionService } from '../../core/services/seleccion.service';

@Component({
  selector: 'app-balance-general',
  imports: [DataTable, StatCard, Input],
  template: `
    <h2>Balance general</h2>
    <label>Fecha de corte <app-input type="date" [(value)]="fechaCorte" /></label>
    @if (reporte.value(); as r) {
      <section class="stats">
        <app-stat-card label="Activo" [value]="r.activo" />
        <app-stat-card label="Pasivo" [value]="r.pasivo" />
        <app-stat-card label="Patrimonio" [value]="r.patrimonio" />
        <app-stat-card label="Utilidad del ejercicio" [value]="r.utilidad_ejercicio" />
      </section>
      <p [class]="r.cuadra ? 'ok' : 'error'">
        {{ r.cuadra ? 'Activo = Pasivo + Patrimonio' : 'El balance no cuadra' }}
      </p>
      <app-data-table [columns]="columns" [rows]="r.cuentas" />
    } @else {
      <p>Seleccione una empresa y una fecha de corte.</p>
    }
  `,
})
export class BalanceGeneralPage {
  private readonly seleccion = inject(SeleccionService);

  readonly columns = ['codigo', 'clasificacion', 'tipo_cuenta', 'saldo'];
  readonly fechaCorte = signal(new Date().toISOString().slice(0, 10));
  readonly reporte = inject(ContabilidadService).balanceGeneral(this.seleccion.nit, this.fechaCorte);
}
