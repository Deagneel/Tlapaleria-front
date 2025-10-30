// Pedido.ts
export interface Producto {
  id: number;
  clave: string;
  descripcion: string;
  costo: number;
  precio: number;
  precioIndividual?: number;
  existencia?: number;
  existencia_min?: number;
  unidad?: string;
  activo?: boolean;
  codigo_barras?: string; // opcional
}

export interface DetallePedidoDTO {
  id?: number;
  producto_id: number; // obligatorio para backend
  producto?: Producto; // opcional para frontend
  cantidad: number;
  precio: number; // usar costo en pedidos
  subtotal?: number;
}

export interface PedidoDTO {
  id?: number;
  cliente: string;
  fecha?: string;
  estado: "PENDIENTE" | "SURTIDO" | "ENTREGADO";
  total?: number;
  detalles?: DetallePedidoDTO[];
}
