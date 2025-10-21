import type { Producto } from '../types/Producto';

const API_URL = "http://localhost:8080/api/productos"; // tu backend

export const obtenerProductos = async (): Promise<Producto[]> => {
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error("Error al obtener productos");
  return response.json();
};

// Para crear, no necesitamos el id
export const crearProducto = async (producto: Omit<Producto, 'id'>): Promise<Producto> => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(producto),
  });
  if (!response.ok) throw new Error("Error al crear producto");
  return response.json();
};

// Para actualizar, pasamos el id por separado y el resto del objeto sin id
export const actualizarProducto = async (id: number, producto: Omit<Producto, 'id'>): Promise<Producto> => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(producto),
  });
  if (!response.ok) throw new Error("Error al actualizar producto");
  return response.json();
};

export const eliminarProducto = async (id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Error al eliminar producto");
};
