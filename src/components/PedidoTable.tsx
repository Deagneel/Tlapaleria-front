import React from "react";
import type { PedidoDTO } from "../types/Pedido";
import { Pencil, Trash2, Package, Calendar, DollarSign, User } from "lucide-react";

interface Props {
  pedidos: PedidoDTO[];
  onEditar: (pedido: PedidoDTO) => void;
  onEliminar: (id: number) => void;
  onCambiarEstado: (pedido: PedidoDTO, nuevoEstado: "SURTIDO" | "ENTREGADO") => void;
}

const PedidoTable: React.FC<Props> = ({ pedidos, onEditar, onEliminar }) => {
  const getColorClass = (estado: string) => {
    switch (estado?.toUpperCase()) {
      case "PENDIENTE":
        return "bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800"; 
      case "SURTIDO":
        return "bg-green-100 border-l-4 border-green-400 text-blue-800";
      case "ENTREGADO":
        return "bg-gray-100 border-l-4 border-gray-300 text-gray-500";
      default:
        return "bg-white border-l-4 border-gray-300 text-gray-700"; 
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado?.toUpperCase()) {
      case "PENDIENTE":
        return "bg-yellow-100 text-yellow-800 border border-yellow-300";
      case "SURTIDO":
        return "bg-blue-100 text-blue-800 border border-blue-300";
      case "ENTREGADO":
        return "bg-gray-200 text-gray-500 border border-gray-400";
      default:
        return "bg-gray-100 text-gray-600 border border-gray-300";
    }
  };

  const formatCurrency = (n: number) => 
    n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
      <div
        className="grid px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold text-sm"
        style={{ gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1.2fr" }}
      >
        <div className="flex items-center gap-2">
          <User size={16} />
          Cliente
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={16} />
          Fecha
        </div>
        <div className="flex items-center gap-2">
          <Package size={16} />
          Estado
        </div>
        <div className="flex items-center gap-2 justify-end">
          <DollarSign size={16} />
          Total
        </div>
        <div className="text-center">Acciones</div>
      </div>

      {/* Lista de pedidos */}
      <div className="max-h-[70vh] overflow-auto">
        {pedidos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <Package size={48} className="text-gray-300 mb-3" />
            <p className="text-lg font-medium">No hay pedidos que coincidan</p>
            <p className="text-sm">Intenta ajustar los filtros o la búsqueda</p>
          </div>
        ) : (
          pedidos.map((pedido) => { 
            const fechaPedido = pedido.fecha ? new Date(pedido.fecha) : null;

            return (
              <div
                key={pedido.id}
                className={`grid px-6 py-4 items-center border-b border-gray-100 hover:bg-blue-200 transition-all duration-200 ${getColorClass(
                  pedido.estado
                )}`} 
                style={{ gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1.2fr", minHeight: 70 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{pedido.cliente}</div>
                  </div>
                </div>

                <div className="text-gray-700">
                  {fechaPedido ? (
                    <div>
                      <div className="font-medium">
                        {fechaPedido.toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {fechaPedido.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ) : (
                    "N/A"
                  )}
                </div>

                <div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium capitalize ${getEstadoBadge(pedido.estado)}`}>
                    {pedido.estado || "Sin estado"}
                  </span>
                </div>

                <div className="text-right pr-4">
                  <div className="font-bold text-green-600 text-lg">
                    ${formatCurrency(Number(pedido.total ?? 0))}
                  </div>
                </div>

                <div className="flex justify-center gap-2">
                  {pedido.estado?.toUpperCase() !== "ENTREGADO" && (
                    <button
                      onClick={() => onEditar(pedido)}
                      className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-xl transition-all duration-200 hover:scale-110"
                      title="Editar pedido"
                    >
                      <Pencil size={18} />
                    </button>
                  )}

                  <button
                    onClick={() => onEliminar(pedido.id!)}
                    className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-xl transition-all duration-200 hover:scale-110"
                    title="Eliminar pedido"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PedidoTable;