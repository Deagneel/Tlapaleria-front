import type { VentaResumenHistorial } from "./VentaDetalleDTO";

export interface VentasPorDia {
  fecha: string;
  total: number;
  ventas: VentaResumenHistorial[];
}

export interface EstadisticasSemanales {
  semana: number;
  anio: number;
  total: number;
  promedioDia: number;
}

export interface EstadisticasMensuales {
  mes: number;
  anio: number;
  total: number;
  promedioDia: number;
}

export interface EstadisticasAnuales {
  anio: number;
  total: number;
}

export interface TopProducto {
  productoId: number;
  descripcion: string;
  cantidad: number;
  totalVendido: number;
}
