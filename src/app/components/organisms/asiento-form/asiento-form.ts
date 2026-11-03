import { Component, OnInit, computed, effect, inject, input, output, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AsientoDetalle, AsientoEntrada } from '../../../core/models/contabilidad';
import { ContabilidadService } from '../../../core/services/contabilidad.service';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { aplanarCuentas } from '../../../core/utils/arbol';
import { mensajeError } from '../../../core/utils/errores';

interface Linea {
  id_cuenta: string;
  id_tercero: string;
  id_centro_costo: string;
  debe: number | null;
  haber: number | null;
}

const lineaVacia = (): Linea => ({ id_cuenta: '', id_tercero: '', id_centro_costo: '', debe: null, haber: null });

/** Formulario para registrar un asiento nuevo o editar uno en BORRADOR. */
@Component({
  selector: 'app-asiento-form',
  imports: [FormsModule, DecimalPipe],
  template: `
    <section class="panel">
      <h3>{{ asiento() ? 'Editar asiento N.º ' + asiento()!.numero : 'Nuevo asiento' }}</h3>
      <div class="form-grid">
        <label>
          Tipo
          <select [(ngModel)]="idTipo" name="tipo">
            @for (t of tiposDisponibles(); track t.id_tipo_asiento) {
              <option [value]="t.id_tipo_asiento">{{ t.nombre }}</option>
            }
          </select>
        </label>
        @if (!asiento()) {
          <label>N.º <input type="number" min="1" [(ngModel)]="numero" name="numero" /></label>
        }
        <label>Fecha <input type="date" [(ngModel)]="fecha" name="fecha" /></label>
        <label class="ancho">Descripción <input type="text" maxlength="300" [(ngModel)]="descripcion" name="descripcion" /></label>
      </div>

      <div class="table-scroll">
        <table class="tabla-lineas">
          <thead>
            <tr>
              <th>Cuenta</th>
              <th>Tercero</th>
              <th>Centro de costo</th>
              <th class="num">Debe</th>
              <th class="num">Haber</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (l of lineas(); track $index; let i = $index) {
              <tr>
                <td>
                  <select [(ngModel)]="l.id_cuenta" [name]="'cuenta' + i">
                    <option value="">Seleccione...</option>
                    @for (c of cuentasHoja(); track c.id_cuenta) {
                      <option [value]="c.id_cuenta">{{ c.codigo }} · {{ c.nombre }}</option>
                    }
                  </select>
                </td>
                <td>
                  <select [(ngModel)]="l.id_tercero" [name]="'tercero' + i">
                    <option value="">—</option>
                    @for (t of terceros.value(); track t.id_tercero) {
                      <option [value]="t.id_tercero">{{ t.nombre }}</option>
                    }
                  </select>
                </td>
                <td>
                  <select [(ngModel)]="l.id_centro_costo" [name]="'centro' + i">
                    <option value="">—</option>
                    @for (c of centros.value(); track c.id_centro_costo) {
                      <option [value]="c.id_centro_costo">{{ c.nombre }}</option>
                    }
                  </select>
                </td>
                <td><input class="monto" type="number" min="0" step="0.01" [(ngModel)]="l.debe" [name]="'debe' + i" (ngModelChange)="l.haber = null" /></td>
                <td><input class="monto" type="number" min="0" step="0.01" [(ngModel)]="l.haber" [name]="'haber' + i" (ngModelChange)="l.debe = null" /></td>
                <td><button type="button" class="btn-icono" title="Quitar línea" (click)="quitar(i)" [disabled]="lineas().length <= 2">✕</button></td>
              </tr>
            }
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3"><button type="button" class="btn-secundario" (click)="agregar()">+ Agregar línea</button></td>
              <td class="num">{{ total('debe') | number: '1.0-2' }}</td>
              <td class="num">{{ total('haber') | number: '1.0-2' }}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p [class]="cuadra() ? 'ok' : 'aviso'">
        @if (cuadra()) {
          El asiento cuadra: débitos = créditos.
        } @else {
          Diferencia de {{ total('debe') - total('haber') | number: '1.0-2' }}. Puede guardarse como borrador, pero solo se contabiliza cuando cuadre.
        }
      </p>

      <div class="acciones">
        <button type="button" class="btn-secundario" (click)="cancelado.emit()" [disabled]="guardando()">Cancelar</button>
        <button type="button" class="btn-primario" (click)="guardar()" [disabled]="guardando()">
          {{ guardando() ? 'Guardando...' : 'Guardar borrador' }}
        </button>
      </div>
    </section>
  `,
})
export class AsientoForm implements OnInit {
  private readonly service = inject(ContabilidadService);
  private readonly notificacion = inject(NotificacionService);

