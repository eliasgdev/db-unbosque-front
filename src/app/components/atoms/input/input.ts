import { Component, model, input } from '@angular/core';

@Component({
  selector: 'app-input',
  template: `<input [placeholder]="placeholder()" [value]="value()" (input)="value.set($any($event.target).value)" />`,
})
export class Input {
  readonly placeholder = input('');
  readonly value = model('');
}
