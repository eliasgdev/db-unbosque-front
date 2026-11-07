import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Modal } from '../../components/organisms/modal/modal';
import { AvisoApi } from '../../components/molecules/aviso-api/aviso-api';
import { Encabezado } from '../../components/molecules/encabezado/encabezado';
import { EstadoVacio } from '../../components/molecules/estado-vacio/estado-vacio';
import { Icono } from '../../components/atoms/icono/icono';
import { Periodo } from '../../core/models/contabilidad';
import { ContabilidadService } from '../../core/services/contabilidad.service';
import { NotificacionService } from '../../core/services/notificacion.service';
import { SeleccionService } from '../../core/services/seleccion.service';
import { aplanarCuentas } from '../../core/utils/arbol';
import { mensajeError } from '../../core/utils/errores';
import { FechaPipe, MontoPipe } from '../../shared/pipes/formato.pipes';

type Dialogo = '' | 'empresa' | 'periodo' | 'cierre';

@Component({
  selector: 'app-empresas',
  imports: [Modal, AvisoApi, Encabezado, EstadoVacio, Icono, FormsModule, FechaPipe, MontoPipe],
  template: `
    <app-encabezado
      titulo="Empresas y periodos"
      subtitulo="Empresas registradas, su moneda base y sus periodos contables."
    >
      <button type="button" class="btn btn-primario" (click)="dialogo.set('empresa')">
        <app-icono nombre="mas" [tam]="16" /> Nueva empresa
      </button>
    </app-encabezado>

    <app-aviso-api [error]="seleccion.empresas.error()" />
    <section class="rejilla-empresas">
      @for (e of seleccion.listaEmpresas(); track e.id_empresa) {
        <button
          type="button"
          class="empresa"
          [class.activa]="String(e.id_empresa) === seleccion.empresaId()"
          (click)="seleccion.empresaId.set(String(e.id_empresa))"
        >
          <span class="empresa-inicial">{{ e.razon_social.charAt(0) }}</span>
          <span class="empresa-datos">
            <strong>{{ e.razon_social }}</strong>
            <small>NIT {{ e.nit }}</small>
          </span>
          <span class="etiqueta etiqueta-neutro">{{ e.codigo_moneda }}</span>
        </button>
      } @empty {
        @if (seleccion.empresas.isLoading()) {
          @for (i of [1, 2, 3]; track i) {
            <div class="empresa"><span class="esqueleto"></span></div>
          }
        }
      }
    </section>

    @if (seleccion.empresa(); as e) {
      <section class="tarjeta tarjeta-tabla">
        <header class="tarjeta-cabecera">
          <div>
            <h2>Periodos contables</h2>
            <p class="texto-suave">{{ e.razon_social }}</p>
          </div>
          <div class="acciones">
            @if (abiertos().length) {
              <button type="button" class="btn btn-peligro-suave" (click)="abrirCierre()">
                <app-icono nombre="candado" [tam]="16" /> Cerrar periodo
              </button>
            }
            <button type="button" class="btn btn-secundario" (click)="dialogo.set('periodo')">
              <app-icono nombre="calendario" [tam]="16" /> Abrir periodo
            </button>
          </div>
        </header>
        <app-aviso-api [error]="seleccion.periodos.error() ?? cierres.error()" />
        <div class="tabla-contenedor">
          <table class="tabla">
            <thead>
              <tr>
                <th>Periodo</th>
                <th>Estado</th>
                <th>Fecha de cierre</th>
                <th class="num">Resultado trasladado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (p of periodosOrdenados(); track p.id_periodo) {
                @let c = cierrePorPeriodo().get(p.id_periodo);
                <tr [class.selected]="String(p.id_periodo) === seleccion.periodoId()">
                  <td>
                    <strong>{{ p.fecha_inicio | fecha }} – {{ p.fecha_fin | fecha }}</strong>
                  </td>
                  <td>
                    <span
                      class="etiqueta"
                      [class]="
                        p.estado === 'ABIERTO' ? 'etiqueta etiqueta-ok' : 'etiqueta etiqueta-neutro'
                      "
                    >
                      {{ p.estado === 'ABIERTO' ? 'Abierto' : 'Cerrado' }}
                    </span>
                  </td>
                  <td>{{ c ? (c.fecha_cierre | fecha) : '—' }}</td>
                  <td class="num" [class.negativo]="c && c.utilidad_neta < 0">
                    {{ c ? (c.utilidad_neta | monto: e.codigo_moneda) : '—' }}
                  </td>
                  <td class="num">
                    @if (String(p.id_periodo) === seleccion.periodoId()) {
                      <span class="texto-suave texto-pequeno">En uso</span>
                    } @else {
                      <button
                        type="button"
                        class="btn btn-fantasma btn-pequeno"
                        (click)="seleccion.periodoId.set(String(p.id_periodo))"
                      >
                        Usar
                      </button>
                    }
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td class="vacio" colspan="5">
                    {{
                      seleccion.periodos.isLoading()
                        ? 'Cargando...'
                        : 'La empresa no tiene periodos. Abra el primero.'
                    }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    } @else if (!seleccion.empresas.isLoading() && !seleccion.listaEmpresas().length) {
      <app-estado-vacio
        titulo="Aún no hay empresas"
        texto="Registre la primera empresa para empezar a llevar su contabilidad."
        icono="empresas"
      />
    }

    @switch (dialogo()) {
      @case ('empresa') {
        <app-modal
          titulo="Nueva empresa"
          subtitulo="La moneda base define cómo se presentan los montos de sus reportes."
          (cerrar)="dialogo.set('')"
        >
          <form class="form-grid" (ngSubmit)="crearEmpresa()">
            <label
              >NIT
              <input [(ngModel)]="empresa.nit" name="nit" maxlength="20" placeholder="900123456-7"
            /></label>
            <label>
              Moneda base
              <select [(ngModel)]="empresa.id_moneda" name="moneda">
                <option value="">Seleccione...</option>
                @for (m of monedas.value(); track m.id_moneda) {
                  <option [value]="m.id_moneda">{{ m.codigo }} · {{ m.nombre }}</option>
                }
              </select>
            </label>
            <label class="ancho"
              >Razón social <input [(ngModel)]="empresa.razon_social" name="razon" maxlength="200"
            /></label>
            <div class="acciones acciones-modal ancho">
              <button type="button" class="btn btn-secundario" (click)="dialogo.set('')">
                Cancelar
              </button>
              <button type="submit" class="btn btn-primario" [disabled]="guardando()">
                Registrar empresa
              </button>
            </div>
          </form>
        </app-modal>
      }
      @case ('periodo') {
        <app-modal
          titulo="Abrir periodo"
          [subtitulo]="seleccion.empresa()?.razon_social ?? ''"
          (cerrar)="dialogo.set('')"
        >
          <form class="form-grid" (ngSubmit)="crearPeriodo()">
            <label
              >Inicio <input type="date" [(ngModel)]="periodo.fecha_inicio" name="inicio"
            /></label>
            <label>Fin <input type="date" [(ngModel)]="periodo.fecha_fin" name="fin" /></label>
            <div class="acciones acciones-modal ancho">
              <button type="button" class="btn btn-secundario" (click)="dialogo.set('')">
                Cancelar
              </button>
              <button type="submit" class="btn btn-primario" [disabled]="guardando()">
                Abrir periodo
              </button>
            </div>
          </form>
        </app-modal>
      }
      @case ('cierre') {
        <app-modal
          titulo="Cerrar periodo"
          [subtitulo]="seleccion.empresa()?.razon_social ?? ''"
          (cerrar)="dialogo.set('')"
        >
          <p class="alerta alerta-aviso">
            <app-icono nombre="alerta" [tam]="16" />
            El cierre traslada la utilidad o pérdida a la cuenta de patrimonio elegida y bloquea el
            periodo. No se puede deshacer.
          </p>
          <form class="form-grid" (ngSubmit)="cerrarPeriodo()">
            <label class="ancho">
              Periodo abierto
              <select [(ngModel)]="cierre.id_periodo" name="periodoCierre">
                <option value="">Seleccione...</option>
                @for (p of abiertos(); track p.id_periodo) {
                  <option [value]="p.id_periodo">
                    {{ p.fecha_inicio | fecha }} – {{ p.fecha_fin | fecha }}
                  </option>
                }
              </select>
            </label>
            <label class="ancho">
              Cuenta de patrimonio
              <select [(ngModel)]="cierre.id_cuenta" name="cuentaCierre">
                <option value="">Seleccione...</option>
                @for (c of cuentasPatrimonio(); track c.id_cuenta) {
                  <option [value]="c.id_cuenta">{{ c.codigo }} · {{ c.nombre }}</option>
                }
              </select>
            </label>
            <div class="acciones acciones-modal ancho">
              <button type="button" class="btn btn-secundario" (click)="dialogo.set('')">
                Cancelar
              </button>
              <button type="submit" class="btn btn-peligro" [disabled]="guardando()">
                Cerrar periodo
              </button>
            </div>
          </form>
        </app-modal>
      }
    }
  `,
})
export class Empresas {
  private readonly service = inject(ContabilidadService);
  private readonly notificacion = inject(NotificacionService);
  readonly seleccion = inject(SeleccionService);
  protected readonly String = String;

