import React from "react";
import type { DetalleVentaDTO } from "../types/Venta";
import type { Producto } from "../types/Producto";
import { FiTrash2, FiMinus, FiPlus, FiDollarSign } from "react-icons/fi";

interface Props {
  cart: DetalleVentaDTO[];
  productos: Producto[];
  onCantidadChange: (productoId: number, cantidad: number) => void;
  onRemove: (productoId: number) => void;
  onTogglePrecioIndividual: (productoId: number, usarIndividual: boolean) => void;
  onFocusSearch?: () => void; // 🔹 NUEVA PROP PARA AUTO-FOCUS
}

const VentaTable: React.FC<Props> = ({ 
  cart, 
  productos, 
  onCantidadChange, 
  onRemove, 
  onTogglePrecioIndividual,
  onFocusSearch 
}) => {
  const findProd = (id: number) => productos.find(p => p.id === id);

  const ajustarCantidad = (productoId: number, cambio: number) => {
    const detalle = cart.find(d => d.producto_id === productoId);
    if (detalle) {
      const nuevaCantidad = Math.max(1, detalle.cantidad + cambio);
      onCantidadChange(productoId, nuevaCantidad);
    }
    // 🔹 AUTO-FOCUS DESPUÉS DE AJUSTAR CANTIDAD
    if (onFocusSearch) {
      setTimeout(() => onFocusSearch(), 50);
    }
  };

  const handleCantidadChange = (productoId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    onCantidadChange(productoId, Number(e.target.value));
  };

  const handleRemove = (productoId: number) => {
    onRemove(productoId);
    // 🔹 AUTO-FOCUS DESPUÉS DE ELIMINAR
    if (onFocusSearch) {
      setTimeout(() => onFocusSearch(), 50);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-400">
        <div className="text-4xl mb-2">🛒</div>
        <p className="text-sm font-medium text-gray-500">Carrito vacío</p>
        <p className="text-xs mt-1">Agrega productos usando la búsqueda</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {cart.map(d => {
        const producto = findProd(d.producto_id);
        const tienePrecioIndividual = (producto?.precio_individual ?? 0) > 0;
        const precioActivo = d.usarPrecioIndividual && tienePrecioIndividual 
          ? (producto?.precio_individual ?? 0) 
          : (producto?.precio ?? 0);
        const subtotal = precioActivo * d.cantidad;

        return (
          <div
            key={d.producto_id}
            className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-all duration-150"
          >
            <div className="flex items-center justify-between gap-3">
              {/* Información del producto */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-1">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-800 text-sm truncate pr-2">
                      {producto?.descripcion ?? "—"}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-xs text-gray-600">
                        {producto?.clave}
                      </span>
                      <span className="text-xs text-gray-500">
                        {d.cantidad} unid.
                      </span>
                    </div>
                  </div>
                  
                  {/* Precio y subtotal */}
                  <div className="text-right shrink-0">
                    <div className="font-semibold text-green-600 text-sm">${precioActivo.toFixed(2)}</div>
                    <div className="font-bold text-gray-800 text-xs">${subtotal.toFixed(2)}</div>
                  </div>
                </div>

                {/* Toggle precio individual */}
                {tienePrecioIndividual && (
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={() => onTogglePrecioIndividual(d.producto_id, !d.usarPrecioIndividual)}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                        d.usarPrecioIndividual 
                          ? "bg-green-100 text-green-700 border border-green-300" 
                          : "bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200"
                      }`}
                    >
                      <FiDollarSign size={10} />
                      <span>Individual</span>
                      {d.usarPrecioIndividual && (
                        <span className="ml-1">✓</span>
                      )}
                    </button>
                    <span className="text-xs text-gray-500">
                      ${producto?.precio_individual?.toFixed(2)} vs ${producto?.precio?.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {/* Controles de cantidad y acciones */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Controles de cantidad con fondo */}
                <div className="flex items-center gap-1 bg-blue-50 rounded-lg p-1 border border-blue-200">
                  <button
                    onClick={() => ajustarCantidad(d.producto_id, -1)}
                    className="p-1 rounded bg-white hover:bg-blue-100 transition-colors text-blue-600 border border-blue-300"
                    title="Disminuir cantidad"
                  >
                    <FiMinus size={12} />
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={d.cantidad}
                    onChange={(e) => handleCantidadChange(d.producto_id, e)}
                    onFocus={(e) => e.target.select()} // 🔹 SELECCIONAR TODO EL TEXTO AL HACER FOCUS
                    className="w-8 text-center bg-white border-none focus:outline-none font-semibold text-sm text-gray-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    onClick={() => ajustarCantidad(d.producto_id, 1)}
                    className="p-1 rounded bg-white hover:bg-blue-100 transition-colors text-blue-600 border border-blue-300"
                    title="Aumentar cantidad"
                  >
                    <FiPlus size={12} />
                  </button>
                </div>

                {/* Botón eliminar con fondo */}
                <button 
                  onClick={() => handleRemove(d.producto_id)}
                  className="p-1.5 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors border border-red-300"
                  title="Eliminar producto"
                >
                  <FiTrash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default VentaTable;