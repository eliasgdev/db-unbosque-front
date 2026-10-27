import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-button',
  template: `<button [type]="type()" (click)="pressed.emit()"><ng-content /></button>`,
})
export class Button {
  readonly type = input<'button' | 'submit'>('button');
  readonly pressed = output();
}
