import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Modal } from '../../components/organisms/modal/modal';
import { AvisoApi } from '../../components/molecules/aviso-api/aviso-api';
import { Encabezado } from '../../components/molecules/encabezado/encabezado';
import { EstadoVacio } from '../../components/molecules/estado-vacio/estado-vacio';
import { Buscador } from '../../components/molecules/buscador/buscador';
import { Icono } from '../../components/atoms/icono/icono';
import { ContabilidadService } from '../../core/services/contabilidad.service';
import { NotificacionService } from '../../core/services/notificacion.service';
import { SeleccionService } from '../../core/services/seleccion.service';
import { aplanarCuentas } from '../../core/utils/arbol';
import { mensajeError } from '../../core/utils/errores';
import { tono } from '../../core/utils/formato';
import { EtiquetaPipe } from '../../shared/pipes/formato.pipes';

@Component({
  selector: 'app-plan-cuentas',
  imports: [Modal, AvisoApi, Encabezado, EstadoVacio, Buscador, Icono, EtiquetaPipe, FormsModule],
  template: `
    <app-encabezado
      titulo="Plan de cuentas"
      subtitulo="Catálogo jerárquico de cuentas de la empresa, con su clase, naturaleza y rubro."
    >
      @if (seleccion.empresaId()) {
        <button type="button" class="btn btn-primario" (click)="abrirFormulario()">
          <app-icono nombre="mas" [tam]="16" /> Nueva cuenta
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
      <section class="tarjeta tarjeta-tabla">
        <div class="barra-herramientas">
          <div class="segmentos" role="tablist">
            <button type="button" [class.activo]="!clase()" (click)="clase.set('')">Todas</button>
            @for (c of clases(); track c) {
              <button type="button" [class.activo]="clase() === c" (click)="clase.set(c)">
                {{ c | etiqueta }}
              </button>
            }
          </div>
          <div class="herramientas-derecha">
            <label class="interruptor">
              <input
                type="checkbox"
                [checked]="soloMovimiento()"
                (change)="soloMovimiento.set($any($event.target).checked)"
              />
              Solo cuentas de movimiento
            </label>
            <app-buscador [(term)]="term" placeholder="Buscar código o nombre" />
          </div>
        </div>
        <app-aviso-api [error]="cuentas.error() ?? tiposCuenta.error()" />

        <div class="tabla-contenedor">
          <table class="tabla tabla-arbol">
            <thead>
              <tr>
                <th style="width: 130px">Código</th>
                <th>Cuenta</th>
                <th style="width: 120px">Clase</th>
                <th style="width: 110px">Naturaleza</th>
                <th style="width: 130px">Uso</th>
              </tr>
            </thead>
            <tbody>
              @for (c of visibles(); track c.id_cuenta) {
                <tr [class.fila-fuerte]="c.nivel === 1">
                  <td class="codigo">{{ c.codigo }}</td>
                  <td [style.padding-left.px]="filtrando() ? 16 : 16 + 22 * (c.nivel - 1)">
                    <span class="nodo">
                      @if (!filtrando() && tieneHijos().has(c.id_cuenta)) {
                        <button
                          type="button"
                          class="btn-nodo"
                          (click)="alternar(c.id_cuenta)"
                          [attr.aria-expanded]="!plegadas().has(c.id_cuenta)"
                          [attr.aria-label]="'Plegar ' + c.nombre"
                        >
                          <app-icono
                            [nombre]="plegadas().has(c.id_cuenta) ? 'derecha' : 'abajo'"
                            [tam]="14"
                          />
                        </button>
                      } @else {
                        <span class="nodo-hoja"></span>
                      }
                      {{ c.nombre }}
                    </span>
                  </td>
                  <td>
                    <span class="etiqueta" [class]="'etiqueta etiqueta-' + tono(c.clase_cuenta)">{{
                      c.clase_cuenta | etiqueta
                    }}</span>
                  </td>
                  <td>{{ c.naturaleza | etiqueta }}</td>
                  <td>
                    @if (c.acepta_movimiento) {
                      <span class="texto-ok">Movimiento</span>
                    } @else {
                      <span class="texto-suave">Agrupadora</span>
                    }
                  </td>
                </tr>
              } @empty {
                @if (cuentas.isLoading()) {
                  @for (i of [1, 2, 3, 4, 5]; track i) {
                    <tr class="fila-cargando">
                      @for (j of [1, 2, 3, 4, 5]; track j) {
                        <td><span class="esqueleto"></span></td>
                      }
                    </tr>
                  }
                } @else {
                  <tr>
                    <td class="vacio" colspan="5">No hay cuentas que coincidan con el filtro.</td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
        <p class="pie-tabla">{{ visibles().length }} de {{ todas().length }} cuentas</p>
      </section>
    }

    @if (formulario()) {
      <app-modal
        titulo="Nueva cuenta"
        subtitulo="Al elegir la cuenta padre se sugieren su tipo, su rubro y el inicio del código."
        (cerrar)="formulario.set(false)"
      >
        <form class="form-grid" (ngSubmit)="crear()">
          <label class="ancho">
            Cuenta padre
            <select
              [(ngModel)]="nueva.id_cuenta_padre"
              name="padre"
              (ngModelChange)="alElegirPadre($event)"
            >
              <option value="">Ninguna (cuenta de nivel 1)</option>
              @for (c of cuentasPadre(); track c.id_cuenta) {
                <option [value]="c.id_cuenta">{{ c.codigo }} · {{ c.nombre }}</option>
              }
            </select>
          </label>
          <label
            >Código <input [(ngModel)]="nueva.codigo" name="codigo" maxlength="20" required
          /></label>
          <label class="ancho"
            >Nombre <input [(ngModel)]="nueva.nombre" name="nombre" maxlength="150" required
          /></label>
          <label>
            Tipo de cuenta
            <select [(ngModel)]="nueva.id_tipo_cuenta" name="tipo">
              <option value="">Seleccione...</option>
              @for (t of tiposCuenta.value(); track t.id_tipo_cuenta) {
                <option [value]="t.id_tipo_cuenta">
                  {{ t.clase | etiqueta }} ({{ t.naturaleza | etiqueta }})
                </option>
              }
            </select>
          </label>
          <label class="ancho">
            Rubro del estado financiero
            <select [(ngModel)]="nueva.id_rubro" name="rubro">
              <option value="">Seleccione...</option>
              @for (r of rubros.value(); track r.id_rubro) {
                <option [value]="r.id_rubro">
                  {{ r.estado_financiero === 'BALANCE' ? 'Balance' : 'Resultados' }} ·
                  {{ r.nombre }}
                </option>
              }
            </select>
          </label>
          <label class="check ancho"
            ><input type="checkbox" [(ngModel)]="nueva.acepta_movimiento" name="acepta" /> Acepta
            movimientos (cuenta hoja)</label
          >
          <div class="acciones acciones-modal ancho">
            <button type="button" class="btn btn-secundario" (click)="formulario.set(false)">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primario" [disabled]="guardando()">
              {{ guardando() ? 'Guardando...' : 'Guardar cuenta' }}
            </button>
          </div>
        </form>
      </app-modal>
    }
  `,
})
export class PlanCuentas {
  private readonly service = inject(ContabilidadService);
  private readonly notificacion = inject(NotificacionService);
  readonly seleccion = inject(SeleccionService);
  readonly cuentas = this.service.cuentas(this.seleccion.empresaId);
  readonly tiposCuenta = this.service.tiposCuenta();
  readonly rubros = this.service.rubros();
  readonly formulario = signal(false);
  readonly guardando = signal(false);
  protected readonly tono = tono;

