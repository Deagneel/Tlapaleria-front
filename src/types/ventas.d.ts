export interface DetalleVenta {
  id: number;
  productoId: number;
  descripcion: string;
  cantidad: number;
  precio: number;
  subtotal: number;
}

export interface Venta {
  id: number;
  fecha: string;
  total: number;
  pago_con: number;
  cambio: number;
  cargo_extra: number;
  detalles: DetalleVenta[];
}
