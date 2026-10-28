import { Component, input, model } from '@angular/core';

export interface Opcion {
  value: string;
  label: string;
}

@Component({
  selector: 'app-select',
  template: `
    <label>
      {{ label() }}
      <select (change)="value.set($any($event.target).value)">
        <option value="">Seleccione...</option>
        @for (o of options(); track o.value) {
          <option [value]="o.value" [selected]="o.value === value()">{{ o.label }}</option>
        }
      </select>
    </label>
  `,
})
export class Select {
  readonly label = input('');
  readonly options = input<Opcion[]>([]);
  readonly value = model('');
}
