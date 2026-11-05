import { Component, computed, input } from '@angular/core';

/** Trazos de 24×24 (estilo de línea) para los iconos de la interfaz. */
const ICONOS = {
  inicio: 'M3 3h7v9H3z M14 3h7v5h-7z M14 12h7v9h-7z M3 16h7v5H3z',
  cuentas: 'M21 12h-8 M21 6H8 M21 18h-8 M3 6v4c0 1.1.9 2 2 2h3 M3 10v6c0 1.1.9 2 2 2h3',
  asientos: 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z',
  resultados: 'M22 7l-8.5 8.5-5-5L2 17 M16 7h6v6',
  balance:
    'M16 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z M2 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z M7 21h10 M12 3v18 M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2',
  terceros:
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M5 7a4 4 0 1 0 8 0a4 4 0 1 0-8 0 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',
  empresas:
    'M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18z M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2 M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2 M10 6h4 M10 10h4 M10 14h4 M10 18h4',
  mas: 'M5 12h14 M12 5v14',
  menu: 'M4 6h16 M4 12h16 M4 18h16',
  cerrar: 'M18 6L6 18 M6 6l12 12',
  buscar: 'M3 11a8 8 0 1 0 16 0a8 8 0 1 0-16 0 M21 21l-4.3-4.3',
  check: 'M20 6L9 17l-5-5',
  alerta:
    'M12 9v4 M12 17h.01 M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z',
  info: 'M2 12a10 10 0 1 0 20 0a10 10 0 1 0-20 0 M12 16v-4 M12 8h.01',
  editar: 'M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z',
  candado: 'M5 11h14v10H5z M7 11V7a5 5 0 0 1 10 0v4',
  imprimir:
    'M6 9V2h12v7 M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2 M6 14h12v8H6z',
  calendario: 'M3 4h18v18H3z M16 2v4 M8 2v4 M3 10h18',
  derecha: 'M9 18l6-6-6-6',
  abajo: 'M6 9l6 6 6-6',
  documento:
    'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
  enviar: 'M22 2L11 13 M22 2l-7 20-4-9-9-4z',
  logo: 'M4 19V5 M4 19h16 M8 15l3-4 3 2 5-7',
  vacio:
    'M22 12h-6l-2 3h-4l-2-3H2 M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z',
} as const;

export type NombreIcono = keyof typeof ICONOS;

@Component({
  selector: 'app-icono',
  host: { class: 'icono' },
  template: `
    <svg
      viewBox="0 0 24 24"
      [attr.width]="tam()"
      [attr.height]="tam()"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path [attr.d]="trazo()" />
    </svg>
  `,
})
export class Icono {
  readonly nombre = input.required<NombreIcono>();
  readonly tam = input(18);
  readonly trazo = computed(() => ICONOS[this.nombre()]);
}
