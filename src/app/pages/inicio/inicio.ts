import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Encabezado } from '../../components/molecules/encabezado/encabezado';
import { StatCard } from '../../components/molecules/stat-card/stat-card';
import { EstadoVacio } from '../../components/molecules/estado-vacio/estado-vacio';
import { AvisoApi } from '../../components/molecules/aviso-api/aviso-api';
import { Icono } from '../../components/atoms/icono/icono';
import { ContabilidadService } from '../../core/services/contabilidad.service';
import { SeleccionService } from '../../core/services/seleccion.service';
import { porcentaje } from '../../core/utils/formato';
import { FechaPipe, MontoPipe } from '../../shared/pipes/formato.pipes';

@Component({
  selector: 'app-inicio',
  imports: [Encabezado, StatCard, EstadoVacio, AvisoApi, Icono, RouterLink, FechaPipe, MontoPipe],
  template: `
    <app-encabezado
      titulo="Resumen"
      [antetitulo]="seleccion.empresa()?.razon_social ?? ''"
      [subtitulo]="
        seleccion.periodo()
          ? 'Periodo ' +
            (seleccion.periodo()!.fecha_inicio | fecha: true) +
            ' – ' +
            (seleccion.periodo()!.fecha_fin | fecha: true)
          : ''
      "
    >
      @if (seleccion.periodoAbierto()) {
        <a class="btn btn-primario" routerLink="/asientos"
          ><app-icono nombre="mas" [tam]="16" /> Registrar asiento</a
        >
      }
    </app-encabezado>

    @if (!seleccion.periodoId()) {
      <app-estado-vacio
        titulo="Sin periodo seleccionado"
        texto="Elija una empresa y un periodo en la barra superior para ver su resumen."
        icono="calendario"
      />
    } @else {
      <app-aviso-api [error]="resultados.error() ?? balance.error() ?? asientos.error()" />

      <section class="kpis">
        @if (resultados.hasValue()) {
          @let r = resultados.value();
          <app-stat-card
            label="Ingresos del periodo"
            [value]="r.ingresos"
            [moneda]="moneda()"
            tono="info"
          />
          <app-stat-card
            label="Costos y gastos"
            [value]="r.costos + r.gastos"
            [moneda]="moneda()"
            tono="aviso"
            [detalle]="pct(r.costos + r.gastos, r.ingresos) + ' de los ingresos'"
          />
          <app-stat-card
            label="Utilidad neta"
            [value]="r.utilidad_neta"
            [moneda]="moneda()"
            [tono]="r.utilidad_neta >= 0 ? 'ok' : 'error'"
            [detalle]="'Margen neto ' + pct(r.utilidad_neta, r.ingresos)"
          />
        } @else {
          @for (i of [1, 2, 3]; track i) {
            <article class="kpi">
              <span class="esqueleto"></span><span class="esqueleto esqueleto-grande"></span>
            </article>
          }
        }
        @if (balance.hasValue()) {
          <app-stat-card
            label="Total activo"
            [value]="balance.value().total_activo"
            [moneda]="moneda()"
            tono="acento"
            [detalle]="'Al ' + (fechaCorte() | fecha)"
          />
        } @else {
          <article class="kpi">
            <span class="esqueleto"></span><span class="esqueleto esqueleto-grande"></span>
          </article>
        }
      </section>

      <div class="rejilla-inicio">
        <section class="tarjeta">
          <header class="tarjeta-cabecera">
            <h2>Asientos recientes</h2>
            <a routerLink="/asientos" class="enlace"
              >Ver todos <app-icono nombre="derecha" [tam]="14"
            /></a>
          </header>
          @if (recientes().length) {
            <ul class="lista-asientos">
              @for (a of recientes(); track a.id_asiento) {
                <li>
                  <span class="lista-numero">N.º {{ a.numero }}</span>
                  <span class="lista-texto">
                    <strong>{{ a.descripcion }}</strong>
                    <small>{{ a.fecha | fecha }} · {{ a.tipo_asiento }}</small>
                  </span>
                  <span class="lista-monto">{{ a.total_debe | monto: moneda() : 0 }}</span>
                  <span
                    class="etiqueta"
                    [class]="
                      a.estado === 'BORRADOR' ? 'etiqueta etiqueta-aviso' : 'etiqueta etiqueta-ok'
                    "
                  >
                    {{ a.estado === 'BORRADOR' ? 'Borrador' : 'Contabilizado' }}
                  </span>
                </li>
              }
            </ul>
          } @else if (asientos.isLoading()) {
            <span class="esqueleto"></span>
          } @else {
            <p class="texto-suave">Este periodo todavía no tiene asientos.</p>
          }
        </section>

        <div class="columna-inicio">
          <section class="tarjeta">
            <header class="tarjeta-cabecera"><h2>Ecuación contable</h2></header>
            @if (balance.hasValue()) {
              @let b = balance.value();
              <div class="ecuacion">
                <div>
                  <small>Activo</small><strong>{{ b.total_activo | monto: moneda() : 0 }}</strong>
                </div>
                <span class="ecuacion-signo">=</span>
                <div>
                  <small>Pasivo</small><strong>{{ b.total_pasivo | monto: moneda() : 0 }}</strong>
                </div>
                <span class="ecuacion-signo">+</span>
                <div>
                  <small>Patrimonio</small
                  ><strong>{{ b.total_patrimonio | monto: moneda() : 0 }}</strong>
                </div>
              </div>
              <p class="estado-linea" [class.estado-ok]="b.cuadra" [class.estado-error]="!b.cuadra">
                <app-icono [nombre]="b.cuadra ? 'check' : 'alerta'" [tam]="16" />
                {{
                  b.cuadra
                    ? 'El balance cuadra al ' + (b.fecha_corte | fecha)
                    : 'Diferencia de ' + (b.diferencia_ecuacion | monto: moneda())
                }}
              </p>
            } @else {
              <span class="esqueleto"></span>
            }
          </section>

          <section class="tarjeta">
            <header class="tarjeta-cabecera"><h2>Estado de los registros</h2></header>
            <dl class="datos">
              <div>
                <dt>Asientos contabilizados</dt>
                <dd>{{ conteo().contabilizados }}</dd>
              </div>
              <div>
                <dt>Borradores pendientes</dt>
                <dd>{{ conteo().borradores }}</dd>
              </div>
              <div>
                <dt>Borradores que no cuadran</dt>
                <dd [class.texto-error]="conteo().descuadrados > 0">{{ conteo().descuadrados }}</dd>
              </div>
              <div>
                <dt>Estado del periodo</dt>
                <dd>{{ seleccion.periodoAbierto() ? 'Abierto' : 'Cerrado' }}</dd>
              </div>
            </dl>
            @if (conteo().borradores && seleccion.periodoAbierto()) {
              <a routerLink="/asientos" class="enlace"
                >Revisar borradores <app-icono nombre="derecha" [tam]="14"
              /></a>
            }
          </section>
        </div>
      </div>
    }
  `,
})
export class Inicio {
  private readonly api = inject(ContabilidadService);
  readonly seleccion = inject(SeleccionService);
  readonly moneda = this.seleccion.moneda;

