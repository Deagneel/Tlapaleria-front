import type { Producto } from "./Producto";

export interface DetalleVentaDTO {
  producto_id: number;
  cantidad: number;
  precio: number;
  precioIndividual: number;
  usarPrecioIndividual?: boolean;
  es_producto_empaquetado?: boolean;
  vender_por_unidad?: boolean; 
  cantidadModificadaManual?: boolean;
}

export interface VentaDTO {
  detalles: DetalleVentaDTO[];
  cargo_extra: number;
  pago_con: number;
  total: number;
}

export interface DetalleVenta {
  id?: number;
  venta_id?: number;
  producto_id: number;
  producto?: Producto;
  cantidad: number;
  precio: number;
  subtotal?: number;
}

export interface Venta {
  id?: number;
  detalles: DetalleVenta[];
  total: number;
  pago_con: number;
  cambio: number;
  cargo_extra: number;
  fecha?: string;
}

export interface ProductoLowStock {
  producto_id: number;
  clave?: string;
  descripcion?: string;
  existencia: number;
  existencia_min?: number;
}

export interface VentaResponse {
  venta: Venta;
  lowStock: ProductoLowStock[];
}
