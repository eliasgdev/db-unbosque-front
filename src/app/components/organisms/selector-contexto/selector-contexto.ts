import { Component, inject } from '@angular/core';
import { AvisoApi } from '../../molecules/aviso-api/aviso-api';
import { SeleccionService } from '../../../core/services/seleccion.service';
import { FechaPipe } from '../../../shared/pipes/formato.pipes';

/** Empresa y periodo de trabajo, siempre visibles en la barra superior. */
@Component({
  selector: 'app-selector-contexto',
  imports: [AvisoApi, FechaPipe],
  template: `
    <div class="contexto">
      <label class="contexto-campo">
        <span>Empresa</span>
        <select
          [value]="seleccion.empresaId()"
          (change)="seleccion.empresaId.set($any($event.target).value)"
          [disabled]="!seleccion.listaEmpresas().length"
        >
          @if (!seleccion.listaEmpresas().length) {
            <option value="">
              {{ seleccion.empresas.isLoading() ? 'Cargando...' : 'Sin empresas' }}
            </option>
          }
          @for (e of seleccion.listaEmpresas(); track e.id_empresa) {
            <option
              [value]="e.id_empresa"
              [selected]="String(e.id_empresa) === seleccion.empresaId()"
            >
              {{ e.razon_social }}
            </option>
          }
        </select>
      </label>
      <label class="contexto-campo">
        <span>Periodo</span>
        <select
          [value]="seleccion.periodoId()"
          (change)="seleccion.periodoId.set($any($event.target).value)"
          [disabled]="!seleccion.listaPeriodos().length"
        >
          @if (!seleccion.listaPeriodos().length) {
            <option value="">
              {{ seleccion.periodos.isLoading() ? 'Cargando...' : 'Sin periodos' }}
            </option>
          }
          @for (p of seleccion.listaPeriodos(); track p.id_periodo) {
            <option
              [value]="p.id_periodo"
              [selected]="String(p.id_periodo) === seleccion.periodoId()"
            >
              {{ p.fecha_inicio | fecha }} – {{ p.fecha_fin | fecha
              }}{{ p.estado === 'CERRADO' ? ' · cerrado' : '' }}
            </option>
          }
        </select>
      </label>
      @if (seleccion.empresa(); as e) {
        <div class="contexto-meta">
          <span>NIT {{ e.nit }}</span>
          <span class="etiqueta etiqueta-neutro">{{ e.codigo_moneda }}</span>
          @if (seleccion.periodo(); as p) {
            <span
              class="etiqueta"
              [class]="p.estado === 'ABIERTO' ? 'etiqueta etiqueta-ok' : 'etiqueta etiqueta-neutro'"
            >
              {{ p.estado === 'ABIERTO' ? 'Periodo abierto' : 'Periodo cerrado' }}
            </span>
          }
        </div>
      }
    </div>
    <app-aviso-api [error]="seleccion.empresas.error() ?? seleccion.periodos.error()" />
  `,
})
export class SelectorContexto {
  readonly seleccion = inject(SeleccionService);
  protected readonly String = String;
}
