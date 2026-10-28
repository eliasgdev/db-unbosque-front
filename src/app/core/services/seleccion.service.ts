import { Injectable, linkedSignal, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SeleccionService {
  readonly nit = signal('');
  readonly periodoId = linkedSignal({ source: this.nit, computation: () => '' });
}
