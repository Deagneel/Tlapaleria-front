import axios from "axios";
import type { PedidoDTO } from "../types/Pedido";

//const API_URL = "http://localhost:8080/api/pedidos"; 
const API_URL = import.meta.env.VITE_API_URL + "/pedidos";

export const obtenerPedidos = async (): Promise<PedidoDTO[]> => {
  const { data } = await axios.get(API_URL);
  return data;
};

export const crearPedido = async (pedido: Omit<PedidoDTO, "id">) => {
  const { data } = await axios.post(API_URL, pedido);
  return data;
};

export const actualizarPedido = async (id: number, pedido: Omit<PedidoDTO, "id">) => {
  const { data } = await axios.put(`${API_URL}/${id}`, pedido);
  return data;
};

export const eliminarPedido = async (id: number) => {
  await axios.delete(`${API_URL}/${id}`);
};

export const obtenerPedidoPorId = async (id: number) => {
  const { data } = await axios.get(`${API_URL}/${id}`);
  return data;
};

export const obtenerPedidoCompleto = async (id: number) => {
  const url = `${API_URL}/${id}`;
  const { data } = await axios.get(url);
  return data;
};

export const obtenerProductoPorId = async (id: number) => {
  const { data } = await axios.get(`${API_URL}/${id}`);
  return data;
};

export const obtenerPedidosPendientes = async (): Promise<PedidoDTO[]> => {
  const { data } = await axios.get<PedidoDTO[]>(`${API_URL}`);
  return data.filter((p: PedidoDTO) => (p.estado ?? "").toUpperCase() === "PENDIENTE");
};

export interface DetallePedidoInput {
  producto_id: number;
  cantidad: number;
  precio: number;
  recibido?: boolean;
}

export const agregarProductoAPedido = async (pedidoId: number, detalle: DetallePedidoInput) => {
  const { data } = await axios.post(`${API_URL}/${pedidoId}/detalles`, detalle);
  return data;
};