import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { Columna, DataTable } from '../../components/organisms/data-table/data-table';
import { AsientoForm } from '../../components/organisms/asiento-form/asiento-form';
import { Modal } from '../../components/organisms/modal/modal';
import { AvisoApi } from '../../components/molecules/aviso-api/aviso-api';
import { Encabezado } from '../../components/molecules/encabezado/encabezado';
import { EstadoVacio } from '../../components/molecules/estado-vacio/estado-vacio';
import { Buscador } from '../../components/molecules/buscador/buscador';
import { Icono } from '../../components/atoms/icono/icono';
import { Asiento } from '../../core/models/contabilidad';
import { ContabilidadService } from '../../core/services/contabilidad.service';
import { NotificacionService } from '../../core/services/notificacion.service';
import { SeleccionService } from '../../core/services/seleccion.service';
import { mensajeError } from '../../core/utils/errores';
import { FechaPipe, MontoPipe } from '../../shared/pipes/formato.pipes';

type Filtro = 'TODOS' | 'BORRADOR' | 'CONTABILIZADO';

@Component({
  selector: 'app-asientos',
  imports: [
    DataTable,
    AvisoApi,
    AsientoForm,
    Modal,
    Encabezado,
    EstadoVacio,
    Buscador,
    Icono,
    FechaPipe,
    MontoPipe,
  ],
  template: `
    <app-encabezado
      titulo="Asientos contables"
      subtitulo="Libro diario del periodo: registre, revise y contabilice los comprobantes."
    >
      @if (seleccion.periodoId()) {
        @if (seleccion.periodoAbierto()) {
          <button type="button" class="btn btn-primario" (click)="modo.set('nuevo')">
            <app-icono nombre="mas" [tam]="16" /> Nuevo asiento
          </button>
        } @else {
          <span class="etiqueta etiqueta-neutro etiqueta-grande"
            ><app-icono nombre="candado" [tam]="14" /> Periodo cerrado: solo consulta</span
          >
        }
      }
    </app-encabezado>

    @if (!seleccion.periodoId()) {
      <app-estado-vacio
        titulo="Sin periodo seleccionado"
        texto="Elija una empresa y un periodo en la barra superior."
        icono="calendario"
      />
    } @else {
      <section class="resumen-fila">
        <div>
          <small>Asientos</small><strong>{{ todos().length }}</strong>
        </div>
        <div>
          <small>Contabilizados</small><strong>{{ contar('CONTABILIZADO') }}</strong>
        </div>
        <div>
          <small>Borradores</small><strong>{{ contar('BORRADOR') }}</strong>
        </div>
        <div>
          <small>Total débitos</small
          ><strong>{{ totalDebe() | monto: seleccion.moneda() : 0 }}</strong>
        </div>
      </section>

      <section class="tarjeta tarjeta-tabla">
        <div class="barra-herramientas">
          <div class="segmentos" role="tablist">
            @for (f of filtros; track f.valor) {
              <button
                type="button"
                role="tab"
                [class.activo]="filtro() === f.valor"
                [attr.aria-selected]="filtro() === f.valor"
                (click)="filtro.set(f.valor)"
              >
                {{ f.texto }}
              </button>
            }
          </div>
          <app-buscador [(term)]="term" placeholder="Buscar asiento" />
        </div>
        <app-aviso-api [error]="asientos.error()" />
        <app-data-table
          [columns]="columnasAsiento"
          [rows]="filas()"
          [cargando]="asientos.isLoading()"
          [clickable]="true"
          [selected]="seleccionado()"
          vacio="No hay asientos que coincidan con el filtro."
          (rowClick)="seleccionado.set($event)"
        />
      </section>
    }

    @if (seleccionado(); as a) {
      @if (modo() === 'consulta') {
        <app-modal
          [titulo]="'Asiento N.º ' + a.numero"
          [subtitulo]="a.descripcion"
          tamano="lateral"
          (cerrar)="seleccionado.set(null)"
        >
          <dl class="datos datos-columnas">
            <div>
              <dt>Fecha</dt>
              <dd>{{ a.fecha | fecha: true }}</dd>
            </div>
            <div>
              <dt>Tipo</dt>
              <dd>{{ a.tipo_asiento }}</dd>
            </div>
            <div>
              <dt>Estado</dt>
              <dd>
                <span
                  class="etiqueta"
                  [class]="
                    a.estado === 'BORRADOR' ? 'etiqueta etiqueta-aviso' : 'etiqueta etiqueta-ok'
                  "
                >
                  {{ a.estado === 'BORRADOR' ? 'Borrador' : 'Contabilizado' }}
                </span>
              </dd>
            </div>
            <div>
              <dt>Partida doble</dt>
              <dd>
                @if (detalle.hasValue()) {
                  <span
                    class="indicador"
                    [class.indicador-ok]="detalle.value().cuadra"
                    [class.indicador-error]="!detalle.value().cuadra"
                  >
                    <app-icono [nombre]="detalle.value().cuadra ? 'check' : 'alerta'" [tam]="14" />
                    {{ detalle.value().cuadra ? 'Cuadra' : 'No cuadra' }}
                  </span>
                }
              </dd>
            </div>
          </dl>

          <app-aviso-api [error]="detalle.error()" />
          <h3 class="seccion-titulo">Movimientos</h3>
          <app-data-table
            [columns]="columnasMovimiento"
            [rows]="movimientos()"
            [cargando]="detalle.isLoading()"
            [footer]="totales()"
          />

          @if (detalle.hasValue() && !detalle.value().cuadra) {
            <p class="alerta alerta-error">
              <app-icono nombre="alerta" [tam]="16" />
              Diferencia de
              {{
                detalle.value().total_debe - detalle.value().total_haber
                  | monto: seleccion.moneda()
              }}: corrija los valores antes de contabilizar.
            </p>
          }

          @if (a.estado === 'BORRADOR' && seleccion.periodoAbierto()) {
            <div class="acciones acciones-modal">
              <button
                type="button"
                class="btn btn-secundario"
                (click)="modo.set('editar')"
                [disabled]="!detalle.hasValue()"
              >
                <app-icono nombre="editar" [tam]="16" /> Editar
              </button>
              <button
                type="button"
                class="btn btn-primario"
                (click)="contabilizar(a)"
                [disabled]="procesando() || !detalle.hasValue() || !detalle.value().cuadra"
              >
                <app-icono nombre="check" [tam]="16" />
                {{ procesando() ? 'Contabilizando...' : 'Contabilizar' }}
              </button>
            </div>
          } @else if (a.estado === 'CONTABILIZADO') {
            <p class="texto-suave texto-pequeno">
              <app-icono nombre="candado" [tam]="14" /> Un asiento contabilizado ya afecta los
              saldos y no se puede modificar.
            </p>
          }
        </app-modal>
      } @else if (modo() === 'editar' && detalle.hasValue()) {
        <app-modal
          [titulo]="'Editar asiento N.º ' + a.numero"
          subtitulo="Solo los borradores de un periodo abierto se pueden modificar."
          tamano="ancho"
          (cerrar)="modo.set('consulta')"
        >
          <app-asiento-form
            [idEmpresa]="seleccion.empresaId()"
            [idPeriodo]="seleccion.periodoId()"
            [asiento]="detalle.value()"
            [moneda]="seleccion.moneda()"
            (guardado)="modo.set('consulta')"
            (cancelado)="modo.set('consulta')"
          />
        </app-modal>
      }
    }

    @if (modo() === 'nuevo') {
      <app-modal
        titulo="Nuevo asiento"
        subtitulo="Se guarda como borrador; contabilícelo cuando débitos y créditos cuadren."
        tamano="ancho"
        (cerrar)="modo.set('consulta')"
      >
        <app-asiento-form
          [idEmpresa]="seleccion.empresaId()"
          [idPeriodo]="seleccion.periodoId()"
          [siguienteNumero]="siguienteNumero()"
          [fechaSugerida]="fechaSugerida()"
          [moneda]="seleccion.moneda()"
          (guardado)="modo.set('consulta')"
          (cancelado)="modo.set('consulta')"
        />
      </app-modal>
    }
  `,
})
export class Asientos {
  private readonly service = inject(ContabilidadService);
  private readonly notificacion = inject(NotificacionService);
  readonly seleccion = inject(SeleccionService);

