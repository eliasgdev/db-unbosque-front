import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Columna, DataTable } from '../../components/organisms/data-table/data-table';
import { SearchField } from '../../components/molecules/search-field/search-field';
import { AvisoApi } from '../../components/molecules/aviso-api/aviso-api';
import { Select } from '../../components/atoms/select/select';
import { ContabilidadService } from '../../core/services/contabilidad.service';
import { NotificacionService } from '../../core/services/notificacion.service';
import { SeleccionService } from '../../core/services/seleccion.service';
import { aplanarCuentas } from '../../core/utils/arbol';
import { mensajeError } from '../../core/utils/errores';

@Component({
  selector: 'app-plan-cuentas',
  imports: [DataTable, SearchField, Select, AvisoApi, FormsModule],
  template: `
    <div class="titulo-pagina">
      <h2>Plan de cuentas</h2>
      @if (seleccion.empresaId() && !formulario()) {
        <button type="button" class="btn-primario" (click)="formulario.set(true)">+ Nueva cuenta</button>
      }
    </div>
    @if (seleccion.empresaId()) {
      @if (formulario()) {
        <section class="panel">
          <h3>Nueva cuenta</h3>
          <form class="form-grid" (ngSubmit)="crear()">
            <label class="ancho">
              Cuenta padre
              <select [(ngModel)]="nueva.id_cuenta_padre" name="padre" (ngModelChange)="alElegirPadre($event)">
                <option value="">Ninguna (cuenta de nivel 1)</option>
                @for (c of cuentasPadre(); track c.id_cuenta) {
                  <option [value]="c.id_cuenta">{{ c.codigo }} · {{ c.nombre }}</option>
                }
              </select>
            </label>
            <label>Código <input [(ngModel)]="nueva.codigo" name="codigo" maxlength="20" /></label>
            <label class="ancho">Nombre <input [(ngModel)]="nueva.nombre" name="nombre" maxlength="150" /></label>
            <label>
              Tipo de cuenta
              <select [(ngModel)]="nueva.id_tipo_cuenta" name="tipo">
                <option value="">Seleccione...</option>
                @for (t of tiposCuenta.value(); track t.id_tipo_cuenta) {
                  <option [value]="t.id_tipo_cuenta">{{ t.clase }} ({{ t.naturaleza }})</option>
                }
              </select>
            </label>
            <label class="ancho">
              Rubro del estado financiero
              <select [(ngModel)]="nueva.id_rubro" name="rubro">
                <option value="">Seleccione...</option>
                @for (r of rubros.value(); track r.id_rubro) {
                  <option [value]="r.id_rubro">{{ r.estado_financiero === 'BALANCE' ? 'Balance' : 'Resultados' }} · {{ r.nombre }}</option>
                }
              </select>
            </label>
            <label class="check"><input type="checkbox" [(ngModel)]="nueva.acepta_movimiento" name="acepta" /> Acepta movimientos (cuenta hoja)</label>
            <div class="acciones">
              <button type="button" class="btn-secundario" (click)="formulario.set(false)">Cancelar</button>
              <button type="submit" class="btn-primario" [disabled]="guardando()">Guardar cuenta</button>
            </div>
          </form>
        </section>
      }
      <div class="filtros">
        <app-search-field [(term)]="term" />
        <app-select label="Tipo de cuenta" [options]="tipos()" [(value)]="tipo" />
      </div>
      <app-aviso-api [error]="cuentas.error() ?? tiposCuenta.error()" />
      <app-data-table [columns]="columns" [rows]="filtradas()" />
    } @else {
      <p class="aviso">Seleccione una empresa.</p>
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

  readonly columns: Columna[] = [
    { key: 'codigo', label: 'Código' },
    { key: 'nombre', label: 'Cuenta', sangria: true },
    { key: 'nivel', label: 'Nivel' },
    { key: 'clase_cuenta', label: 'Clase' },
    { key: 'naturaleza', label: 'Naturaleza' },
    { key: 'acepta_movimiento', label: 'Acepta movimiento' },
  ];
  readonly term = signal('');
  readonly tipo = signal('');
  readonly tipos = computed(() =>
    this.tiposCuenta.hasValue()
      ? this.tiposCuenta.value().map((t) => ({ value: String(t.id_tipo_cuenta), label: `${t.clase} (${t.naturaleza})` }))
      : [],
  );
  readonly todas = computed(() => (this.cuentas.hasValue() ? aplanarCuentas(this.cuentas.value()) : []));
  /** Solo una cuenta que no acepta movimientos puede tener subcuentas. */
  readonly cuentasPadre = computed(() => this.todas().filter((c) => !c.acepta_movimiento));
  readonly filtradas = computed(() => {
    const t = this.term().toLowerCase();
    const tipo = this.tipo();
    return this.todas().filter((c) => (!tipo || String(c.id_tipo_cuenta) === tipo) && `${c.codigo} ${c.nombre}`.toLowerCase().includes(t));
  });

  nueva = { id_cuenta_padre: '', codigo: '', nombre: '', id_tipo_cuenta: '', id_rubro: '', acepta_movimiento: true };

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
      this.nueva = { id_cuenta_padre: '', codigo: '', nombre: '', id_tipo_cuenta: '', id_rubro: '', acepta_movimiento: true };
      this.formulario.set(false);
    } catch (e) {
      this.notificacion.error(mensajeError(e));
    } finally {
      this.guardando.set(false);
    }
  }
}