  readonly term = signal('');
  readonly clase = signal('');
  readonly soloMovimiento = signal(false);
  readonly plegadas = signal(new Set<number>());

  readonly clases = computed(() => [
    ...new Set((this.tiposCuenta.hasValue() ? this.tiposCuenta.value() : []).map((t) => t.clase)),
  ]);
  readonly todas = computed(() =>
    this.cuentas.hasValue() ? aplanarCuentas(this.cuentas.value()) : [],
  );
  readonly tieneHijos = computed(
    () =>
      new Set(
        this.todas()
          .map((c) => c.id_cuenta_padre)
          .filter((id): id is number => id !== null),
      ),
  );
  /** Solo una cuenta que no acepta movimientos puede tener subcuentas. */
  readonly cuentasPadre = computed(() => this.todas().filter((c) => !c.acepta_movimiento));
  readonly filtrando = computed(() => !!this.term().trim() || this.soloMovimiento());

  readonly visibles = computed(() => {
    const t = this.term().trim().toLowerCase();
    const clase = this.clase();
    const filtradas = this.todas().filter(
      (c) =>
        (!clase || c.clase_cuenta === clase) &&
        (!this.soloMovimiento() || c.acepta_movimiento) &&
        (!t || `${c.codigo} ${c.nombre}`.toLowerCase().includes(t)),
    );
    if (this.filtrando()) return filtradas;
    // Sin búsqueda se respeta la jerarquía: se ocultan las subcuentas de las ramas plegadas.
    const plegadas = this.plegadas();
    const padres = new Map(this.todas().map((c) => [c.id_cuenta, c.id_cuenta_padre]));
    const oculta = (id: number | null): boolean =>
      id !== null && (plegadas.has(id) || oculta(padres.get(id) ?? null));
    return filtradas.filter((c) => !oculta(c.id_cuenta_padre));
  });

