import { Pipe, PipeTransform } from '@angular/core';
import { etiqueta, formatoFecha, formatoMonto } from '../../core/utils/formato';

@Pipe({ name: 'monto' })
export class MontoPipe implements PipeTransform {
  transform(valor: number | null | undefined, moneda?: string | null, decimales = 2): string {
    return formatoMonto(valor, moneda, decimales);
  }
}

@Pipe({ name: 'fecha' })
export class FechaPipe implements PipeTransform {
  transform(valor: string | null | undefined, largo = false): string {
    return formatoFecha(valor, largo);
  }
}

@Pipe({ name: 'etiqueta' })
export class EtiquetaPipe implements PipeTransform {
  transform(valor: unknown): string {
    return etiqueta(valor);
  }
}
