import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Columna, DataTable } from '../../components/organisms/data-table/data-table';
import { AvisoApi } from '../../components/molecules/aviso-api/aviso-api';
import { TipoTercero } from '../../core/models/contabilidad';
import { ContabilidadService } from '../../core/services/contabilidad.service';
import { NotificacionService } from '../../core/services/notificacion.service';
import { SeleccionService } from '../../core/services/seleccion.service';
import { mensajeError } from '../../core/utils/errores';

@Component({
  selector: 'app-terceros',
  imports: [DataTable, AvisoApi, FormsModule],
  template: `
    <h2>Terceros y centros de costo</h2>
    @if (seleccion.empresaId()) {
      <div class="dos-columnas">
        <section class="panel">
          <h3>Terceros <span class="contador">{{ cantidadTerceros() }}</span></h3>
          <form class="form-grid" (ngSubmit)="crearTercero()">
            <label>Documento <input [(ngModel)]="tercero.documento" name="documento" maxlength="20" placeholder="NIT o cédula" /></label>
            <label class="ancho">Nombre <input [(ngModel)]="tercero.nombre" name="nombre" maxlength="200" /></label>
            <label>
              Tipo
              <select [(ngModel)]="tercero.tipo" name="tipo">
                <option value="CLIENTE">Cliente</option>
                <option value="PROVEEDOR">Proveedor</option>
                <option value="OTRO">Otro</option>
              </select>
            </label>
            <button type="submit" class="btn-primario" [disabled]="guardando()">Agregar tercero</button>
          </form>
          <app-aviso-api [error]="terceros.error()" />
          <app-data-table [columns]="columnasTercero" [rows]="terceros.hasValue() ? terceros.value() : []" />
        </section>

        <section class="panel">
          <h3>Centros de costo <span class="contador">{{ cantidadCentros() }}</span></h3>
          <form class="form-grid" (ngSubmit)="crearCentro()">
            <label>Código <input [(ngModel)]="centro.codigo" name="codigo" maxlength="20" /></label>
            <label class="ancho">Nombre <input [(ngModel)]="centro.nombre" name="nombreCentro" maxlength="150" /></label>
            <button type="submit" class="btn-primario" [disabled]="guardando()">Agregar centro</button>
          </form>
          <app-aviso-api [error]="centros.error()" />
          <app-data-table [columns]="columnasCentro" [rows]="centros.hasValue() ? centros.value() : []" />
        </section>
      </div>
    } @else {
      <p class="aviso">Seleccione una empresa.</p>
    }
  `,
})
export class Terceros {
  private readonly service = inject(ContabilidadService);
  private readonly notificacion = inject(NotificacionService);
  readonly seleccion = inject(SeleccionService);

  readonly terceros = this.service.terceros(this.seleccion.empresaId);
  readonly centros = this.service.centrosCosto(this.seleccion.empresaId);
  readonly cantidadTerceros = computed(() => (this.terceros.hasValue() ? this.terceros.value().length : 0));
  readonly cantidadCentros = computed(() => (this.centros.hasValue() ? this.centros.value().length : 0));
  readonly guardando = signal(false);

  readonly columnasTercero: Columna[] = [
    { key: 'documento', label: 'Documento' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'tipo', label: 'Tipo' },
  ];
  readonly columnasCentro: Columna[] = [
    { key: 'codigo', label: 'Código' },
    { key: 'nombre', label: 'Nombre' },
  ];

  tercero = { documento: '', nombre: '', tipo: 'CLIENTE' as TipoTercero };
  centro = { codigo: '', nombre: '' };

  async crearTercero() {
    if (!this.tercero.documento.trim() || this.tercero.nombre.trim().length < 2) {
      this.notificacion.error('Complete el documento y el nombre del tercero.');
      return;
    }
    await this.ejecutar(async () => {
      await this.service.crearTercero(Number(this.seleccion.empresaId()), {
        documento: this.tercero.documento.trim(),
        nombre: this.tercero.nombre.trim(),
        tipo: this.tercero.tipo,
      });
      this.notificacion.ok(`Tercero "${this.tercero.nombre.trim()}" registrado.`);
      this.tercero = { documento: '', nombre: '', tipo: 'CLIENTE' };
    });
  }

  async crearCentro() {
    if (!this.centro.codigo.trim() || this.centro.nombre.trim().length < 2) {
      this.notificacion.error('Complete el código y el nombre del centro de costo.');
      return;
    }
    await this.ejecutar(async () => {
      await this.service.crearCentroCosto(Number(this.seleccion.empresaId()), {
        codigo: this.centro.codigo.trim(),
        nombre: this.centro.nombre.trim(),
      });
      this.notificacion.ok(`Centro de costo "${this.centro.nombre.trim()}" registrado.`);
      this.centro = { codigo: '', nombre: '' };
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
