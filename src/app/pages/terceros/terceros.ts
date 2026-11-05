import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Columna, DataTable } from '../../components/organisms/data-table/data-table';
import { Modal } from '../../components/organisms/modal/modal';
import { AvisoApi } from '../../components/molecules/aviso-api/aviso-api';
import { Encabezado } from '../../components/molecules/encabezado/encabezado';
import { EstadoVacio } from '../../components/molecules/estado-vacio/estado-vacio';
import { Buscador } from '../../components/molecules/buscador/buscador';
import { Icono } from '../../components/atoms/icono/icono';
import { TipoTercero } from '../../core/models/contabilidad';
import { ContabilidadService } from '../../core/services/contabilidad.service';
import { NotificacionService } from '../../core/services/notificacion.service';
import { SeleccionService } from '../../core/services/seleccion.service';
import { mensajeError } from '../../core/utils/errores';

type Pestana = 'terceros' | 'centros';

@Component({
  selector: 'app-terceros',
  imports: [DataTable, Modal, AvisoApi, Encabezado, EstadoVacio, Buscador, Icono, FormsModule],
  template: `
    <app-encabezado
      titulo="Terceros y centros de costo"
      subtitulo="Clientes, proveedores y áreas a las que se imputan los movimientos."
    >
      @if (seleccion.empresaId()) {
        <button type="button" class="btn btn-primario" (click)="dialogo.set(pestana())">
          <app-icono nombre="mas" [tam]="16" />
          {{ pestana() === 'terceros' ? 'Nuevo tercero' : 'Nuevo centro de costo' }}
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
      <nav class="pestanas" role="tablist">
        <button
          type="button"
          role="tab"
          [class.activo]="pestana() === 'terceros'"
          (click)="pestana.set('terceros')"
        >
          Terceros <span class="contador">{{ listaTerceros().length }}</span>
        </button>
        <button
          type="button"
          role="tab"
          [class.activo]="pestana() === 'centros'"
          (click)="pestana.set('centros')"
        >
          Centros de costo <span class="contador">{{ listaCentros().length }}</span>
        </button>
      </nav>

      <section class="tarjeta tarjeta-tabla">
        <div class="barra-herramientas">
          @if (pestana() === 'terceros') {
            <div class="segmentos">
              @for (t of tipos; track t.valor) {
                <button
                  type="button"
                  [class.activo]="tipo() === t.valor"
                  (click)="tipo.set(t.valor)"
                >
                  {{ t.texto }}
                </button>
              }
            </div>
          } @else {
            <span></span>
          }
          <app-buscador
            [(term)]="term"
            [placeholder]="
              pestana() === 'terceros' ? 'Buscar documento o nombre' : 'Buscar código o nombre'
            "
          />
        </div>
        @if (pestana() === 'terceros') {
          <app-aviso-api [error]="terceros.error()" />
          <app-data-table
            [columns]="columnasTercero"
            [rows]="tercerosFiltrados()"
            [cargando]="terceros.isLoading()"
            vacio="No hay terceros que coincidan."
          />
        } @else {
          <app-aviso-api [error]="centros.error()" />
          <app-data-table
            [columns]="columnasCentro"
            [rows]="centrosFiltrados()"
            [cargando]="centros.isLoading()"
            vacio="No hay centros de costo que coincidan."
          />
        }
      </section>
    }

    @if (dialogo() === 'terceros') {
      <app-modal
        titulo="Nuevo tercero"
        [subtitulo]="seleccion.empresa()?.razon_social ?? ''"
        (cerrar)="dialogo.set('')"
      >
        <form class="form-grid" (ngSubmit)="crearTercero()">
          <label
            >Documento
            <input
              [(ngModel)]="tercero.documento"
              name="documento"
              maxlength="20"
              placeholder="NIT o cédula"
          /></label>
          <label>
            Tipo
            <select [(ngModel)]="tercero.tipo" name="tipo">
              <option value="CLIENTE">Cliente</option>
              <option value="PROVEEDOR">Proveedor</option>
              <option value="OTRO">Otro</option>
            </select>
          </label>
          <label class="ancho"
            >Nombre <input [(ngModel)]="tercero.nombre" name="nombre" maxlength="200"
          /></label>
          <div class="acciones acciones-modal ancho">
            <button type="button" class="btn btn-secundario" (click)="dialogo.set('')">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primario" [disabled]="guardando()">
              Registrar tercero
            </button>
          </div>
        </form>
      </app-modal>
    } @else if (dialogo() === 'centros') {
      <app-modal
        titulo="Nuevo centro de costo"
        [subtitulo]="seleccion.empresa()?.razon_social ?? ''"
        (cerrar)="dialogo.set('')"
      >
        <form class="form-grid" (ngSubmit)="crearCentro()">
          <label
            >Código
            <input [(ngModel)]="centro.codigo" name="codigo" maxlength="20" placeholder="CC-ADM-01"
          /></label>
          <label class="ancho"
            >Nombre <input [(ngModel)]="centro.nombre" name="nombreCentro" maxlength="150"
          /></label>
          <div class="acciones acciones-modal ancho">
            <button type="button" class="btn btn-secundario" (click)="dialogo.set('')">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primario" [disabled]="guardando()">
              Registrar centro
            </button>
          </div>
        </form>
      </app-modal>
    }
  `,
})
export class Terceros {
  private readonly service = inject(ContabilidadService);
  private readonly notificacion = inject(NotificacionService);
  readonly seleccion = inject(SeleccionService);

  readonly terceros = this.service.terceros(this.seleccion.empresaId);
  readonly centros = this.service.centrosCosto(this.seleccion.empresaId);
  readonly guardando = signal(false);
  readonly pestana = signal<Pestana>('terceros');
  readonly dialogo = signal<'' | Pestana>('');
  readonly term = signal('');
  readonly tipo = signal<'' | TipoTercero>('');

  readonly tipos: { valor: '' | TipoTercero; texto: string }[] = [
    { valor: '', texto: 'Todos' },
    { valor: 'CLIENTE', texto: 'Clientes' },
    { valor: 'PROVEEDOR', texto: 'Proveedores' },
    { valor: 'OTRO', texto: 'Otros' },
  ];
  readonly columnasTercero: Columna[] = [
    { key: 'documento', label: 'Documento', tipo: 'codigo', ancho: '160px' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'tipo', label: 'Tipo', tipo: 'estado', ancho: '140px' },
  ];
  readonly columnasCentro: Columna[] = [
    { key: 'codigo', label: 'Código', tipo: 'codigo', ancho: '160px' },
    { key: 'nombre', label: 'Nombre' },
  ];

  readonly listaTerceros = computed(() => (this.terceros.hasValue() ? this.terceros.value() : []));
  readonly listaCentros = computed(() => (this.centros.hasValue() ? this.centros.value() : []));
  readonly tercerosFiltrados = computed(() => {
    const t = this.term().trim().toLowerCase();
    return this.listaTerceros().filter(
      (x) =>
        (!this.tipo() || x.tipo === this.tipo()) &&
        `${x.documento} ${x.nombre}`.toLowerCase().includes(t),
    );
  });
  readonly centrosFiltrados = computed(() => {
    const t = this.term().trim().toLowerCase();
    return this.listaCentros().filter((x) => `${x.codigo} ${x.nombre}`.toLowerCase().includes(t));
  });

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
      this.dialogo.set('');
    } catch (e) {
      this.notificacion.error(mensajeError(e));
    } finally {
      this.guardando.set(false);
    }
  }
}
