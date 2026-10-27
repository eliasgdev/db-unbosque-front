import { Component, input } from '@angular/core';

@Component({
  selector: 'app-data-table',
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
          <tr>
            @for (col of columns(); track col) {
              <td>{{ $any(row)[col] }}</td>
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
}