  readonly idEmpresa = input.required<string>();
  readonly idPeriodo = input.required<string>();
  /** Asiento en borrador a editar; null para uno nuevo. */
  readonly asiento = input<AsientoDetalle | null>(null);
  readonly siguienteNumero = input(1);
  readonly fechaSugerida = input('');
  readonly guardado = output<void>();
  readonly cancelado = output<void>();

  readonly cuentas = this.service.cuentas(() => this.idEmpresa());
  readonly terceros = this.service.terceros(() => this.idEmpresa());
  readonly centros = this.service.centrosCosto(() => this.idEmpresa());
  readonly tipos = this.service.tiposAsiento();

  readonly cuentasHoja = computed(() =>
    this.cuentas.hasValue() ? aplanarCuentas(this.cuentas.value()).filter((c) => c.acepta_movimiento) : [],
  );
  /** El tipo CIERRE lo genera el cierre de periodo; no se registra a mano. */
  readonly tiposDisponibles = computed(() => (this.tipos.hasValue() ? this.tipos.value().filter((t) => t.nombre !== 'CIERRE') : []));

  readonly lineas = signal<Linea[]>([lineaVacia(), lineaVacia()]);

  /** Un asiento nuevo arranca como DIARIO, el tipo más común. */
  private readonly tipoPorDefecto = effect(() => {
    const diario = this.tiposDisponibles().find((t) => t.nombre === 'DIARIO');
    if (diario && !this.idTipo) this.idTipo = String(diario.id_tipo_asiento);
  });
  readonly guardando = signal(false);
  idTipo = '';
  numero = 1;
  fecha = '';
  descripcion = '';

  ngOnInit() {
    const a = this.asiento();
    if (a) {
      this.idTipo = String(a.id_tipo_asiento);
      this.fecha = a.fecha;
      this.descripcion = a.descripcion;
      this.lineas.set(
        a.movimientos.map((m) => ({
          id_cuenta: String(m.id_cuenta),
          id_tercero: m.id_tercero ? String(m.id_tercero) : '',
          id_centro_costo: m.id_centro_costo ? String(m.id_centro_costo) : '',
          debe: m.debe || null,
          haber: m.haber || null,
        })),
      );
    } else {
      this.numero = this.siguienteNumero();
      this.fecha = this.fechaSugerida();
    }
  }

  total(campo: 'debe' | 'haber') {
    return this.lineas().reduce((s, l) => s + (Number(l[campo]) || 0), 0);
  }

  cuadra() {
    const d = this.total('debe');
    return d > 0 && Math.abs(d - this.total('haber')) < 0.005;
  }

  agregar() {
    this.lineas.update((ls) => [...ls, lineaVacia()]);
  }

  quitar(i: number) {
    this.lineas.update((ls) => ls.filter((_, j) => j !== i));
  }

  async guardar() {
    const error = this.validar();
    if (error) {
      this.notificacion.error(error);
      return;
    }
    const datos: AsientoEntrada = {
      id_tipo_asiento: Number(this.idTipo || this.tiposDisponibles()[0]?.id_tipo_asiento),
      fecha: this.fecha,
      descripcion: this.descripcion.trim(),
      movimientos: this.lineas().map((l) => ({
        id_cuenta: Number(l.id_cuenta),
        id_tercero: l.id_tercero ? Number(l.id_tercero) : null,
        id_centro_costo: l.id_centro_costo ? Number(l.id_centro_costo) : null,
        debe: (Number(l.debe) || 0).toFixed(2),
        haber: (Number(l.haber) || 0).toFixed(2),
      })),
    };
    this.guardando.set(true);
    try {
      const a = this.asiento();
      if (a) {
        await this.service.actualizarAsiento(a.id_asiento, datos);
        this.notificacion.ok(`Asiento N.º ${a.numero} actualizado.`);
      } else {
        await this.service.crearAsiento(Number(this.idPeriodo()), { ...datos, numero: Number(this.numero) });
        this.notificacion.ok(`Asiento N.º ${this.numero} registrado como borrador.`);
      }
      this.guardado.emit();
    } catch (e) {
      this.notificacion.error(mensajeError(e));
    } finally {
      this.guardando.set(false);
    }
  }

  private validar(): string | null {
    if (!this.fecha) return 'Indique la fecha del asiento.';
    if (this.descripcion.trim().length < 3) return 'Escriba una descripción.';
    if (this.lineas().length < 2) return 'Un asiento necesita al menos dos líneas.';
    for (const [i, l] of this.lineas().entries()) {
      if (!l.id_cuenta) return `Seleccione la cuenta de la línea ${i + 1}.`;
      const d = Number(l.debe) || 0;
      const h = Number(l.haber) || 0;
      if (d < 0 || h < 0) return `La línea ${i + 1} tiene un valor negativo.`;
      if ((d > 0) === (h > 0)) return `La línea ${i + 1} debe tener un valor en el debe o en el haber, no en ambos.`;
    }
    return null;
  }
}
