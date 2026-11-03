import { Injectable, signal } from '@angular/core';

export interface Notificacion {
  tipo: 'ok' | 'error';
  texto: string;
}

/** Mensaje temporal que se muestra tras guardar o cuando la API rechaza una operación. */
@Injectable({ providedIn: 'root' })
export class NotificacionService {
  readonly actual = signal<Notificacion | null>(null);
  private temporizador?: ReturnType<typeof setTimeout>;

  ok(texto: string) {
    this.mostrar({ tipo: 'ok', texto });
  }

  error(texto: string) {
    this.mostrar({ tipo: 'error', texto });
  }

  cerrar() {
    this.actual.set(null);
  }

  private mostrar(n: Notificacion) {
    clearTimeout(this.temporizador);
    this.actual.set(n);
    this.temporizador = setTimeout(() => this.actual.set(null), n.tipo === 'ok' ? 3500 : 7000);
  }
}
