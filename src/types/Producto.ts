export interface Producto {
  id: number;
  clave: string;
  descripcion: string;
  codigo_barras: string;
  costo: number;
  precio: number;           // precio de caja
  precio_individual: number; // precio individual
  existencia: number;
  existencia_min: number;
  unidad: string;
  activo: boolean;
}
