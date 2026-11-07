import { Component, input } from '@angular/core';
import { Icono, NombreIcono } from '../../atoms/icono/icono';

/** Mensaje centrado para cuando falta seleccionar contexto o no hay registros. */
@Component({
  selector: 'app-estado-vacio',
  imports: [Icono],
  template: `
    <div class="estado-vacio">
      <span class="estado-vacio-icono"><app-icono [nombre]="icono()" [tam]="22" /></span>
      <strong>{{ titulo() }}</strong>
      @if (texto()) {
        <p>{{ texto() }}</p>
      }
      <ng-content />
    </div>
  `,
})
export class EstadoVacio {
  readonly titulo = input.required<string>();
  readonly texto = input('');
  readonly icono = input<NombreIcono>('vacio');
}
