import { Component, input } from '@angular/core';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-stat-card',
  imports: [CurrencyPipe],
  template: `
    <article class="stat-card">
      <span>{{ label() }}</span>
      <strong>{{ value() | currency: 'COP' : 'symbol-narrow' : '1.0-0' }}</strong>
    </article>
  `,
})
export class StatCard {
  readonly label = input('');
  readonly value = input(0);
}
