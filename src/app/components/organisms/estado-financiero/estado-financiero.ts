import { Component, input } from '@angular/core';
import { FilaReporte } from '../../../core/models/contabilidad';
import { MontoPipe } from '../../../shared/pipes/formato.pipes';

/** Presentación de un estado financiero: rubros con subtotal, cuentas con saldo y líneas de total. */
@Component({
  selector: 'app-estado-financiero',
  imports: [MontoPipe],
  template: `
    <div class="estado-financiero">
      @if (titulo()) {
        <h3 class="ef-titulo">{{ titulo() }}</h3>
      }
      @for (f of filas(); track $index) {
        <div
          class="ef-fila"
          [class]="'ef-fila ef-' + f.tipo + ' ef-nivel-' + f.nivel"
          [style.padding-left.px]="
            f.tipo === 'total' || f.tipo === 'resultado' ? null : 22 * (f.nivel - 1)
          "
        >
          <span class="ef-nombre">
            @if (f.tipo === 'cuenta' && f.codigo) {
              <span class="ef-codigo">{{ f.codigo }}</span>
            }
            {{ f.nombre }}
          </span>
          <span class="ef-valor" [class.negativo]="f.valor < 0">{{
            f.valor | monto: (f.tipo === 'cuenta' ? null : moneda())
          }}</span>
        </div>
      } @empty {
        <p class="ef-vacio">Sin movimientos para mostrar.</p>
      }
    </div>
  `,
})
export class EstadoFinanciero {
  readonly filas = input<FilaReporte[]>([]);
  readonly titulo = input('');
  readonly moneda = input('COP');
}
