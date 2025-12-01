import React, { useEffect, useRef, useState } from "react";
import type { Producto } from "../types/Producto";
import { obtenerProductos } from "../api/productos";
import { FiSearch, FiX, FiAlertCircle, FiBox, FiPackage } from "react-icons/fi";

interface Props {
  onProductoSelect: (p: Producto) => void;
  focusCounter?: number;
}

const SearchBarVenta: React.FC<Props> = ({ onProductoSelect, focusCounter }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Producto[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-focus mejorado
  useEffect(() => { 
    inputRef.current?.focus(); 
  }, []);

  useEffect(() => { 
    if (focusCounter !== undefined) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [focusCounter]);

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    const value = e.currentTarget.value.trim();
    if (!value) return;

    setLoading(true);
    try {
      const prods = await obtenerProductos();
      let found = prods.find(p => (p.codigo_barras ?? "") === value);
      if (!found) {
        found = prods.find(p => p.clave === value || p.clave?.slice(1) === value);
      }

      if (found) {
        onProductoSelect(found);
        setQuery("");
        setResults([]);
        setNotFound(false);
        // Auto-focus y selección después de agregar producto
        setTimeout(() => {
          inputRef.current?.focus();
          inputRef.current?.select();
        }, 50);
        return;
      }

      const filtered = prods.filter(p =>
        p.clave.toLowerCase().includes(value.toLowerCase()) ||
        p.descripcion.toLowerCase().includes(value.toLowerCase())
      );

      if (filtered.length > 0) { 
        setResults(filtered.slice(0, 15)); 
        setNotFound(false); 
      } else { 
        setResults([]); 
        setNotFound(true); 
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => { 
    setQuery(""); 
    setResults([]); 
    setNotFound(false); 
    // Auto-focus después de limpiar
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 50);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { 
    setQuery(e.target.value); 
    setNotFound(false); 
    if (e.target.value.trim() === "") setResults([]); 
  };

  const handleProductClick = (producto: Producto) => {
    onProductoSelect(producto);
    setResults([]);
    setQuery("");
    setNotFound(false);
    // Auto-focus después de seleccionar producto
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 50);
  };

  return (
    <div className="relative">
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          ref={inputRef}
          placeholder="Código de barras, clave o descripción..."
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-gray-900 placeholder-gray-500"
          onKeyDown={handleKeyDown}
          aria-label="scanner-input"
          value={query}
          onChange={handleChange}
          disabled={loading}
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            aria-label="Borrar búsqueda"
          >
            <FiX size={16} />
          </button>
        )}
        {loading && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {(results.length > 0 || notFound) && (
        <div className="absolute z-20 left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-auto animate-fadeIn">
          {notFound ? (
            <div className="flex items-center gap-3 p-4 text-red-700 bg-red-50 rounded-xl">
              <FiAlertCircle size={18} />
              <div>
                <div className="font-medium">Producto no encontrado</div>
                <div className="text-sm text-red-600">Intenta con otro código o descripción</div>
              </div>
            </div>
          ) : (
            <div className="p-2">
              {results.map((producto) => (
                <div
                  key={producto.id}
                  className="p-3 hover:bg-blue-50 cursor-pointer transition-all duration-200 rounded-lg mb-1 border border-transparent hover:border-blue-200"
                  onClick={() => handleProductClick(producto)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-800 truncate">{producto.descripcion}</div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span className="font-mono bg-gray-100 px-2 py-1 rounded">#{producto.clave}</span>
                          <span className="flex items-center gap-1">
                            <FiBox size={12} />
                            {producto.es_producto_paquete 
                              ? `${producto.existencia ?? 0} paq.` 
                              : `${producto.existencia ?? 0} exist.`
                            }
                          </span>
                          <span className="font-semibold text-green-600">${(producto.precio ?? 0).toFixed(2)}</span>
                          {/* 🔥 INDICADOR DE PRODUCTO EMPAQUETADO */}
                          {producto.es_producto_paquete && (
                            <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded text-xs border border-orange-200 flex items-center gap-1">
                              <FiPackage size={10} />
                              {producto.piezas_por_paquete}pz
                            </span>
                          )}
                        </div>
                    </div>
                    {producto.codigo_barras && (
                      <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded ml-2">
                        {producto.codigo_barras}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBarVenta;