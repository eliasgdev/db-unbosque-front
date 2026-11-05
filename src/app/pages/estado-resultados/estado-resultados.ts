import { Component, computed, inject } from '@angular/core';
import { StatCard } from '../../components/molecules/stat-card/stat-card';
import { AvisoApi } from '../../components/molecules/aviso-api/aviso-api';
import { Encabezado } from '../../components/molecules/encabezado/encabezado';
import { EstadoVacio } from '../../components/molecules/estado-vacio/estado-vacio';
import { EstadoFinanciero } from '../../components/organisms/estado-financiero/estado-financiero';
import { Icono } from '../../components/atoms/icono/icono';
import { FilaReporte } from '../../core/models/contabilidad';
import { ContabilidadService } from '../../core/services/contabilidad.service';
import { SeleccionService } from '../../core/services/seleccion.service';
import { aplanarRubros } from '../../core/utils/arbol';
import { porcentaje } from '../../core/utils/formato';
import { FechaPipe } from '../../shared/pipes/formato.pipes';

@Component({
  selector: 'app-estado-resultados',
  imports: [StatCard, AvisoApi, Encabezado, EstadoVacio, EstadoFinanciero, Icono, FechaPipe],
  template: `
    <app-encabezado
      titulo="Estado de resultados"
      subtitulo="Ingresos, costos y gastos del periodo, calculados con los asientos contabilizados."
    >
      @if (reporte.hasValue()) {
        <button type="button" class="btn btn-secundario" (click)="imprimir()">
          <app-icono nombre="imprimir" [tam]="16" /> Imprimir
        </button>
      }
    </app-encabezado>

    @if (!seleccion.periodoId()) {
      <app-estado-vacio
        titulo="Sin periodo seleccionado"
        texto="Elija una empresa y un periodo en la barra superior."
        icono="calendario"
      />
    } @else {
      <app-aviso-api [error]="reporte.error()" />
      @if (reporte.hasValue()) {
        @let r = reporte.value();
        <section class="kpis">
          <app-stat-card label="Ingresos" [value]="r.ingresos" [moneda]="moneda()" tono="info" />
          <app-stat-card
            label="Utilidad bruta"
            [value]="r.utilidad_bruta"
            [moneda]="moneda()"
            tono="acento"
            [detalle]="'Margen ' + pct(r.utilidad_bruta, r.ingresos)"
          />
          <app-stat-card
            label="Utilidad operacional"
            [value]="r.utilidad_operacional"
            [moneda]="moneda()"
            tono="aviso"
            [detalle]="'Margen ' + pct(r.utilidad_operacional, r.ingresos)"
          />
          <app-stat-card
            label="Utilidad neta"
            [value]="r.utilidad_neta"
            [moneda]="moneda()"
            [tono]="r.utilidad_neta >= 0 ? 'ok' : 'error'"
            [detalle]="'Margen ' + pct(r.utilidad_neta, r.ingresos)"
          />
        </section>

        <article class="documento">
          <header class="documento-cabecera">
            <strong>{{ seleccion.empresa()?.razon_social }}</strong>
            <span>NIT {{ seleccion.empresa()?.nit }}</span>
            <h2>Estado de resultados</h2>
            <span
              >Del {{ r.fecha_inicio | fecha: true }} al {{ r.fecha_fin | fecha: true }} · Cifras en
              {{ moneda() }}</span
            >
          </header>
          <app-estado-financiero [filas]="filas()" [moneda]="moneda()" />
        </article>
      } @else if (reporte.isLoading()) {
        <section class="kpis">
          @for (i of [1, 2, 3, 4]; track i) {
            <article class="kpi">
              <span class="esqueleto"></span><span class="esqueleto esqueleto-grande"></span>
            </article>
          }
        </section>
      }
    }
  `,
})
export class EstadoResultadosPage {
  readonly seleccion = inject(SeleccionService);
  readonly moneda = this.seleccion.moneda;
  readonly reporte = inject(ContabilidadService).estadoResultados(this.seleccion.periodoId);

  readonly filas = computed<FilaReporte[]>(() => {
    if (!this.reporte.hasValue()) return [];
    const r = this.reporte.value();
    const resultado = (
      nombre: string,
      valor: number,
      tipo: FilaReporte['tipo'] = 'total',
    ): FilaReporte => ({ tipo, codigo: '', nombre, nivel: 1, valor });
    return [
      ...aplanarRubros(r.rubros),
      resultado('Utilidad bruta (ingresos − costos)', r.utilidad_bruta),
      resultado('Utilidad operacional', r.utilidad_operacional),
      resultado(
        r.utilidad_neta >= 0 ? 'Utilidad neta del ejercicio' : 'Pérdida neta del ejercicio',
        r.utilidad_neta,
        'resultado',
      ),
    ];
  });

  pct(parte: number, total: number) {
    return porcentaje(parte, total);
  }

  imprimir() {
    window.print();
  }
}
