export interface Producto {
  id: number;
  clave: string;
  descripcion: string;
  codigo_barras: string;
  costo: number;
  precio: number;           
  precio_individual?: number;
  precioIndividual?: number;
  existencia?: number;       
  existencia_min?: number;  
  unidad: string;
  activo: boolean;
  es_producto_paquete?: boolean;
  piezas_por_paquete?: number;
  piezas_individuales?: number;
}
