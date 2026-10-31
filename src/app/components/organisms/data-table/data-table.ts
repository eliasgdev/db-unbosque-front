import { Component, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';

export interface Columna {
  key: string;
  label: string;
  /** Sangra la celda según la propiedad `nivel` de la fila. */
  sangria?: boolean;
}

@Component({
  selector: 'app-data-table',
  imports: [DecimalPipe],
  template: `
    <div class="table-scroll">
      <table>
        <thead>
          <tr>
            @for (col of columns(); track col.key) {
              <th [class.num]="typeof $any(rows()[0])?.[col.key] === 'number'">{{ col.label }}</th>
            }
          </tr>
        </thead>
        <tbody>
          @for (row of rows(); track $index) {
            <tr [class.selected]="row === selected()" [class.clickable]="clickable()" (click)="rowClick.emit(row)">
              @for (col of columns(); track col.key) {
                @let valor = $any(row)[col.key];
                @if (typeof valor === 'number') {
                  <td class="num">{{ valor | number: '1.0-2' }}</td>
                } @else if (typeof valor === 'boolean') {
                  <td><span class="badge" [class.badge-ok]="valor" [class.badge-error]="!valor">{{ valor ? 'Sí' : 'No' }}</span></td>
                } @else {
                  <td [style.padding-left.px]="col.sangria ? 12 + 20 * ($any(row).nivel - 1) : null" [class.fuerte]="col.sangria && $any(row).nivel === 1">
                    {{ valor ?? '—' }}
                  </td>
                }
              }
            </tr>
          } @empty {
            <tr><td class="vacio" [attr.colspan]="columns().length">Sin datos</td></tr>
          }
        </tbody>
        @if (footer().length) {
          <tfoot>
            <tr>
              @for (celda of footer(); track $index) {
                <td [class.num]="typeof celda === 'number'">{{ typeof celda === 'number' ? (celda | number: '1.0-2') : celda }}</td>
              }
            </tr>
          </tfoot>
        }
      </table>
    </div>
  `,
})
export class DataTable {
  readonly columns = input<Columna[]>([]);
  readonly rows = input<object[]>([]);
  readonly selected = input<object | null>(null);
  readonly clickable = input(false);
  readonly footer = input<(string | number)[]>([]);
  readonly rowClick = output<any>();
}
