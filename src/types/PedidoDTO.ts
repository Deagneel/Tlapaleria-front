// types/PedidoDTO.ts
export interface DetallePedidoDTO {
  id?: number;           // solo si ya existe en backend
  producto_id: number;   // obligatorio
  cantidad: number;
  precio: number;
}

export interface PedidoDTO {
  id?: number;
  cliente: string;
  estado: "PENDIENTE" | "SURTIDO" | "ENTREGADO";
  total: number;
  detalles: DetallePedidoDTO[];
}
