import { Component, input } from '@angular/core';

/** Título de la página con subtítulo y espacio para las acciones principales. */
@Component({
  selector: 'app-encabezado',
  template: `
    <header class="encabezado">
      <div>
        @if (antetitulo()) {
          <p class="antetitulo">{{ antetitulo() }}</p>
        }
        <h1>{{ titulo() }}</h1>
        @if (subtitulo()) {
          <p class="subtitulo">{{ subtitulo() }}</p>
        }
      </div>
      <div class="encabezado-acciones"><ng-content /></div>
    </header>
  `,
})
export class Encabezado {
  readonly titulo = input.required<string>();
  readonly subtitulo = input('');
  readonly antetitulo = input('');
}
