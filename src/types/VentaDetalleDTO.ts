export interface DetalleVentaResultDTO {
  id: number;
  producto_id: number;
  clave: string;
  descripcion: string;
  cantidad: number;
  costo: number;
  precio: number;
  subtotal: number;
  existencia: number;
  existencia_min: number;
}

export interface VentaDetalleDTO {
  id: number;
  total: number;
  pagoCon: number;
  cambio: number;
  cargoExtra: number;
  fecha: string; 
  detalles: DetalleVentaResultDTO[];
}

export interface HistorialMonth {
  year: number;
  month: number; 
  startDate: string; 
  endDate: string;
  ventasCount: number;
  totalMes: number;
}

export interface HistorialWeek {
  year: number;
  week: number;
  startDate: string; 
  endDate: string;
  ventasCount: number;
  totalSemana: number;
}

export interface VentaResumenHistorial {
  id: number;
  fecha: string; 
  total: number;
  lineas?: number;
}

export type ProductoVendido = {
  productoId: number;
  clave: string;
  costo: number;
  descripcion: string;
  cantidadTotal: number;
  veces?: number;
  subtotalTotal: number;
  existencia: number;     
  existenciaMin: number; 
};


export interface HistorialDay {
  date: string;               
  ventasCount: number;
  totalDia: number;
  ventas: VentaResumenHistorial[];
}
