export interface ProductoDTO {
  id: number;
  clave: string;
  descripcion: string;
  codigo_barras?: string;
  costo?: number;
  precio?: number;
  precioIndividual?: number;
  activo?: boolean;
}

export interface DetallePedidoFullDTO {
  id?: number;
  producto_id: number;
  producto: ProductoDTO; // <-- aquí está la info completa
  cantidad: number;
  precio: number;
  recibido?: boolean;
}

export interface PedidoFullDTO {
  id?: number;
  cliente: string;
  estado: "PENDIENTE" | "SURTIDO" | "ENTREGADO";
  total: number;
  fecha?: string;
  detalles: DetallePedidoFullDTO[];
}
