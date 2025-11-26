import type { Producto } from "../types/Producto";

//const API_URL = "http://localhost:8080/api/productos";
const API_URL = import.meta.env.VITE_API_URL + "/productos";

interface ProductoBackend {
  id: number;
  clave: string;
  descripcion?: string | null;
  codigo_barras?: string | null;
  costo?: number | null;
  precio?: number | null;
  precioIndividual?: number | null; 
  existencia?: number | null;
  existencia_min?: number | null;
  unidad?: string | null;
  activo?: boolean | null;
}

const mapearProducto = (p: ProductoBackend): Producto => ({
  id: p.id,
  clave: p.clave,
  descripcion: p.descripcion ?? "",
  codigo_barras: p.codigo_barras ?? "",
  costo: p.costo ?? 0,
  precio: p.precio ?? 0,
  precio_individual: p.precioIndividual ?? 0,
  existencia: p.existencia ?? 0,
  existencia_min: p.existencia_min ?? 0,
  unidad: p.unidad ?? "",
  activo: p.activo ?? true,
});

export const obtenerProductos = async (): Promise<Producto[]> => {
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error("Error al obtener productos");
  const data: ProductoBackend[] = await response.json();
  return data.map(mapearProducto);
};

const mapearAFormatoBackend = (producto: Omit<Producto, "id">) => ({
  clave: producto.clave,
  descripcion: producto.descripcion ?? "",
  codigo_barras: producto.codigo_barras ?? "",
  costo: producto.costo ?? 0,
  precio: producto.precio ?? 0,
  precioIndividual: producto.precio_individual ?? 0,
  existencia: producto.existencia ?? 0,
  existencia_min: producto.existencia_min ?? 0,
  unidad: producto.unidad ?? "",
  activo: producto.activo ?? true,
});
 
export const crearProducto = async (producto: Omit<Producto, "id">): Promise<Producto> => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(mapearAFormatoBackend(producto)),
  });
  if (!response.ok) throw new Error("Error al crear producto");
  const data: ProductoBackend = await response.json();
  return mapearProducto(data);
};

export const actualizarProducto = async (id: number, producto: Omit<Producto, "id">): Promise<Producto> => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(mapearAFormatoBackend(producto)),
  });
  if (!response.ok) throw new Error("Error al actualizar producto");
  const data: ProductoBackend = await response.json();
  return mapearProducto(data);
};

export const eliminarProducto = async (id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Error al eliminar producto");
};

export const obtenerProducto = async (id: number): Promise<Producto> => {
  const response = await fetch(`${API_URL}/${id}`);
  if (!response.ok) throw new Error("Error al obtener producto por id");
  const data: ProductoBackend = await response.json();
  return mapearProducto(data);
};