  readonly monedas = this.service.monedas();
  readonly cuentas = this.service.cuentas(this.seleccion.empresaId);
  readonly guardando = signal(false);
  readonly dialogo = signal<Dialogo>('');

  readonly periodosOrdenados = computed(() =>
    [...this.seleccion.listaPeriodos()].sort((a, b) =>
      b.fecha_inicio.localeCompare(a.fecha_inicio),
    ),
  );
  readonly abiertos = computed(() =>
    this.seleccion.listaPeriodos().filter((p) => p.estado === 'ABIERTO'),
  );
  readonly cierres = this.service.cierres(() =>
    this.seleccion
      .listaPeriodos()
      .filter((p) => p.estado === 'CERRADO')
      .map((p) => p.id_periodo),
  );
  readonly cierrePorPeriodo = computed(
    () => new Map(this.cierres.value().map((c) => [c.id_periodo, c])),
  );
  readonly cuentasPatrimonio = computed(() =>
    this.cuentas.hasValue()
      ? aplanarCuentas(this.cuentas.value()).filter(
          (c) => c.acepta_movimiento && c.clase_cuenta === 'PATRIMONIO',
        )
      : [],
  );

  empresa = { nit: '', razon_social: '', id_moneda: '' };
  periodo = { fecha_inicio: '', fecha_fin: '' };
  cierre = { id_periodo: '', id_cuenta: '' };