  nueva = {
    id_cuenta_padre: '',
    codigo: '',
    nombre: '',
    id_tipo_cuenta: '',
    id_rubro: '',
    acepta_movimiento: true,
  };

  alternar(id: number) {
    this.plegadas.update((s) => {
      const nuevo = new Set(s);
      if (!nuevo.delete(id)) nuevo.add(id);
      return nuevo;
    });
  }

  abrirFormulario() {
    this.nueva = {
      id_cuenta_padre: '',
      codigo: '',
      nombre: '',
      id_tipo_cuenta: '',
      id_rubro: '',
      acepta_movimiento: true,
    };
    this.formulario.set(true);
  }

  /** Al elegir el padre se sugieren su tipo, su rubro y el inicio del código. */
  alElegirPadre(id: string) {
    const padre = this.todas().find((c) => String(c.id_cuenta) === id);
    if (!padre) return;
    this.nueva.id_tipo_cuenta = String(padre.id_tipo_cuenta);
    this.nueva.id_rubro = String(padre.id_rubro);
    if (!this.nueva.codigo) this.nueva.codigo = padre.codigo;
  }

  async crear() {
    const n = this.nueva;
    if (!n.codigo.trim() || n.nombre.trim().length < 2 || !n.id_tipo_cuenta || !n.id_rubro) {
      this.notificacion.error('Complete el código, el nombre, el tipo de cuenta y el rubro.');
      return;
    }
    const padre = this.todas().find((c) => String(c.id_cuenta) === n.id_cuenta_padre);
    this.guardando.set(true);
    try {
      await this.service.crearCuenta(Number(this.seleccion.empresaId()), {
        id_cuenta_padre: padre ? padre.id_cuenta : null,
        id_tipo_cuenta: Number(n.id_tipo_cuenta),
        id_rubro: Number(n.id_rubro),
        codigo: n.codigo.trim(),
        nombre: n.nombre.trim(),
        nivel: padre ? padre.nivel + 1 : 1,
        acepta_movimiento: n.acepta_movimiento,
      });
      this.notificacion.ok(`Cuenta ${n.codigo.trim()} · ${n.nombre.trim()} creada.`);
      this.formulario.set(false);
    } catch (e) {
      this.notificacion.error(mensajeError(e));
    } finally {
      this.guardando.set(false);
    }
  }
}
