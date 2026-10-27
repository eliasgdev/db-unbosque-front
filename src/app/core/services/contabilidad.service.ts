import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { Movimiento } from '../models/movimiento';

@Injectable({ providedIn: 'root' })
export class ContabilidadService {
  listarMovimientos() {
    return of<Movimiento[]>([
      { id: 1, fecha: '2026-10-01', cuenta: 'Caja', descripcion: 'Venta de servicios', tipo: 'ingreso', monto: 1500000 },
      { id: 2, fecha: '2026-10-03', cuenta: 'Arriendo', descripcion: 'Pago arriendo oficina', tipo: 'gasto', monto: 800000 },
      { id: 3, fecha: '2026-10-10', cuenta: 'Bancos', descripcion: 'Pago de cliente', tipo: 'ingreso', monto: 2300000 },
      { id: 4, fecha: '2026-10-15', cuenta: 'Servicios públicos', descripcion: 'Energía y agua', tipo: 'gasto', monto: 250000 },
    ]);
  }
}