  /** El balance del resumen se corta al final del periodo, o hoy si el periodo sigue en curso. */
  readonly fechaCorte = computed(() => {
    const p = this.seleccion.periodo();
    if (!p) return '';
    const hoy = new Date().toISOString().slice(0, 10);
    return hoy < p.fecha_fin && hoy >= p.fecha_inicio ? hoy : p.fecha_fin;
  });

  readonly resultados = this.api.estadoResultados(this.seleccion.periodoId);
  readonly balance = this.api.balanceGeneral(this.seleccion.empresaId, this.fechaCorte);
  readonly asientos = this.api.asientos(this.seleccion.periodoId);

  private readonly lista = computed(() => (this.asientos.hasValue() ? this.asientos.value() : []));
  readonly recientes = computed(() =>
    [...this.lista()]
      .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.numero - a.numero)
      .slice(0, 6),
  );
  readonly conteo = computed(() => {
    const lista = this.lista();
    const borradores = lista.filter((a) => a.estado === 'BORRADOR');
    return {
      contabilizados: lista.length - borradores.length,
      borradores: borradores.length,
      descuadrados: borradores.filter((a) => Math.abs(a.total_debe - a.total_haber) >= 0.005)
        .length,
    };
  });

  pct(parte: number, total: number) {
    return porcentaje(parte, total);
  }
}
