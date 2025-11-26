import type { DetalleVentaResultDTO } from "./VentaDetalleDTO";

export interface VentaCompleta {
  id: number;
  fecha: string;
  total: number;
  pagoCon: number;
  cambio: number;
  cargoExtra: number;
  detalles: DetalleVentaResultDTO[];
}
