import { Component, model, input } from '@angular/core';

@Component({
  selector: 'app-input',
  template: `<input [type]="type()" [placeholder]="placeholder()" [value]="value()" (input)="value.set($any($event.target).value)" />`,
})
export class Input {
  readonly type = input('text');
  readonly placeholder = input('');
  readonly value = model('');
}
