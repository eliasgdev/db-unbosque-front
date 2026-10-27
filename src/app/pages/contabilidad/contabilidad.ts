import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DataTable } from '../../components/organisms/data-table/data-table';
import { SearchField } from '../../components/molecules/search-field/search-field';
import { StatCard } from '../../components/molecules/stat-card/stat-card';
import { ContabilidadService } from '../../core/services/contabilidad.service';

@Component({
  selector: 'app-contabilidad',
  imports: [DataTable, SearchField, StatCard],
  template: `
    <h2>Contabilidad</h2>
    <section class="stats">
      <app-stat-card label="Ingresos" [value]="ingresos()" />
      <app-stat-card label="Gastos" [value]="gastos()" />
      <app-stat-card label="Balance" [value]="ingresos() - gastos()" />
    </section>
    <app-search-field [(term)]="term" />
    <app-data-table [columns]="columns" [rows]="filtrados()" />
  `,
})
export class Contabilidad {
  private readonly movimientos = toSignal(inject(ContabilidadService).listarMovimientos(), { initialValue: [] });

  readonly columns = ['fecha', 'cuenta', 'descripcion', 'tipo', 'monto'];
  readonly term = signal('');
  readonly ingresos = computed(() => this.total('ingreso'));
  readonly gastos = computed(() => this.total('gasto'));
  readonly filtrados = computed(() => {
    const t = this.term().toLowerCase();
    return this.movimientos().filter((m) => `${m.cuenta} ${m.descripcion}`.toLowerCase().includes(t));
  });

  private total(tipo: 'ingreso' | 'gasto') {
    return this.movimientos()
      .filter((m) => m.tipo === tipo)
      .reduce((sum, m) => sum + m.monto, 0);
  }
}
