import React, { useState, useMemo, useEffect } from "react";
import { Virtuoso } from "react-virtuoso";
import { ChevronDown, ChevronUp, Edit, Trash } from "lucide-react";
import type { Producto } from "../types/Producto";

interface Props {
  productos: Producto[];
  onEditar: (producto: Producto) => void;
  onEliminar: (id: number) => void;
  busqueda: string; // barra de búsqueda actual
}

const ROW_HEIGHT = 50;
const DEFAULT_PAGE_SIZE = 30;

const InventarioTable: React.FC<Props> = ({ productos, onEditar, onEliminar, busqueda }) => {
  const [detallesAbiertos, setDetallesAbiertos] = useState<number | null>(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [filtroCategoria, setFiltroCategoria] = useState<string>("Todos");
  const [filtroEstado, setFiltroEstado] = useState<string>("Todos");
  const [ordenAscendente, setOrdenAscendente] = useState<boolean | null>(null); // null = sin ordenar

  // Determinar categoría por clave
  const categoriaPorClave = (clave: string) => {
    if (!clave) return "Otros";
    const letra = clave[0].toUpperCase();
    if (["D", "I"].includes(letra)) return "Sol";
    if (["V", "T", "P", "K", "F", "H"].includes(letra)) return "Truper";
    return "Otros";
  };

  // Productos filtrados y ordenados
  const productosFiltrados = useMemo(() => {
    const filtrados = productos
      .filter((p) => filtroCategoria === "Todos" || categoriaPorClave(p.clave) === filtroCategoria)
      .filter((p) => {
        if (filtroEstado === "Disponible") return p.existencia > 0;
        if (filtroEstado === "Agotado") return p.existencia <= 0;
        if (filtroEstado === "Para pedir") return p.existencia <= p.existencia_min;
        return true;
      })
      .filter((p) => {
        if (!busqueda) return true;
        const texto = busqueda.toLowerCase();
        return (
          p.clave.toLowerCase().includes(texto) ||
          p.descripcion.toLowerCase().includes(texto) ||
          (p.codigo_barras && p.codigo_barras.includes(texto))
        );
      });

    if (ordenAscendente !== null) {
      filtrados.sort((a, b) => {
        const descA = a.descripcion.toLowerCase();
        const descB = b.descripcion.toLowerCase();
        if (descA < descB) return ordenAscendente ? -1 : 1;
        if (descA > descB) return ordenAscendente ? 1 : -1;
        return 0;
      });
    }

    return filtrados;
  }, [productos, filtroCategoria, filtroEstado, busqueda, ordenAscendente]);

  const totalPaginas = Math.ceil(productosFiltrados.length / pageSize);
  const startIndex = (paginaActual - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const productosPagina = productosFiltrados.slice(startIndex, endIndex);

  const toggleDetalles = (id: number) => {
    setDetallesAbiertos(detallesAbiertos === id ? null : id);
  };

  const cambiarPagina = (num: number) => {
    if (num < 1) num = 1;
    if (num > totalPaginas) num = totalPaginas;
    setPaginaActual(num);
    setDetallesAbiertos(null);
  };

  // Reiniciar página si filtros o búsqueda cambian
  useEffect(() => {
    setPaginaActual(1);
  }, [filtroCategoria, filtroEstado, busqueda, pageSize]);

  return (
    <div className="flex flex-col h-screen bg-white shadow rounded-lg border border-gray-200">
      {/* Filtros */}
      <div className="flex gap-4 px-4 py-2 border-b border-gray-200 flex-shrink-0 bg-white">
        <div className="flex items-center gap-2">
          <label>Categoría:</label>
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="border rounded p-1 bg-white text-gray-800"
          >
            <option value="Todos">Todos</option>
            <option value="Sol">Sol</option>
            <option value="Truper">Truper</option>
            <option value="Otros">Otros</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label>Estado:</label>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="border rounded p-1 bg-white text-gray-800"
          >
            <option value="Todos">Todos</option>
            <option value="Disponible">Disponible</option>
            <option value="Agotado">Agotado</option>
            <option value="Para pedir">Para pedir</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label>Ordenar:</label>
          <button
            onClick={() =>
              setOrdenAscendente(ordenAscendente === null ? true : ordenAscendente ? false : null)
            }
            className="border rounded px-2 py-1 bg-white text-gray-800 hover:bg-gray-200"
          >
            {ordenAscendente === null
              ? "Sin ordenar"
              : ordenAscendente
              ? "A → Z"
              : "Z → A"}
          </button>
        </div>
      </div>

      {/* Encabezado de tabla */}
      <div
        className="grid px-4 py-2 bg-blue-600 text-white font-semibold flex-shrink-0"
        style={{ gridTemplateColumns: "1fr 3fr 1fr 1fr 1fr 1fr" }}
      >
        <div>Clave</div>
        <div>Descripción</div>
        <div>Costo</div>
        <div>Precio</div>
        <div>Precio Individual</div>
        <div className="text-center">Acciones</div>
      </div>

      {/* Lista virtualizada */}
      <div className="flex-1 overflow-hidden">
        {productosFiltrados.length === 0 ? (
          <p className="text-gray-500 mt-6 text-center">No hay productos que coincidan.</p>
        ) : (
          <Virtuoso
            data={productosPagina}
            itemContent={(index, producto) => {
              const abierto = detallesAbiertos === producto.id;
              return (
                <div
                  key={producto.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition"
                  style={{ minHeight: ROW_HEIGHT }}
                >
                  <div
                    className="grid px-4 py-2 items-start"
                    style={{ gridTemplateColumns: "1fr 3fr 1fr 1fr 1fr 1fr" }}
                  >
                    <div>{producto.clave}</div>
                    <div className="break-words">{producto.descripcion}</div>
                    <div>${Number(producto.costo).toFixed(2)}</div>
                    <div>${Number(producto.precio).toFixed(2)}</div>
                    <div>${Number(producto.precio_individual).toFixed(2)}</div>

                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => onEditar(producto)}
                        className="bg-gray-300 text-blue-600 hover:bg-gray-400 p-1.5 rounded transition"
                        title="Editar"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => onEliminar(producto.id)}
                        className="bg-gray-300 text-red-500 hover:bg-gray-400 p-1.5 rounded transition"
                        title="Eliminar"
                      >
                        <Trash size={18} />
                      </button>
                      <button
                        onClick={() => toggleDetalles(producto.id)}
                        className="bg-gray-300 text-gray-600 hover:bg-gray-400 p-1.5 rounded transition"
                        title="Ver más detalles"
                      >
                        {abierto ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </div>
                  </div>

                  {abierto && (
                    <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 text-sm text-gray-700">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <p>
                          <strong>Código de Barras:</strong> {producto.codigo_barras || "N/A"}
                        </p>
                        <p>
                          <strong>Existencia:</strong> {producto.existencia}
                        </p>
                        <p>
                          <strong>Existencia Mínima:</strong> {producto.existencia_min}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            }}
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
            <option value={100}>100</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default InventarioTable;
