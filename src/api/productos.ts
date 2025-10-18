import axios from 'axios';
import type { Producto } from '../types/Producto';


const API_URL = 'http://localhost:8080/api/productos';

export const obtenerProductos = async (): Promise<Producto[]> => {
  const { data } = await axios.get<Producto[]>(API_URL);
  return data;
};

export const crearProducto = async (producto: Omit<Producto, 'id'>): Promise<Producto> => {
  const { data } = await axios.post<Producto>(API_URL, producto);
  return data;
};

export const actualizarProducto = async (id: number, producto: Omit<Producto, 'id'>): Promise<Producto> => {
  const { data } = await axios.put<Producto>(`${API_URL}/${id}`, producto);
  return data;
};

export const eliminarProducto = async (id: number): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`);
};
