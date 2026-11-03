import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { Columna, DataTable } from '../../components/organisms/data-table/data-table';
import { AsientoForm } from '../../components/organisms/asiento-form/asiento-form';
import { AvisoApi } from '../../components/molecules/aviso-api/aviso-api';
import { Asiento } from '../../core/models/contabilidad';
import { ContabilidadService } from '../../core/services/contabilidad.service';
import { NotificacionService } from '../../core/services/notificacion.service';
import { SeleccionService } from '../../core/services/seleccion.service';
import { mensajeError } from '../../core/utils/errores';

type Modo = 'consulta' | 'nuevo' | 'editar';

@Component({
  selector: 'app-asientos',
  imports: [DataTable, AvisoApi, AsientoForm],
  template: `
    <div class="titulo-pagina">
      <h2>Asientos</h2>
      @if (seleccion.periodoId() && modo() === 'consulta') {
        @if (periodoAbierto()) {
          <button type="button" class="btn-primario" (click)="modo.set('nuevo')">+ Nuevo asiento</button>
        } @else {
          <span class="badge">Periodo cerrado: solo consulta</span>
        }
      }
    </div>
    @if (seleccion.periodoId()) {
      @if (modo() === 'nuevo') {
        <app-asiento-form
          [idEmpresa]="seleccion.empresaId()"
          [idPeriodo]="seleccion.periodoId()"
          [siguienteNumero]="siguienteNumero()"
          [fechaSugerida]="fechaSugerida()"
          (guardado)="modo.set('consulta')"
          (cancelado)="modo.set('consulta')"
        />
      } @else if (modo() === 'editar' && detalle.hasValue()) {
        <app-asiento-form
          [idEmpresa]="seleccion.empresaId()"
          [idPeriodo]="seleccion.periodoId()"
          [asiento]="detalle.value()"
          (guardado)="modo.set('consulta')"
          (cancelado)="modo.set('consulta')"
        />
      } @else {
        <app-aviso-api [error]="asientos.error()" />
        <app-data-table
          [columns]="columnasAsiento"
          [rows]="filas()"
          [selected]="seleccionado()"
          [clickable]="true"
          (rowClick)="seleccionado.set($event)"
        />
        @if (seleccionado(); as a) {
          <div class="titulo-pagina">
            <h3>Movimientos del asiento {{ a.numero }} · {{ a.descripcion }}</h3>
            @if (a.estado === 'BORRADOR' && periodoAbierto()) {
              <div class="acciones">
                <button type="button" class="btn-secundario" (click)="modo.set('editar')" [disabled]="!detalle.hasValue()">Editar</button>
                <button type="button" class="btn-primario" (click)="contabilizar(a)" [disabled]="procesando()">
                  {{ procesando() ? 'Contabilizando...' : 'Contabilizar' }}
                </button>
              </div>
            }
          </div>
          <app-aviso-api [error]="detalle.error()" />
          @if (detalle.hasValue() && !detalle.value().cuadra) {
            <p class="error">El asiento no cumple la partida doble: el debe y el haber son distintos.</p>
          }
          <app-data-table [columns]="columnasMovimiento" [rows]="movimientos()" [footer]="totales()" />
        } @else {
          <p class="aviso">Haga clic en un asiento para ver sus movimientos.</p>
        }
      }
    } @else {
      <p class="aviso">Seleccione una empresa y un periodo.</p>
    }
  `,
})
export class Asientos {
  private readonly service = inject(ContabilidadService);
  private readonly notificacion = inject(NotificacionService);
  readonly seleccion = inject(SeleccionService);

  readonly columnasAsiento: Columna[] = [
    { key: 'numero', label: 'N.º' },
    { key: 'fecha', label: 'Fecha' },
    { key: 'tipo_asiento', label: 'Tipo' },
    { key: 'descripcion', label: 'Descripción' },
    { key: 'estado', label: 'Estado' },
    { key: 'total_debe', label: 'Debe' },
    { key: 'total_haber', label: 'Haber' },
    { key: 'cuadra', label: 'Cuadra' },
  ];
  readonly columnasMovimiento: Columna[] = [
    { key: 'codigo_cuenta', label: 'Código' },
    { key: 'nombre_cuenta', label: 'Cuenta' },
    { key: 'debe', label: 'Debe' },
    { key: 'haber', label: 'Haber' },
  ];

  readonly modo = linkedSignal<string, Modo>({ source: this.seleccion.periodoId, computation: () => 'consulta' });
  readonly procesando = signal(false);
  readonly periodos = this.service.periodos(this.seleccion.empresaId);
  readonly periodo = computed(() =>
    this.periodos.hasValue() ? this.periodos.value().find((p) => String(p.id_periodo) === this.seleccion.periodoId()) : undefined,
  );
  readonly periodoAbierto = computed(() => this.periodo()?.estado === 'ABIERTO');

  readonly asientos = this.service.asientos(this.seleccion.periodoId);
  readonly filas = computed(() =>
    this.asientos.hasValue() ? this.asientos.value().map((a) => ({ ...a, cuadra: a.total_debe === a.total_haber })) : [],
  );
  readonly siguienteNumero = computed(() => this.filas().reduce((m, a) => Math.max(m, a.numero), 0) + 1);
  readonly fechaSugerida = computed(() => {
    const p = this.periodo();
    const hoy = new Date().toISOString().slice(0, 10);
    return p && hoy >= p.fecha_inicio && hoy <= p.fecha_fin ? hoy : (p?.fecha_inicio ?? hoy);
  });

  readonly seleccionado = linkedSignal<string, Asiento | null>({ source: this.seleccion.periodoId, computation: () => null });
  readonly detalle = this.service.asiento(() => String(this.seleccionado()?.id_asiento ?? ''));
  readonly movimientos = computed(() => (this.detalle.hasValue() ? this.detalle.value().movimientos : []));
  readonly totales = computed(() => {
    const movs = this.movimientos();
    return ['', 'Totales', movs.reduce((s, m) => s + m.debe, 0), movs.reduce((s, m) => s + m.haber, 0)];
  });

  async contabilizar(a: Asiento) {
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
