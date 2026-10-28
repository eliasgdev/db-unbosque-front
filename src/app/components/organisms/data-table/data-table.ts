import { Component, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-data-table',
  imports: [DecimalPipe],
  template: `
    <table>
      <thead>
        <tr>
          @for (col of columns(); track col) {
            <th>{{ col }}</th>
          }
        </tr>
      </thead>
      <tbody>
        @for (row of rows(); track $index) {
          <tr [class.selected]="row === selected()" (click)="rowClick.emit(row)">
            @for (col of columns(); track col) {
              @let valor = $any(row)[col];
              <td>{{ typeof valor === 'number' ? (valor | number: '1.0-2') : valor }}</td>
            }
          </tr>
        } @empty {
          <tr><td [attr.colspan]="columns().length">Sin datos</td></tr>
        }
      </tbody>
    </table>
  `,
})
export class DataTable {
  readonly columns = input<string[]>([]);
  readonly rows = input<object[]>([]);
  readonly selected = input<object | null>(null);
  readonly rowClick = output<any>();
}
