export interface Movimiento {
  id: number;
  fecha: string;
  cuenta: string;
  descripcion: string;
  tipo: 'ingreso' | 'gasto';
  monto: number;
}
