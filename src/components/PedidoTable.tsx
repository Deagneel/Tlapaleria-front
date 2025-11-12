import React from "react";
import type { PedidoDTO } from "../types/Pedido";
import { Pencil, Trash2 } from "lucide-react";

interface Props {
  pedidos: PedidoDTO[];
  onEditar: (pedido: PedidoDTO) => void;
  onEliminar: (id: number) => void;
  onCambiarEstado: (pedido: PedidoDTO, nuevoEstado: "SURTIDO" | "ENTREGADO") => void;
}

const PedidoTable: React.FC<Props> = ({ pedidos, onEditar, onEliminar }) => {
  const getColorClass = (estado: string) => {
    switch (estado) {
      case "PENDIENTE":
        return "bg-yellow-50 border-l-4 border-yellow-400"; 
      case "SURTIDO":
        return "bg-emerald-50 border-l-4 border-emerald-400"; 
      case "ENTREGADO":
        return "bg-gray-200 border-l-4 border-gray-500"; 
      default:
        return "";
    }
  };

  return (
    <div className="border rounded-lg overflow-auto h-[70vh]">
      <div
        className="grid px-4 py-2 bg-blue-600 text-white font-semibold"
        style={{ gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr" }}
      >
        <div>Pedido</div>
        <div>Fecha</div>
        <div>Estado</div>
        <div>Total</div>
        <div className="text-center">Acciones</div>
      </div>

      {pedidos.length === 0 ? (
        <p className="text-gray-500 mt-6 text-center">No hay pedidos que coincidan.</p>
      ) : (
        pedidos.map((pedido) => {
          const fechaPedido = pedido.fecha ? new Date(pedido.fecha) : null;

          return (
            <div
              key={pedido.id}
              className={`grid px-4 py-2 items-center border-b hover:bg-gray-100 transition ${getColorClass(
                pedido.estado
              )}`}
              style={{ gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr", minHeight: 60 }}
            >
              <div>{pedido.cliente}</div>
              <div>{fechaPedido ? fechaPedido.toLocaleString() : "N/A"}</div>
              <div className="capitalize font-medium">{pedido.estado}</div>
              <div>${Number(pedido.total ?? 0).toFixed(2)}</div>
              <div className="flex justify-center gap-2">
                {pedido.estado !== "ENTREGADO" && (
                  <button
                    onClick={() => onEditar(pedido)}
                    className="bg-blue-100 border-blue-300 text-blue-600 hover:bg-gray-400 p-1.5 rounded transition flex items-center justify-center"
                    title="Editar"
                  >
                    <Pencil size={18} />
                  </button>
                )}

                <button
                  onClick={() => onEliminar(pedido.id!)}
                  className="bg-blue-100 border-blue-300 text-red-500 hover:bg-gray-400 p-1.5 rounded transition flex items-center justify-center"
                  title="Eliminar"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default PedidoTable;
