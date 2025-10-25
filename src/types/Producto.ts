export interface Producto {
  id: number;
  clave: string;
  descripcion: string;
  codigo_barras: string;
  costo: number;
  precio: number;           
  precio_individual: number; 
  existencia: number;
  existencia_min: number;
  unidad: string;
  activo: boolean;
}