  readonly filtros: { valor: Filtro; texto: string }[] = [
    { valor: 'TODOS', texto: 'Todos' },
    { valor: 'BORRADOR', texto: 'Borradores' },
    { valor: 'CONTABILIZADO', texto: 'Contabilizados' },
  ];
  readonly columnasAsiento: Columna[] = [
    { key: 'numero', label: 'N.º', tipo: 'numero', ancho: '64px' },
    { key: 'fecha', label: 'Fecha', tipo: 'fecha', ancho: '120px' },
    { key: 'tipo_asiento', label: 'Tipo', ancho: '96px' },
    { key: 'descripcion', label: 'Descripción' },
    { key: 'total_debe', label: 'Débitos', tipo: 'monto' },
    { key: 'total_haber', label: 'Créditos', tipo: 'monto' },
    { key: 'estado', label: 'Estado', tipo: 'estado', ancho: '130px' },
  ];
  readonly columnasMovimiento: Columna[] = [
    { key: 'codigo_cuenta', label: 'Cuenta', tipo: 'codigo', ancho: '90px' },
    { key: 'nombre_cuenta', label: 'Nombre' },
    { key: 'tercero', label: 'Tercero' },
    { key: 'debe', label: 'Débito', tipo: 'monto' },
    { key: 'haber', label: 'Crédito', tipo: 'monto' },
  ];

