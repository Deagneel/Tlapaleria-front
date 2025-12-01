import React, { useState, useMemo, useEffect } from "react";
import { Virtuoso } from "react-virtuoso";
import { ChevronDown, ChevronUp, Edit, Trash, PlusCircle, Package, Filter, SortAsc, SortDesc } from "lucide-react";
import type { Producto } from "../types/Producto";

interface Props {
  productos: Producto[];
  onEditar: (producto: Producto) => void;
  onEliminar: (id: number) => void;
  onAgregarAPedido: (producto: Producto) => void; 
  busqueda: string;
}

const ROW_HEIGHT = 60;
const DEFAULT_PAGE_SIZE = 20;

const InventarioTable: React.FC<Props> = ({ productos, onEditar, onEliminar, onAgregarAPedido, busqueda }) => {
  const [detallesAbiertos, setDetallesAbiertos] = useState<number | null>(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [filtroCategoria, setFiltroCategoria] = useState<string>("Todos");
  const [filtroEstado, setFiltroEstado] = useState<string>("Todos");
  const [ordenAscendente, setOrdenAscendente] = useState<boolean | null>(null);

  const categoriaPorClave = (clave: string) => {
    if (!clave) return "Otros";
    const letra = clave[0].toUpperCase();
    if (["D", "I"].includes(letra)) return "Sol";
    if (["V", "T", "P", "K", "F", "H"].includes(letra)) return "Truper";
    if (["A", "a"].includes(letra)) return "Almasava";
    if (["S", "s"].includes(letra)) return "Ferre servicio";
    if (["M", "m"].includes(letra)) return "Tepalcates";
    if (["G", "g"].includes(letra)) return "Casa Gabo";
    if (["C", "c"].includes(letra)) return "Iluminación C.";
    return "Otros";
  };

  const calcularExistenciaReal = (producto: Producto): number => {
    if (producto.es_producto_paquete) {
      return ((producto.existencia ?? 0) * (producto.piezas_por_paquete ?? 1)) + (producto.piezas_individuales ?? 0);
    }
    return producto.existencia ?? 0;
  };

  const formatearExistencia = (producto: Producto): string => {
    if (producto.es_producto_paquete) {
      const paquetes = producto.existencia ?? 0;
      const piezasIndividuales = producto.piezas_individuales ?? 0;
      
      if (paquetes > 0 && piezasIndividuales > 0) {
        return `${paquetes} paq. + ${piezasIndividuales} pz.`;
      } else if (paquetes > 0) {
        return `${paquetes} paquetes`;
      } else {
        return `${piezasIndividuales} piezas`;
      }
    }
    return `${producto.existencia ?? 0} ${producto.unidad || 'unidades'}`;
  };

  const productosFiltrados = useMemo(() => {
    const filtrados = productos
      .filter((p) => filtroCategoria === "Todos" || categoriaPorClave(p.clave) === filtroCategoria)
      .filter((p) => {
        if (filtroEstado === "Disponible") return (p.existencia ?? 0) > 0;
        if (filtroEstado === "Agotado") return (p.existencia ?? 0) <= 0;
        if (filtroEstado === "Para pedir") return (p.existencia ?? 0) <= (p.existencia_min ?? 0);
        return true;
      })
      .filter((p) => {
        if (!busqueda) return true;
        const texto = busqueda.toLowerCase();
        return (
          p.clave.toLowerCase().includes(texto) ||
          p.descripcion.toLowerCase().includes(texto) ||
          (p.codigo_barras && p.codigo_barras.toLowerCase().includes(texto))
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

  useEffect(() => {
    setPaginaActual(1);
  }, [filtroCategoria, filtroEstado, busqueda, pageSize]);

  // Función para formatear currency
  const formatCurrency = (n: number) => 
    n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="flex flex-col h-screen bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header con Filtros */}
      <div className="flex flex-wrap gap-4 px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-blue-100 rounded-lg">
            <Filter size={16} className="text-blue-600" />
          </div>
          <label className="text-sm font-medium text-gray-700">Categoría:</label>
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="border border-gray-300 rounded-xl px-3 py-2 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
          >
            <option value="Todos">Todas las categorías</option>
            <option value="Sol">Sol</option>
            <option value="Truper">Truper</option>
            <option value="Almasava">Almasava</option>
            <option value="Ferre servicio">Ferre servicio</option>
            <option value="Tepalcates">Tepalcates</option>
            <option value="Casa Gabo">Casa Gabo</option>
            <option value="Iluminación C.">Iluminación C.</option>
            <option value="Otros">Otros</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-green-100 rounded-lg">
            <Package size={16} className="text-green-600" />
          </div>
          <label className="text-sm font-medium text-gray-700">Estado:</label>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="border border-gray-300 rounded-xl px-3 py-2 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
          >
            <option value="Todos">Todos los estados</option>
            <option value="Disponible">Disponible</option>
            <option value="Agotado">Agotado</option>
            <option value="Para pedir">Para pedir</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-purple-100 rounded-lg">
            {ordenAscendente === true ? <SortAsc size={16} className="text-purple-600" /> : 
             ordenAscendente === false ? <SortDesc size={16} className="text-purple-600" /> : 
             <SortAsc size={16} className="text-purple-400" />}
          </div>
          <button
            onClick={() =>
              setOrdenAscendente(ordenAscendente === null ? true : ordenAscendente ? false : null)
            }
            className="flex items-center gap-2 border border-gray-300 rounded-xl px-4 py-2 bg-white text-gray-800 hover:bg-gray-50 transition-all duration-200 text-sm font-medium"
          >
            {ordenAscendente === null
              ? "Sin ordenar"
              : ordenAscendente
              ? "A → Z"
              : "Z → A"}
          </button>
        </div>

        {/* Contador de resultados */}
        <div className="ml-auto flex items-center gap-2">
          <div className="p-1.5 bg-gray-100 rounded-lg">
            <Package size={16} className="text-gray-600" />
          </div>
          <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full border border-gray-200">
            {productosFiltrados.length} productos
          </span>
        </div>
      </div>

      {/* Encabezado de la tabla */}
      <div
        className="grid px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold text-sm"
        style={{ gridTemplateColumns: "1fr 3fr 1.2fr 1.2fr 1.2fr 1.5fr" }}
      >
        <div className="flex items-center gap-2">
          <div className="p-1 bg-white/20 rounded">
            <Package size={14} />
          </div>
          Clave
        </div>
        <div>Descripción</div>
        <div className="text-center pr-4">Costo</div>
        <div className="text-center pr-4">Precio</div>
        <div className="text-center pr-4">Unidad</div>
        <div className="text-center">Acciones</div>
      </div>

      {/* Lista de productos */}
      <div className="flex-1 overflow-hidden bg-white">
        {productosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <Package size={48} className="text-gray-300 mb-3" />
            <p className="text-lg font-medium">No hay productos que coincidan</p>
            <p className="text-sm">Intenta ajustar los filtros o la búsqueda</p>
          </div>
        ) : (
          <Virtuoso
            data={productosPagina}
            itemContent={(index, producto) => {
              const abierto = detallesAbiertos === producto.id;
              const bajoMinimo = (producto.existencia ?? 0) <= (producto.existencia_min ?? 0);
              const agotado = (producto.existencia ?? 0) <= 0;
              
              return (
                <div
                  key={producto.id}
                  className={`border-b border-gray-100 transition-all duration-200 ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-100"  // Cambiado a gris más notorio
                  } hover:bg-blue-50 ${abierto ? 'bg-blue-25' : ''}`}
                  style={{ minHeight: ROW_HEIGHT }}
                >
                  <div
                    className="grid px-6 py-3 items-center"
                    style={{ gridTemplateColumns: "1fr 3fr 1.2fr 1.2fr 1.2fr 1.5fr" }}
                  >
                    <div className="font-mono font-medium text-gray-900">
                      {producto.clave}
                    </div>
                    <div className="break-words text-gray-800">
                      {producto.descripcion}
                    </div>

                    <div className="text-right pr-5 font-medium text-gray-700">
                      ${formatCurrency(Number(producto.costo))}
                    </div>
                    <div className="text-right pr-5 font-semibold text-green-600">
                      ${formatCurrency(Number(producto.precio))}
                    </div>
                    <div className="text-right pr-5 font-medium text-blue-600">
                      ${formatCurrency(Number(producto.precio_individual))}
                    </div>

                    <div className="flex justify-center gap-2 ml-8">
                      <button
                        onClick={() => onEditar(producto)}
                        className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-xl transition-all duration-200 hover:scale-110"
                        title="Editar producto"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => onEliminar(producto.id)}
                        className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-xl transition-all duration-200 hover:scale-110"
                        title="Eliminar producto"
                      >
                        <Trash size={18} />
                      </button>
                      <button
                        onClick={() => onAgregarAPedido(producto)}
                        className="p-2 bg-green-100 text-green-600 hover:bg-green-200 rounded-xl transition-all duration-200 hover:scale-110"
                        title="Agregar a pedido pendiente"
                      >
                        <PlusCircle size={18} />
                      </button>
                      <button
                        onClick={() => toggleDetalles(producto.id)}
                        className={`p-2 rounded-xl transition-all duration-200 hover:scale-110 ${
                          abierto ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title="Ver más detalles"
                      >
                        {abierto ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </div>
                  </div>

                  {abierto && (
                    <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-t border-gray-200 px-6 py-4 text-sm text-gray-700">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Código de Barras:</span>
                          <span className="bg-white px-2 py-1 rounded border border-gray-200 font-mono">
                            {producto.codigo_barras || "N/A"}
                          </span>
                        </div>
                        
                        {/* 🔥 EXISTENCIA ACTUALIZADA */}
                        <div className={`flex items-center gap-2 ${agotado ? 'text-red-600 font-semibold' : ''}`}>
                          <span className="font-semibold">Existencia:</span>
                          <span className="bg-white px-2 py-1 rounded border border-gray-200">
                            {formatearExistencia(producto)}
                            {producto.es_producto_paquete && (
                              <span className="text-xs text-gray-500 ml-1">
                                ({calcularExistenciaReal(producto)} total)
                              </span>
                            )}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Existencia Mínima:</span>
                          <span className="bg-white px-2 py-1 rounded border border-gray-200">
                            {producto.es_producto_paquete 
                              ? `${producto.existencia_min} paquetes` 
                              : producto.existencia_min
                            }
                          </span>
                        </div>
                        
                        <div className={`flex items-center gap-2 ${bajoMinimo ? 'text-orange-600 font-semibold' : 'text-green-600'}`}>
                          <span className="font-semibold">Estado:</span>
                          <span className="bg-white px-2 py-1 rounded border border-gray-200">
                            {agotado ? 'Agotado' : bajoMinimo ? 'Bajo mínimo' : 'Disponible'}
                          </span>
                        </div>

                        {/* 🔥 NUEVA FILA: Tipo de producto */}
                        {producto.es_producto_paquete && (
                          <div className="flex items-center gap-2 col-span-2">
                            <span className="font-semibold">Tipo:</span>
                            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded border border-orange-200 text-xs font-medium">
                              Producto Empaquetado ({producto.piezas_por_paquete} pz/paq)
                            </span>
                          </div>
                        )}
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
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => cambiarPagina(1)}
            disabled={paginaActual === 1}
            className="p-2 border border-gray-300 rounded-xl bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            title="Primera página"
          >
            {"<<"}
          </button>
          <button
            onClick={() => cambiarPagina(paginaActual - 1)}
            disabled={paginaActual === 1}
            className="p-2 border border-gray-300 rounded-xl bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            title="Página anterior"
          >
            {"<"}
          </button>
          <span className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm font-medium">
            Página {paginaActual} de {totalPaginas}
          </span>
          <button
            onClick={() => cambiarPagina(paginaActual + 1)}
            disabled={paginaActual === totalPaginas}
            className="p-2 border border-gray-300 rounded-xl bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            title="Página siguiente"
          >
            {">"}
          </button>
          <button
            onClick={() => cambiarPagina(totalPaginas)}
            disabled={paginaActual === totalPaginas}
            className="p-2 border border-gray-300 rounded-xl bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            title="Última página"
          >
            {">>"}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Filas por página:</label>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="border border-gray-300 rounded-xl px-3 py-2 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
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