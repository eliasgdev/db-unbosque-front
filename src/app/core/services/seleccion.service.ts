import { Injectable, computed, effect, inject, linkedSignal, signal } from '@angular/core';
import { ContabilidadService } from './contabilidad.service';

const CLAVE = 'contable.seleccion';

function leerGuardado(): { empresa: string; periodo: string } {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE) ?? '{}');
    return { empresa: String(guardado.empresa ?? ''), periodo: String(guardado.periodo ?? '') };
  } catch {
    return { empresa: '', periodo: '' };
  }
}

/**
 * Empresa y periodo de trabajo. Se recuerdan en el navegador y, si no hay selección válida,
 * se elige la primera empresa y su periodo abierto más reciente.
 */
@Injectable({ providedIn: 'root' })
export class SeleccionService {
  private readonly api = inject(ContabilidadService);
  private readonly guardado = leerGuardado();

  readonly empresaId = signal(this.guardado.empresa);
  readonly periodoId = linkedSignal<string, string>({
    source: this.empresaId,
    computation: (empresa, previo) =>
      previo === undefined && empresa === this.guardado.empresa ? this.guardado.periodo : '',
  });

  readonly empresas = this.api.empresas();
  readonly periodos = this.api.periodos(this.empresaId);

  readonly listaEmpresas = computed(() => (this.empresas.hasValue() ? this.empresas.value() : []));
  readonly listaPeriodos = computed(() => (this.periodos.hasValue() ? this.periodos.value() : []));
  readonly empresa = computed(() =>
    this.listaEmpresas().find((e) => String(e.id_empresa) === this.empresaId()),
  );
  readonly periodo = computed(() =>
    this.listaPeriodos().find((p) => String(p.id_periodo) === this.periodoId()),
  );
  readonly periodoAbierto = computed(() => this.periodo()?.estado === 'ABIERTO');
  /** Código ISO de la moneda base de la empresa, para formatear los montos. */
  readonly moneda = computed(() => this.empresa()?.codigo_moneda ?? 'COP');

  constructor() {
    effect(() => {
      const empresas = this.listaEmpresas();
      if (empresas.length && !this.empresa()) this.empresaId.set(String(empresas[0].id_empresa));
    });
    effect(() => {
      const periodos = this.listaPeriodos();
      if (!periodos.length || this.periodo() || this.periodos.isLoading()) return;
      const abiertos = periodos.filter((p) => p.estado === 'ABIERTO');
      const elegido = (abiertos.length ? abiertos : periodos).reduce((a, b) =>
        b.fecha_inicio > a.fecha_inicio ? b : a,
      );
      this.periodoId.set(String(elegido.id_periodo));
    });
    effect(() => {
      try {
        localStorage.setItem(
          CLAVE,
          JSON.stringify({ empresa: this.empresaId(), periodo: this.periodoId() }),
        );
      } catch {
        // Sin almacenamiento (modo privado): la selección solo dura la sesión.
      }
    });
  }
}
