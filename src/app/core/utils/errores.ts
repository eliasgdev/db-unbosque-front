import { HttpErrorResponse } from '@angular/common/http';
import { ErrorApi } from '../models/contabilidad';

/** Traduce un error de la API (ErrorResponse estándar) a un mensaje legible. */
export function mensajeError(err: unknown): string {
  if (!(err instanceof HttpErrorResponse)) return String(err);
  if (err.status === 0) return 'No se pudo contactar la API.';
  const cuerpo = err.error as Partial<ErrorApi> | null;
  if (cuerpo?.codigo === 'ERROR_VALIDACION') return 'Revise los datos: hay campos vacíos o con un formato no válido.';
  return cuerpo?.mensaje ?? `Error ${err.status}: ${err.statusText}`;
}
