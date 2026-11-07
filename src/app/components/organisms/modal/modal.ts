import { Component, input, output } from '@angular/core';
import { Icono } from '../../atoms/icono/icono';

/** Ventana modal (o panel lateral) que se cierra con Esc, con la X o haciendo clic fuera. */
@Component({
  selector: 'app-modal',
  imports: [Icono],
  host: { '(document:keydown.escape)': 'cerrar.emit()' },
  template: `
    <div class="modal-fondo" (click)="cerrar.emit()"></div>
    <section
      class="modal"
      [class]="'modal-' + tamano()"
      role="dialog"
      aria-modal="true"
      [attr.aria-label]="titulo()"
    >
      <header class="modal-cabecera">
        <div>
          <h2>{{ titulo() }}</h2>
          @if (subtitulo()) {
            <p>{{ subtitulo() }}</p>
          }
        </div>
        <button type="button" class="btn-icono" (click)="cerrar.emit()" aria-label="Cerrar">
          <app-icono nombre="cerrar" />
        </button>
      </header>
      <div class="modal-cuerpo"><ng-content /></div>
    </section>
  `,
})
export class Modal {
  readonly titulo = input.required<string>();
  readonly subtitulo = input('');
  readonly tamano = input<'normal' | 'ancho' | 'lateral'>('normal');
  readonly cerrar = output<void>();
}
