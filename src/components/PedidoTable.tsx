import React, { useMemo, useEffect, useState } from "react";
import { Virtuoso } from "react-virtuoso";
import { Trash } from "lucide-react";
import type { Pedido } from "../types/Pedido";

interface Props {
  pedidos: Pedido[];
  busqueda: string;
  onEliminar: (id: number) => void;
  paginaActual: number;
  setPaginaActual: (num: number) => void;
}

const ROW_HEIGHT = 50;
const DEFAULT_PAGE_SIZE = 20;

const PedidoTable: React.FC<Props> = ({ pedidos, busqueda, onEliminar, paginaActual, setPaginaActual }) => {
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const pedidosFiltrados = useMemo(() => {
    return pedidos.filter((p) =>
      p.cliente.toLowerCase().includes(busqueda.toLowerCase())
    );
  }, [pedidos, busqueda]);

  const totalPaginas = Math.ceil(pedidosFiltrados.length / pageSize);
  const startIndex = (paginaActual - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pedidosPagina = pedidosFiltrados.slice(startIndex, endIndex);

  // Reiniciar página si filtros o búsqueda cambian
  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, pageSize]);

  const cambiarPagina = (num: number) => {
    if (num < 1) num = 1;
    if (num > totalPaginas) num = totalPaginas;
    setPaginaActual(num);
  };

  return (
    <div className="flex flex-col h-screen bg-white shadow rounded-lg border border-gray-200">
      {/* Encabezado de tabla */}
      <div
        className="grid px-4 py-2 bg-blue-600 text-white font-semibold flex-shrink-0"
        style={{ gridTemplateColumns: "1fr 2fr 1fr 1fr" }}
      >
        <div>ID</div>
        <div>Cliente</div>
        <div>Total</div>
        <div className="text-center">Acciones</div>
      </div>

      {/* Lista virtualizada */}
      <div className="flex-1 overflow-hidden">
        {pedidosFiltrados.length === 0 ? (
          <p className="text-gray-500 mt-6 text-center">No hay pedidos que coincidan.</p>
        ) : (
          <Virtuoso
            data={pedidosPagina}
            itemContent={(index, pedido) => (
              <div
                key={pedido.id}
                className="border-b border-gray-100 hover:bg-gray-50 transition"
                style={{ minHeight: ROW_HEIGHT }}
              >
                <div
                  className="grid px-4 py-2 items-center"
                  style={{ gridTemplateColumns: "1fr 2fr 1fr 1fr" }}
                >
                  <div>{pedido.id}</div>
                  <div className="break-words">{pedido.cliente}</div>
                  <div>${Number(pedido.total ?? 0).toFixed(2)}</div>

                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => onEliminar(pedido.id!)}
                      className="bg-gray-300 text-red-500 hover:bg-gray-400 p-1.5 rounded transition"
                      title="Eliminar"
                    >
                      <Trash size={18} />
                    </button>
                  </div>
                </div>
              </div>
            )}
            style={{ height: "100%" }}
          />
        )}
      </div>

      {/* Paginación */}
      <div className="flex justify-between items-center px-4 py-3 border-t border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span>Página:</span>
          <button
            onClick={() => cambiarPagina(1)}
            className="px-2 py-1 border rounded bg-gray-200 text-gray-700 hover:bg-gray-300 hover:text-black"
          >
            {"<<"}
          </button>
          <button
            onClick={() => cambiarPagina(paginaActual - 1)}
            className="px-2 py-1 border rounded bg-gray-200 text-gray-700 hover:bg-gray-300 hover:text-black"
          >
            {"<"}
          </button>
          <span>
            {paginaActual} / {totalPaginas}
          </span>
          <button
            onClick={() => cambiarPagina(paginaActual + 1)}
            className="px-2 py-1 border rounded bg-gray-200 text-gray-700 hover:bg-gray-300 hover:text-black"
          >
            {">"}
          </button>
          <button
            onClick={() => cambiarPagina(totalPaginas)}
            className="px-2 py-1 border rounded bg-gray-200 text-gray-700 hover:bg-gray-300 hover:text-black"
          >
            {">>"}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label>Filas por página:</label>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="border rounded p-1 bg-white text-gray-800"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={30}>30</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default PedidoTable;
