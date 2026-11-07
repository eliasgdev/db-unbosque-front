import { Component, computed, inject, linkedSignal } from '@angular/core';
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
import { FechaPipe, MontoPipe } from '../../shared/pipes/formato.pipes';

@Component({
  selector: 'app-balance-general',
  imports: [
    StatCard,
    AvisoApi,
    Encabezado,
    EstadoVacio,
    EstadoFinanciero,
    Icono,
    FechaPipe,
    MontoPipe,
  ],
  template: `
    <app-encabezado
      titulo="Balance general"
      subtitulo="Situación financiera acumulada a la fecha de corte."
    >
      <label class="campo-en-linea">
        <app-icono nombre="calendario" [tam]="16" />
        <span>Fecha de corte</span>
        <input
          type="date"
          [value]="fechaCorte()"
          (change)="fechaCorte.set($any($event.target).value)"
        />
      </label>
      @if (reporte.hasValue()) {
        <button type="button" class="btn btn-secundario" (click)="imprimir()">
          <app-icono nombre="imprimir" [tam]="16" /> Imprimir
        </button>
      }
    </app-encabezado>

    @if (!seleccion.empresaId()) {
      <app-estado-vacio
        titulo="Sin empresa seleccionada"
        texto="Elija una empresa en la barra superior."
        icono="empresas"
      />
    } @else {
      <app-aviso-api [error]="reporte.error()" />
      @if (reporte.hasValue()) {
        @let r = reporte.value();
        <section class="kpis">
          <app-stat-card
            label="Total activo"
            [value]="r.total_activo"
            [moneda]="moneda()"
            tono="info"
          />
          <app-stat-card
            label="Total pasivo"
            [value]="r.total_pasivo"
            [moneda]="moneda()"
            tono="aviso"
          />
          <app-stat-card
            label="Total patrimonio"
            [value]="r.total_patrimonio"
            [moneda]="moneda()"
            tono="acento"
            [detalle]="'Incluye utilidad del ejercicio'"
          />
          <app-stat-card
            label="Utilidad del ejercicio"
            [value]="r.utilidad_ejercicio"
            [moneda]="moneda()"
            [tono]="r.utilidad_ejercicio >= 0 ? 'ok' : 'error'"
          />
        </section>

        <p class="alerta" [class.alerta-ok]="r.cuadra" [class.alerta-error]="!r.cuadra">
          <app-icono [nombre]="r.cuadra ? 'check' : 'alerta'" [tam]="16" />
          @if (r.cuadra) {
            La ecuación contable se cumple: Activo = Pasivo + Patrimonio.
          } @else {
            El balance no cuadra: diferencia de {{ r.diferencia_ecuacion | monto: moneda() }}.
          }
        </p>

        <article class="documento">
          <header class="documento-cabecera">
            <strong>{{ r.razon_social }}</strong>
            <span>NIT {{ seleccion.empresa()?.nit }}</span>
            <h2>Estado de situación financiera</h2>
            <span>Al {{ r.fecha_corte | fecha: true }} · Cifras en {{ moneda() }}</span>
          </header>
          <div class="balance-columnas">
            <app-estado-financiero [filas]="activo()" [moneda]="moneda()" />
            <app-estado-financiero [filas]="pasivoPatrimonio()" [moneda]="moneda()" />
          </div>
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
export class BalanceGeneralPage {
  readonly seleccion = inject(SeleccionService);
  readonly moneda = this.seleccion.moneda;

  /** Por defecto se corta al final del periodo seleccionado (o hoy si sigue en curso). */
  readonly fechaCorte = linkedSignal(() => {
    const p = this.seleccion.periodo();
    const hoy = new Date().toISOString().slice(0, 10);
    if (!p) return hoy;
    return hoy >= p.fecha_inicio && hoy < p.fecha_fin ? hoy : p.fecha_fin;
  });
  readonly reporte = inject(ContabilidadService).balanceGeneral(
    this.seleccion.empresaId,
    this.fechaCorte,
  );

  /** La API entrega los rubros de primer nivel ordenados: el primero es el activo y los demás pasivo y patrimonio. */
  private readonly rubros = computed(() =>
    this.reporte.hasValue()
      ? [...this.reporte.value().rubros].sort((a, b) => a.orden - b.orden)
      : [],
  );

  readonly activo = computed<FilaReporte[]>(() => {
    const [activo] = this.rubros();
    if (!activo) return [];
    return [
      ...aplanarRubros([activo]),
      {
        tipo: 'resultado',
        codigo: '',
        nombre: 'Total activo',
        nivel: 1,
        valor: this.reporte.value()!.total_activo,
      },
    ];
  });

  readonly pasivoPatrimonio = computed<FilaReporte[]>(() => {
    if (!this.reporte.hasValue()) return [];
    const r = this.reporte.value();
    const filas = aplanarRubros(this.rubros().slice(1));
    // La utilidad del ejercicio llega aparte; se ubica dentro del patrimonio para que su total coincida.
    if (r.utilidad_ejercicio) {
      filas.push({
        tipo: 'cuenta',
        codigo: '',
        nombre: 'Utilidad del ejercicio en curso',
        nivel: 2,
        valor: r.utilidad_ejercicio,
      });
    }
    return [
      ...filas,
      {
        tipo: 'total',
        codigo: '',
        nombre: 'Total patrimonio',
        nivel: 1,
        valor: r.total_patrimonio,
      },
      {
        tipo: 'resultado',
        codigo: '',
        nombre: 'Total pasivo y patrimonio',
        nivel: 1,
        valor: r.total_pasivo + r.total_patrimonio,
      },
    ];
  });

  imprimir() {
    window.print();
  }
}
