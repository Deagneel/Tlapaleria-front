import axios from "axios";
import type { PedidoDTO } from "../types/Pedido";

const API_URL = "http://localhost:8080/api/pedidos"; 

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
  console.log("Llamando a:", url);
  const { data } = await axios.get(url);
  return data;
};
