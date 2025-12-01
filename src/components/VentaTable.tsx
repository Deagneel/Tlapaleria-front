import React from "react";
import type { DetalleVentaDTO } from "../types/Venta";
import type { Producto } from "../types/Producto";
import { FiTrash2, FiMinus, FiPlus, FiDollarSign, FiPackage, FiBox } from "react-icons/fi";

interface Props {
  cart: DetalleVentaDTO[];
  productos: Producto[];
  onCantidadChange: (productoId: number, cantidad: number) => void;
  onRemove: (productoId: number) => void;
  onTogglePrecioIndividual: (productoId: number, usarIndividual: boolean) => void;
  onToggleVentaPorUnidad: (productoId: number, venderPorUnidad: boolean) => void;
  onFocusSearch?: () => void;
}

const calcularPrecioActivo = (detalle: DetalleVentaDTO, producto?: Producto): number => {
  if (!producto) return detalle.precio;
  
  const esProductoEmpaquetado = producto.es_producto_paquete ?? false;
  
  if (esProductoEmpaquetado) {
    if (detalle.vender_por_unidad) {
      return producto.precio_individual ?? detalle.precioIndividual;
    }
    return detalle.precio;
  } else {
    if (detalle.usarPrecioIndividual) {
      return detalle.precioIndividual;
    }
    return detalle.precio;
  }
};

const VentaTable: React.FC<Props> = ({ 
  cart, 
  productos, 
  onCantidadChange, 
  onRemove, 
  onTogglePrecioIndividual,
  onToggleVentaPorUnidad,
  onFocusSearch 
}) => {
  const findProd = (id: number) => productos.find(p => p.id === id);

  const formatearExistencia = (producto: Producto | undefined): string => {
    if (!producto) return "0 unidades";
    
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

  const ajustarCantidad = (productoId: number, cambio: number) => {
    const detalle = cart.find(d => d.producto_id === productoId);
    if (detalle) {
      const nuevaCantidad = Math.max(0.01, detalle.cantidad + cambio);
      onCantidadChange(productoId, nuevaCantidad);
    }
    if (onFocusSearch) {
      setTimeout(() => onFocusSearch(), 50);
    }
  };

  const handleCantidadChange = (productoId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0.01) {
      onCantidadChange(productoId, value);
    }
  };

  const handleRemove = (productoId: number) => {
    onRemove(productoId);
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
        
        const precioActivo = calcularPrecioActivo(d, producto);
        const subtotal = precioActivo * d.cantidad;

        return (
          <div
            key={d.producto_id}
            className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-all duration-150"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-1">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-800 text-sm truncate pr-2">
                      {producto?.descripcion ?? "Producto no encontrado"}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-xs text-gray-600">
                        #{producto?.clave ?? "N/A"}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <FiBox size={10} />
                        {formatearExistencia(producto)}
                      </span>
                    </div>
                    
                    {producto?.es_producto_paquete && (
                      <div className="mt-1 flex items-center gap-1">
                        <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded text-xs border border-orange-200 flex items-center gap-1">
                          <FiPackage size={10} />
                          {producto.piezas_por_paquete} pz/paq
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right shrink-0">
                    <div className="font-semibold text-green-600 text-sm">${precioActivo.toFixed(2)}</div>
                    <div className="font-bold text-gray-800 text-xs">${subtotal.toFixed(2)}</div>
                  </div>
                </div>

                {producto?.es_producto_paquete && (
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={() => onToggleVentaPorUnidad(d.producto_id, !d.vender_por_unidad)}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                        d.vender_por_unidad 
                          ? "bg-orange-100 text-orange-700 border border-orange-300" 
                          : "bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-200"
                      }`}
                    >
                      <FiPackage size={10} />
                      <span>{d.vender_por_unidad ? 'Por pieza' : 'Por paquete'}</span>
                    </button>
                    <span className="text-xs text-gray-500">
                      {d.vender_por_unidad 
                        ? `$${producto.precio_individual?.toFixed(2) ?? '0.00'}/pz` 
                        : `$${producto.precio?.toFixed(2) ?? '0.00'}/paq`}
                    </span>
                  </div>
                )}

                {producto && !producto.es_producto_paquete && tienePrecioIndividual && (
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
                      ${producto.precio_individual?.toFixed(2) ?? '0.00'} vs ${producto.precio?.toFixed(2) ?? '0.00'}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
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
                    step={producto?.es_producto_paquete && d.vender_por_unidad ? "0.01" : "1"}
                    min="0.01"
                    value={d.cantidad}
                    onChange={(e) => handleCantidadChange(d.producto_id, e)}
                    onFocus={(e) => e.target.select()}
                    className="w-12 text-center bg-white border-none focus:outline-none font-semibold text-sm text-gray-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    onClick={() => ajustarCantidad(d.producto_id, 1)}
                    className="p-1 rounded bg-white hover:bg-blue-100 transition-colors text-blue-600 border border-blue-300"
                    title="Aumentar cantidad"
                  >
                    <FiPlus size={12} />
                  </button>
                </div>

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