import { Component, computed, inject, signal } from '@angular/core';
import { Columna, DataTable } from '../../components/organisms/data-table/data-table';
import { StatCard } from '../../components/molecules/stat-card/stat-card';
import { AvisoApi } from '../../components/molecules/aviso-api/aviso-api';
import { Input } from '../../components/atoms/input/input';
import { ContabilidadService } from '../../core/services/contabilidad.service';
import { SeleccionService } from '../../core/services/seleccion.service';
import { aplanarRubros } from '../../core/utils/arbol';

@Component({
  selector: 'app-balance-general',
  imports: [DataTable, StatCard, Input, AvisoApi],
  template: `
    <h2>Balance general</h2>
    <label>Fecha de corte <app-input type="date" [(value)]="fechaCorte" /></label>
    @if (seleccion.empresaId()) {
      <app-aviso-api [error]="reporte.error()" />
      @if (reporte.hasValue()) {
        @let r = reporte.value();
        <section class="stats">
          <app-stat-card label="Activo" [value]="r.total_activo" />
          <app-stat-card label="Pasivo" [value]="r.total_pasivo" />
          <app-stat-card label="Patrimonio" [value]="r.total_patrimonio" />
          <app-stat-card label="Utilidad del ejercicio" [value]="r.utilidad_ejercicio" />
        </section>
        <p [class]="r.cuadra ? 'ok' : 'error'">
          @if (r.cuadra) {
            Activo = Pasivo + Patrimonio
          } @else {
            El balance no cuadra: diferencia de {{ r.diferencia_ecuacion }}
          }
        </p>
        <app-data-table [columns]="columns" [rows]="filas()" />
      }
    } @else {
      <p class="aviso">Seleccione una empresa y una fecha de corte.</p>
    }
  `,
})
export class BalanceGeneralPage {
  readonly seleccion = inject(SeleccionService);

  readonly columns: Columna[] = [
    { key: 'codigo', label: 'Código' },
    { key: 'nombre', label: 'Rubro / cuenta', sangria: true },
    { key: 'valor', label: 'Saldo' },
  ];
  readonly fechaCorte = signal(new Date().toISOString().slice(0, 10));
  readonly reporte = inject(ContabilidadService).balanceGeneral(this.seleccion.empresaId, this.fechaCorte);
  readonly filas = computed(() => {
    if (!this.reporte.hasValue()) return [];
    const r = this.reporte.value();
    // La API entrega la utilidad del ejercicio aparte; se muestra como fila para que el patrimonio cuadre con su total.
    const utilidad = r.utilidad_ejercicio ? [{ codigo: '', nombre: 'Utilidad del ejercicio en curso', nivel: 2, valor: r.utilidad_ejercicio }] : [];
    return [...aplanarRubros(r.rubros), ...utilidad];
  });
}