  readonly modo = linkedSignal<string, 'consulta' | 'nuevo' | 'editar'>({
    source: this.seleccion.periodoId,
    computation: () => 'consulta',
  });
  readonly procesando = signal(false);
  readonly filtro = signal<Filtro>('TODOS');
  readonly term = signal('');

  readonly asientos = this.service.asientos(this.seleccion.periodoId);
  private readonly terceros = this.service.terceros(this.seleccion.empresaId);

  readonly todos = computed(() => (this.asientos.hasValue() ? this.asientos.value() : []));
  readonly filas = computed(() => {
    const t = this.term().trim().toLowerCase();
    const f = this.filtro();
    return this.todos().filter(
      (a) =>
        (f === 'TODOS' || a.estado === f) &&
        (!t || String(a.numero) === t || a.descripcion.toLowerCase().includes(t)),
    );
  });
  readonly totalDebe = computed(() =>
    this.todos()
      .filter((a) => a.estado === 'CONTABILIZADO')
      .reduce((s, a) => s + a.total_debe, 0),
  );
  readonly siguienteNumero = computed(
    () => this.todos().reduce((m, a) => Math.max(m, a.numero), 0) + 1,
  );
  readonly fechaSugerida = computed(() => {
    const p = this.seleccion.periodo();
    const hoy = new Date().toISOString().slice(0, 10);
    return p && hoy >= p.fecha_inicio && hoy <= p.fecha_fin ? hoy : (p?.fecha_inicio ?? hoy);
  });

  readonly seleccionado = linkedSignal<string, Asiento | null>({
    source: this.seleccion.periodoId,
    computation: () => null,
  });
  readonly detalle = this.service.asiento(() => String(this.seleccionado()?.id_asiento ?? ''));
  readonly movimientos = computed(() => {
    if (!this.detalle.hasValue()) return [];
    const nombres = new Map(
      (this.terceros.hasValue() ? this.terceros.value() : []).map((t) => [t.id_tercero, t.nombre]),
    );
    return this.detalle
      .value()
      .movimientos.map((m) => ({
        ...m,
        tercero: m.id_tercero ? (nombres.get(m.id_tercero) ?? '—') : '—',
      }));
  });
  readonly totales = computed(() => {
    const movs = this.movimientos();
    return [
      '',
      'Totales',
      '',
      movs.reduce((s, m) => s + m.debe, 0),
      movs.reduce((s, m) => s + m.haber, 0),
    ];
  });

  contar(estado: Filtro) {
    return this.todos().filter((a) => a.estado === estado).length;
  }

  async contabilizar(a: Asiento) {
    if (!confirm(`¿Contabilizar el asiento N.º ${a.numero}? Después no se podrá editar.`)) return;
    this.procesando.set(true);
    try {
      await this.service.contabilizarAsiento(a.id_asiento);
      this.notificacion.ok(`Asiento N.º ${a.numero} contabilizado.`);
      this.seleccionado.set(null);
    } catch (e) {
      this.notificacion.error(mensajeError(e));
    } finally {
      this.procesando.set(false);
    }
  }
}
