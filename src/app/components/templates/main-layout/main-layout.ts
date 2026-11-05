import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Icono, NombreIcono } from '../../atoms/icono/icono';
import { SelectorContexto } from '../../organisms/selector-contexto/selector-contexto';
import { NotificacionService } from '../../../core/services/notificacion.service';
import { ContabilidadService } from '../../../core/services/contabilidad.service';

interface Enlace {
  ruta: string;
  texto: string;
  icono: NombreIcono;
}

const MENU: { grupo: string; enlaces: Enlace[] }[] = [
  { grupo: 'General', enlaces: [{ ruta: '/inicio', texto: 'Resumen', icono: 'inicio' }] },
  {
    grupo: 'Contabilidad',
    enlaces: [
      { ruta: '/asientos', texto: 'Asientos', icono: 'asientos' },
      { ruta: '/plan-cuentas', texto: 'Plan de cuentas', icono: 'cuentas' },
    ],
  },
  {
    grupo: 'Reportes',
    enlaces: [
      { ruta: '/estado-resultados', texto: 'Estado de resultados', icono: 'resultados' },
      { ruta: '/balance-general', texto: 'Balance general', icono: 'balance' },
    ],
  },
  {
    grupo: 'Configuración',
    enlaces: [
      { ruta: '/empresas', texto: 'Empresas y periodos', icono: 'empresas' },
      { ruta: '/terceros', texto: 'Terceros y centros', icono: 'terceros' },
    ],
  },
];

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, SelectorContexto, Icono],
  template: `
    <div class="app" [class.menu-abierto]="menuAbierto()">
      <aside class="lateral">
        <a class="marca" routerLink="/inicio">
          <span class="marca-logo"><app-icono nombre="logo" [tam]="20" /></span>
          <span>
            <strong>Sistema Contable</strong>
            <small>Balance y resultados</small>
          </span>
        </a>
        <nav class="menu" aria-label="Secciones">
          @for (g of menu; track g.grupo) {
            <p class="menu-grupo">{{ g.grupo }}</p>
            @for (e of g.enlaces; track e.ruta) {
              <a [routerLink]="e.ruta" routerLinkActive="activo" (click)="menuAbierto.set(false)">
                <app-icono [nombre]="e.icono" />
                {{ e.texto }}
              </a>
            }
          }
        </nav>
        <div class="estado-servicio" [title]="estadoTitulo()">
          <span class="punto" [class]="'punto punto-' + estado().tono"></span>
          <span>
            <strong>{{ estado().texto }}</strong>
            <small>{{ estado().detalle }}</small>
          </span>
        </div>
      </aside>
      <div class="fondo-menu" (click)="menuAbierto.set(false)"></div>

      <div class="area">
        <header class="barra">
          <button
            type="button"
            class="btn-icono boton-menu"
            (click)="menuAbierto.set(true)"
            aria-label="Abrir menú"
          >
            <app-icono nombre="menu" />
          </button>
          <app-selector-contexto />
        </header>
        <main class="pagina">
          <router-outlet />
        </main>
      </div>
    </div>

    @if (notificacion.actual(); as n) {
      <div
        class="toast"
        [class.toast-error]="n.tipo === 'error'"
        role="status"
        (click)="notificacion.cerrar()"
      >
        <app-icono [nombre]="n.tipo === 'error' ? 'alerta' : 'check'" />
        <span>{{ n.texto }}</span>
      </div>
    }
  `,
})
export class MainLayout {
  readonly notificacion = inject(NotificacionService);
  private readonly salud = inject(ContabilidadService).salud();
  readonly menu = MENU;
  readonly menuAbierto = signal(false);

  readonly estado = computed(() => {
    if (this.salud.isLoading())
      return { tono: 'neutro', texto: 'Conectando...', detalle: 'Verificando la API' };
    if (this.salud.error() || !this.salud.hasValue())
      return { tono: 'error', texto: 'API sin conexión', detalle: 'Revise el servicio' };
    const s = this.salud.value();
    return s.estado === 'ok'
      ? { tono: 'ok', texto: 'API en línea', detalle: `Base de datos ${s.base_datos}` }
      : { tono: 'aviso', texto: 'API degradada', detalle: `Base de datos ${s.base_datos}` };
  });
  readonly estadoTitulo = computed(() =>
    this.salud.hasValue() ? `${this.salud.value().servicio} · ${this.salud.value().entorno}` : '',
  );
}
