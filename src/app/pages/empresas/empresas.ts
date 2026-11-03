import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Columna, DataTable } from '../../components/organisms/data-table/data-table';
import { AvisoApi } from '../../components/molecules/aviso-api/aviso-api';
import { ContabilidadService } from '../../core/services/contabilidad.service';
import { NotificacionService } from '../../core/services/notificacion.service';
import { SeleccionService } from '../../core/services/seleccion.service';
import { aplanarCuentas } from '../../core/utils/arbol';
import { mensajeError } from '../../core/utils/errores';

@Component({
  selector: 'app-empresas',
  imports: [DataTable, AvisoApi, FormsModule],
  template: `
    <h2>Empresas y periodos</h2>
    <div class="dos-columnas">
      <section class="panel">
        <h3>Empresas <span class="contador">{{ filasEmpresa().length }}</span></h3>
        <form class="form-grid" (ngSubmit)="crearEmpresa()">
          <label>NIT <input [(ngModel)]="empresa.nit" name="nit" maxlength="20" placeholder="900123456-7" /></label>
          <label class="ancho">Razón social <input [(ngModel)]="empresa.razon_social" name="razon" maxlength="200" /></label>
          <label>
            Moneda
            <select [(ngModel)]="empresa.id_moneda" name="moneda">
              <option value="">Seleccione...</option>
              @for (m of monedas.value(); track m.id_moneda) {
                <option [value]="m.id_moneda">{{ m.codigo }} · {{ m.nombre }}</option>
              }
            </select>
          </label>
          <button type="submit" class="btn-primario" [disabled]="guardando()">Agregar empresa</button>
        </form>
        <app-aviso-api [error]="empresas.error()" />
        <app-data-table [columns]="columnasEmpresa" [rows]="filasEmpresa()" />
      </section>

      <section class="panel">
        @if (seleccion.empresaId()) {
          <h3>Periodos de la empresa seleccionada</h3>
          <form class="form-grid" (ngSubmit)="crearPeriodo()">
            <label>Inicio <input type="date" [(ngModel)]="periodo.fecha_inicio" name="inicio" /></label>
            <label>Fin <input type="date" [(ngModel)]="periodo.fecha_fin" name="fin" /></label>
            <button type="submit" class="btn-primario" [disabled]="guardando()">Abrir periodo</button>
          </form>
          <app-aviso-api [error]="periodos.error()" />
          <app-data-table [columns]="columnasPeriodo" [rows]="periodos.hasValue() ? periodos.value() : []" />

          <h3>Cerrar un periodo</h3>
          <p class="aviso">El cierre traslada la utilidad o pérdida a la cuenta de patrimonio elegida y bloquea el periodo. No se puede deshacer.</p>
          <form class="form-grid" (ngSubmit)="cerrarPeriodo()">
            <label>
              Periodo abierto
              <select [(ngModel)]="cierre.id_periodo" name="periodoCierre">
                <option value="">Seleccione...</option>
                @for (p of periodosAbiertos(); track p.id_periodo) {
                  <option [value]="p.id_periodo">{{ p.fecha_inicio }} – {{ p.fecha_fin }}</option>
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
            <button type="submit" class="btn-peligro" [disabled]="guardando()">Cerrar periodo</button>
          </form>
        } @else {
          <p class="aviso">Seleccione una empresa arriba para ver y abrir sus periodos.</p>
        }
      </section>
    </div>
  `,
})
export class Empresas {
  private readonly service = inject(ContabilidadService);
  private readonly notificacion = inject(NotificacionService);
  readonly seleccion = inject(SeleccionService);

  readonly empresas = this.service.empresas();
  readonly monedas = this.service.monedas();
  readonly periodos = this.service.periodos(this.seleccion.empresaId);
  readonly cuentas = this.service.cuentas(this.seleccion.empresaId);
  readonly guardando = signal(false);

  readonly filasEmpresa = computed(() => (this.empresas.hasValue() ? this.empresas.value() : []));
  readonly periodosAbiertos = computed(() => (this.periodos.hasValue() ? this.periodos.value().filter((p) => p.estado === 'ABIERTO') : []));
  readonly cuentasPatrimonio = computed(() =>
    this.cuentas.hasValue()
      ? aplanarCuentas(this.cuentas.value()).filter((c) => c.acepta_movimiento && c.clase_cuenta === 'PATRIMONIO')
      : [],
  );

  readonly columnasEmpresa: Columna[] = [
    { key: 'nit', label: 'NIT' },
    { key: 'razon_social', label: 'Razón social' },
    { key: 'codigo_moneda', label: 'Moneda' },
  ];
  readonly columnasPeriodo: Columna[] = [
    { key: 'fecha_inicio', label: 'Inicio' },
    { key: 'fecha_fin', label: 'Fin' },
    { key: 'estado', label: 'Estado' },
  ];

  empresa = { nit: '', razon_social: '', id_moneda: '' };
  periodo = { fecha_inicio: '', fecha_fin: '' };
  cierre = { id_periodo: '', id_cuenta: '' };

  async crearEmpresa() {
    if (this.empresa.nit.trim().length < 5 || this.empresa.razon_social.trim().length < 2 || !this.empresa.id_moneda) {
      this.notificacion.error('Complete el NIT (mínimo 5 caracteres), la razón social y la moneda.');
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
    });
  }

  async crearPeriodo() {
    const { fecha_inicio, fecha_fin } = this.periodo;
    if (!fecha_inicio || !fecha_fin || fecha_fin <= fecha_inicio) {
      this.notificacion.error('Indique las fechas: el fin debe ser posterior al inicio.');
      return;
    }
    await this.ejecutar(async () => {
      await this.service.crearPeriodo(Number(this.seleccion.empresaId()), { fecha_inicio, fecha_fin });
      this.notificacion.ok(`Periodo ${fecha_inicio} – ${fecha_fin} abierto.`);
      this.periodo = { fecha_inicio: '', fecha_fin: '' };
    });
  }

  async cerrarPeriodo() {
    if (!this.cierre.id_periodo || !this.cierre.id_cuenta) {
      this.notificacion.error('Seleccione el periodo y la cuenta de patrimonio.');
      return;
    }
    if (!confirm('¿Cerrar el periodo? Después no se podrán registrar ni editar asientos en él.')) return;
    await this.ejecutar(async () => {
      await this.service.cerrarPeriodo(Number(this.cierre.id_periodo), Number(this.cierre.id_cuenta));
      this.notificacion.ok('Periodo cerrado y utilidad trasladada al patrimonio.');
      this.cierre = { id_periodo: '', id_cuenta: '' };
    });
  }

  private async ejecutar(accion: () => Promise<void>) {
    this.guardando.set(true);
    try {
      await accion();
    } catch (e) {
      this.notificacion.error(mensajeError(e));
    } finally {
      this.guardando.set(false);
    }
  }
}
