import { Component, input, model } from '@angular/core';
import { Icono } from '../../atoms/icono/icono';

@Component({
  selector: 'app-buscador',
  imports: [Icono],
  template: `
    <label class="buscador">
      <app-icono nombre="buscar" [tam]="16" />
      <input
        type="search"
        [placeholder]="placeholder()"
        [value]="term()"
        (input)="term.set($any($event.target).value)"
        [attr.aria-label]="placeholder()"
      />
    </label>
  `,
})
export class Buscador {
  readonly term = model('');
  readonly placeholder = input('Buscar...');
}
