import { Component, input } from '@angular/core';
import { MontoPipe } from '../../../shared/pipes/formato.pipes';
import { Tono } from '../../../core/utils/formato';

/** Indicador principal: etiqueta, monto en la moneda de la empresa y un detalle opcional. */
@Component({
  selector: 'app-stat-card',
  imports: [MontoPipe],
  template: `
    <article class="kpi" [class]="'kpi kpi-' + tono()">
      <span class="kpi-etiqueta">{{ label() }}</span>
      <strong class="kpi-valor" [class.negativo]="value() < 0">{{
        value() | monto: moneda() : 0
      }}</strong>
      @if (detalle()) {
        <span class="kpi-detalle">{{ detalle() }}</span>
      }
    </article>
  `,
})
export class StatCard {
  readonly label = input('');
  readonly value = input(0);
  readonly moneda = input<string | null>('COP');
  readonly detalle = input('');
  readonly tono = input<Tono>('neutro');
}
