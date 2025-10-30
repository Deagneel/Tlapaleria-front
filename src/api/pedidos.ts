import type { PedidoDTO } from "../types/Pedido";

const API_URL = "http://localhost:8080/api/pedidos";

export const obtenerPedidos = async (): Promise<PedidoDTO[]> => {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error("Error al obtener pedidos");
  return res.json();
};

export const crearPedido = async (pedido: PedidoDTO): Promise<PedidoDTO> => {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pedido),
  });
  if (!res.ok) throw new Error("Error al crear pedido");
  return res.json();
};

export const actualizarPedido = async (id: number, pedido: PedidoDTO): Promise<PedidoDTO> => {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pedido),
  });
  if (!res.ok) throw new Error("Error al actualizar pedido");
  return res.json();
};

export const eliminarPedido = async (id: number): Promise<void> => {
  const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar pedido");
};
