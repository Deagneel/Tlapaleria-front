// VentaResumenDTO.ts
export interface VentaDetalleResumenDTO {
  id: number;
  cantidad: number;
  precio: number;
  subtotal: number;
  productoId: number | null;
  descripcion: string | null;
  clave: string | null;
}

export interface VentaResumenDTO {
  id: number;
  total: number;
  fecha: string; 
  detalles: VentaDetalleResumenDTO[];
}
