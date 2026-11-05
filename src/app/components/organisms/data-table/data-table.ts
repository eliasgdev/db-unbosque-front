import { Component, input, output } from '@angular/core';
import { EtiquetaPipe, FechaPipe, MontoPipe } from '../../../shared/pipes/formato.pipes';
import { tono } from '../../../core/utils/formato';
import { Icono } from '../../atoms/icono/icono';

export type TipoColumna = 'texto' | 'codigo' | 'monto' | 'numero' | 'fecha' | 'estado' | 'si-no';

export interface Columna {
  key: string;
  label: string;
  tipo?: TipoColumna;
  /** Sangra la celda según la propiedad `nivel` de la fila. */
  sangria?: boolean;
  /** Ancho CSS opcional de la columna (por ejemplo '120px'). */
  ancho?: string;
}

const NUMERICAS = new Set<TipoColumna>(['monto', 'numero']);

@Component({
  selector: 'app-data-table',
  imports: [MontoPipe, FechaPipe, EtiquetaPipe, Icono],
  template: `
    <div class="tabla-contenedor">
      <table class="tabla">
        <thead>
          <tr>
            @for (col of columns(); track col.key) {
              <th [class.num]="esNumerica(col)" [style.width]="col.ancho ?? null">
                {{ col.label }}
              </th>
            }
          </tr>
        </thead>
        <tbody>
          @if (cargando() && !rows().length) {
            @for (i of [1, 2, 3, 4]; track i) {
              <tr class="fila-cargando">
                @for (col of columns(); track col.key) {
                  <td><span class="esqueleto"></span></td>
                }
              </tr>
            }
          } @else {
            @for (row of rows(); track $index) {
              <tr
                [class.selected]="row === selected()"
                [class.clickable]="clickable()"
                [class.fila-fuerte]="$any(row).fuerte"
                [attr.tabindex]="clickable() ? 0 : null"
                (click)="rowClick.emit(row)"
                (keydown.enter)="rowClick.emit(row)"
              >
                @for (col of columns(); track col.key) {
                  @let valor = $any(row)[col.key];
                  @switch (col.tipo ?? 'texto') {
                    @case ('monto') {
                      <td class="num">{{ valor | monto }}</td>
                    }
                    @case ('numero') {
                      <td class="num">{{ valor ?? '—' }}</td>
                    }
                    @case ('fecha') {
                      <td class="nowrap">{{ valor | fecha }}</td>
                    }
                    @case ('codigo') {
                      <td class="codigo">{{ valor ?? '—' }}</td>
                    }
                    @case ('estado') {
                      <td>
                        <span class="etiqueta" [class]="'etiqueta etiqueta-' + tono(valor)">{{
                          valor | etiqueta
                        }}</span>
                      </td>
                    }
                    @case ('si-no') {
                      <td>
                        <span
                          class="indicador"
                          [class.indicador-ok]="valor"
                          [class.indicador-error]="!valor"
                        >
                          <app-icono [nombre]="valor ? 'check' : 'alerta'" [tam]="14" />
                          {{ valor ? 'Sí' : 'No' }}
                        </span>
                      </td>
                    }
                    @default {
                      <td
                        [style.padding-left.px]="
                          col.sangria ? 16 + 22 * ($any(row).nivel - 1) : null
                        "
                        [class.fuerte]="col.sangria && $any(row).nivel === 1"
                      >
                        {{ valor ?? '—' }}
                      </td>
                    }
                  }
                }
              </tr>
            } @empty {
              <tr>
                <td class="vacio" [attr.colspan]="columns().length">{{ vacio() }}</td>
              </tr>
            }
          }
        </tbody>
        @if (footer().length && rows().length) {
          <tfoot>
            <tr>
              @for (celda of footer(); track $index) {
                <td [class.num]="typeof celda === 'number'">
                  {{ typeof celda === 'number' ? (celda | monto) : celda }}
                </td>
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
  readonly cargando = input(false);
  readonly vacio = input('Sin registros');
  readonly footer = input<(string | number)[]>([]);
  readonly rowClick = output<any>();

  protected readonly tono = tono;

  esNumerica(col: Columna) {
    return NUMERICAS.has(col.tipo ?? 'texto');
  }
}
