import { Component, computed, input } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ErrorApi } from '../../../core/models/contabilidad';

/** Muestra el error de un httpResource usando el ErrorResponse estándar de la API. */
@Component({
  selector: 'app-aviso-api',
  template: `
    @if (mensaje(); as m) {
      <p [class]="m.pendiente ? 'aviso' : 'error'">
        <strong>{{ m.titulo }}</strong> {{ m.texto }}
      </p>
    }
  `,
})
export class AvisoApi {
  readonly error = input<unknown>();

  readonly mensaje = computed(() => {
    const err = this.error();
    if (!err) return null;
    if (!(err instanceof HttpErrorResponse)) return { titulo: 'Error:', texto: String(err), pendiente: false };
    if (err.status === 0) {
      return { titulo: 'Sin conexión:', texto: 'no se pudo contactar la API. ¿Está corriendo uvicorn?', pendiente: false };
    }
    const cuerpo = err.error as Partial<ErrorApi> | null;
    const texto = cuerpo?.mensaje ?? err.message;
    if (err.status === 501) return { titulo: 'SQL pendiente:', texto, pendiente: true };
    return { titulo: `Error ${err.status}:`, texto, pendiente: false };
  });
}
