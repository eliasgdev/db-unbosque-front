import { Component, model } from '@angular/core';
import { Input } from '../../atoms/input/input';

@Component({
  selector: 'app-search-field',
  imports: [Input],
  template: `<app-input placeholder="Buscar..." [(value)]="term" />`,
})
export class SearchField {
  readonly term = model('');
}