  abrirCierre() {
    const actual: Periodo | undefined = this.abiertos().find(
      (p) => String(p.id_periodo) === this.seleccion.periodoId(),
    );
    this.cierre = { id_periodo: actual ? String(actual.id_periodo) : '', id_cuenta: '' };
    this.dialogo.set('cierre');
  }

  async crearEmpresa() {
    if (
      this.empresa.nit.trim().length < 5 ||
      this.empresa.razon_social.trim().length < 2 ||
      !this.empresa.id_moneda
    ) {
      this.notificacion.error(
        'Complete el NIT (mínimo 5 caracteres), la razón social y la moneda.',
      );
      return;
    }
    await this.ejecutar(async () => {
      const creada = await this.service.crearEmpresa({
        nit: this.empresa.nit.trim(),
        razon_social: this.empresa.razon_social.trim(),
        id_moneda: Number(this.empresa.id_moneda),
      });
      this.notificacion.ok(`Empresa "${creada.razon_social}" registrada.`);
      this.empresa = { nit: '', razon_social: '', id_moneda: '' };
      this.seleccion.empresaId.set(String(creada.id_empresa));
    });
  }

  async crearPeriodo() {
    const { fecha_inicio, fecha_fin } = this.periodo;
    if (!fecha_inicio || !fecha_fin || fecha_fin <= fecha_inicio) {
      this.notificacion.error('Indique las fechas: el fin debe ser posterior al inicio.');
      return;
    }
    await this.ejecutar(async () => {
      const creado = await this.service.crearPeriodo(Number(this.seleccion.empresaId()), {
        fecha_inicio,
        fecha_fin,
      });
      this.notificacion.ok('Periodo abierto.');
      this.periodo = { fecha_inicio: '', fecha_fin: '' };
      this.seleccion.periodoId.set(String(creado.id_periodo));
    });
  }

  async cerrarPeriodo() {
    if (!this.cierre.id_periodo || !this.cierre.id_cuenta) {
      this.notificacion.error('Seleccione el periodo y la cuenta de patrimonio.');
      return;
    }
    if (!confirm('¿Cerrar el periodo? Después no se podrán registrar ni editar asientos en él.'))
      return;
    await this.ejecutar(async () => {
      await this.service.cerrarPeriodo(
        Number(this.cierre.id_periodo),
        Number(this.cierre.id_cuenta),
      );
      this.notificacion.ok('Periodo cerrado y resultado trasladado al patrimonio.');
      this.cierre = { id_periodo: '', id_cuenta: '' };
    });
  }

  private async ejecutar(accion: () => Promise<void>) {
    this.guardando.set(true);
    try {
      await accion();
      this.dialogo.set('');
    } catch (e) {
      this.notificacion.error(mensajeError(e));
    } finally {
      this.guardando.set(false);
    }
  }
}
