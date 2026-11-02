import { Injectable, linkedSignal, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SeleccionService {
  readonly empresaId = signal('');
  readonly periodoId = linkedSignal({ source: this.empresaId, computation: () => '' });
}
