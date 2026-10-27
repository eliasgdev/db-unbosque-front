import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DataTable } from '../../components/organisms/data-table/data-table';
import { SearchField } from '../../components/molecules/search-field/search-field';
import { PilotoService } from '../../core/services/piloto.service';

@Component({
  selector: 'app-pilotos',
  imports: [DataTable, SearchField],
  template: `
    <h2>Pilotos</h2>
    <app-search-field [(term)]="term" />
    <app-data-table [columns]="columns" [rows]="filtrados()" />
  `,
})
export class Pilotos {
  private readonly pilotos = toSignal(inject(PilotoService).listar(), { initialValue: [] });

  readonly columns = ['id', 'nombre', 'apellido', 'nacionalidad', 'fecha_nacimiento'];
  readonly term = signal('');
  readonly filtrados = computed(() => {
    const t = this.term().toLowerCase();
    return this.pilotos().filter((p) => `${p.nombre} ${p.apellido}`.toLowerCase().includes(t));
  });
}
