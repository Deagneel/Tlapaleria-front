export interface DetallePedidoDTO {
  id?: number;
  producto_id: number;
  cantidad: number;
  precio: number;
  recibido?: boolean;
}

export interface PedidoDTO {
  id?: number;
  cliente: string;
  estado: string;
  total: number;
  detalles: DetallePedidoDTO[];
  fecha?: string; 
}

export interface Producto {
  id: number;
  clave: string;
  descripcion: string;
  codigo_barras?: string;
  costo: number;
  precio: number;
  precioIndividual?: number;
  existencia?: number;
  existencia_min?: number;
  unidad?: string;
  activo?: boolean;
}
