import React, { useEffect, useMemo, useState } from "react";
import { FiShoppingCart, FiDollarSign, FiSearch, FiRefreshCw } from "react-icons/fi";
import SearchBarVenta from "../components/SearchBarVenta";
import VentaTable from "../components/VentaTable";
import ResumenVenta from "../components/ResumenVenta";
import type { Producto } from "../types/Producto";
import type { DetalleVentaDTO, VentaDTO, VentaResponse, ProductoLowStock } from "../types/Venta";
import { crearVenta } from "../api/ventas";
import { obtenerProductos } from "../api/productos";
import axios from "axios";

const VentasPage: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cart, setCart] = useState<DetalleVentaDTO[]>([]);
  const [cargoExtra, setCargoExtra] = useState<number>(0);
  const [pagoCon, setPagoCon] = useState<number | undefined>(undefined);
  const [lowStock, setLowStock] = useState<ProductoLowStock[]>([]);
  const [focusCounter, setFocusCounter] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const prods = await obtenerProductos();
        setProductos(prods);
      } catch (err) {
        console.error("Error cargando productos", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const subtotal = useMemo(() => {
    const val = cart.reduce((s, d) => {
      const precioActivo = d.usarPrecioIndividual ? d.precioIndividual : d.precio;
      return s + precioActivo * d.cantidad;
    }, 0);
    return isNaN(val) ? 0 : val;
  }, [cart]);

  const total = subtotal + (isNaN(cargoExtra) ? 0 : cargoExtra ?? 0);

  const addProduct = (p: Producto, cantidad = 1) => {
    setCart(prev => {
      const idx = prev.findIndex(x => x.producto_id === p.id);
      const precioIndividualValido = p.precio_individual != null && p.precio_individual > 0;

      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], cantidad: copy[idx].cantidad + cantidad };
        return copy;
      }

      return [
        ...prev, 
        { 
          producto_id: p.id, 
          cantidad, 
          precio: p.precio ?? 0, 
          precioIndividual: p.precio_individual ?? p.precio ?? 0,
          usarPrecioIndividual: precioIndividualValido
        }
      ];
    });
  };

  // 🔹 AGREGAR AUTO-FOCUS AL ELIMINAR PRODUCTO
  const removeLine = (productoId: number) => {
    setCart(prev => prev.filter(p => p.producto_id !== productoId));
    setFocusCounter(prev => prev + 1);
  };

  const changeQty = (productoId: number, cantidad: number) => {
    if (cantidad <= 0) return;
    setCart(prev => prev.map(p => p.producto_id === productoId ? { ...p, cantidad } : p));
  };

  const togglePrecioIndividual = (productoId: number, usarIndividual: boolean) => {
    setCart(prev => prev.map(d => d.producto_id === productoId ? { ...d, usarPrecioIndividual: usarIndividual } : d));
  };


  const onConfirmVenta = async () => {
    if (cart.length === 0) {
      alert("Agrega productos al carrito antes de confirmar la venta");
      return;
    }

    setProcessing(true);
    try {
      const payload: VentaDTO = {
        detalles: cart.map(d => ({
          producto_id: d.producto_id,
          cantidad: d.cantidad,
          precio: d.usarPrecioIndividual ? d.precioIndividual : d.precio,
          precioIndividual: d.precioIndividual
        })),
        cargo_extra: cargoExtra,
        pago_con: pagoCon ?? 0,
        total
      };
      const resp: VentaResponse = await crearVenta(payload);
      setLowStock(resp.lowStock ?? []);
      setCart([]);
      setCargoExtra(0);
      setPagoCon(undefined);
      alert("✅ Venta registrada exitosamente (ID: " + (resp.venta?.id ?? "N/A") + ")");
      setFocusCounter(prev => prev + 1);
    } catch (err: unknown) {
      console.error("Error guardando venta", err);
      let message = "Error desconocido";
      if (axios.isAxiosError(err)) message = err.response?.data?.message ?? err.message;
      else if (err instanceof Error) message = err.message;
      alert("❌ Error: " + message);
      setFocusCounter(prev => prev + 1);
    } finally {
      setProcessing(false);
    }
  };

  // 🔹 AGREGAR AUTO-FOCUS AL VACIAR CARRITO Y CAMBIAR COLOR DEL BOTÓN
  const clearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm(`¿Estás seguro de vaciar el carrito? Se eliminarán ${cart.length} producto(s).`)) {
      setCart([]);
      setCargoExtra(0);
      setPagoCon(undefined);
      setFocusCounter(prev => prev + 1);
    }
  };

  if (loading) {
    return (
      <div className="p-6 h-screen flex items-center justify-center">
        <div className="text-center">
          <FiRefreshCw className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando sistema de ventas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 grid grid-cols-1 xl:grid-cols-[1.2fr_1.8fr_1.4fr] gap-6 h-screen bg-gradient-to-br from-gray-400 to-blue-300/60">
      {/* Header Móvil */}
      <div className="xl:hidden bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-4">
        <h1 className="text-2xl font-bold text-gray-800 text-center">Sistema de Ventas</h1>
        <div className="flex justify-between items-center mt-3 text-sm text-gray-600">
          <span>{cart.length} producto(s) en carrito</span>
          <span className="font-semibold text-green-600">Total: ${total.toFixed(2)}</span>
        </div>
      </div>

      {/* Panel de Búsqueda */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-xl text-gray-800 flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
              <FiSearch size={20} />
            </div>
            Escanear / Buscar
          </h2>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              // 🔹 CAMBIAR COLOR DEL BOTÓN A GRIS CLARO
              className="text-sm text-red-600 hover:text-red-700 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-lg transition-colors border border-gray-300"
            >
              Vaciar carrito
            </button>
          )}
        </div>
        
        <div className="flex-1">
          <SearchBarVenta 
            onProductoSelect={(p) => addProduct(p, 1)} 
            focusCounter={focusCounter} 
          />
        </div>

        {/* Información de productos cargados */}
        <div className="mt-6 p-3 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-800">{productos.length}</span> productos cargados
          </p>
        </div>
      </div>

      {/* Panel del Carrito */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-xl text-gray-800 flex items-center gap-3">
            <div className="p-2 bg-green-100 text-green-600 rounded-xl">
              <FiShoppingCart size={20} />
            </div>
            Carrito de Venta
          </h2>
          <div className="flex items-center gap-2">
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          <VentaTable
            cart={cart}
            productos={productos}
            onCantidadChange={changeQty}
            onRemove={removeLine}
            onTogglePrecioIndividual={togglePrecioIndividual}
            onFocusSearch={() => setFocusCounter(prev => prev + 1)} // 🔹 NUEVO: AUTO-FOCUS PARA BOTONES +/-
          />
        </div>

        {/* Resumen rápido */}
        <div className="mt-6 space-y-3 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center text-lg">
            <span className="text-gray-600 font-medium">Subtotal:</span>
            <span className="font-semibold text-gray-800">${subtotal.toFixed(2)}</span>
          </div>
          {cargoExtra > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Cargo extra:</span>
              <span className="text-gray-700">+${cargoExtra.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Panel de Cobro - MÁS ANCHO */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col">
        <h2 className="font-bold text-xl text-gray-800 flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 text-purple-600 rounded-xl">
            <FiDollarSign size={20} />
          </div>
          Procesar Pago
        </h2>
        
        <div className="flex-1">
          <ResumenVenta
            subtotal={subtotal}
            cargoExtra={cargoExtra}
            setCargoExtra={setCargoExtra}
            total={total}
            pagoCon={pagoCon}
            setPagoCon={setPagoCon}
            onConfirmVenta={onConfirmVenta}
            lowStock={lowStock}
            processing={processing}
            cartCount={cart.length}
            onFocusSearch={() => setFocusCounter(prev => prev + 1)} // 🔹 AGREGAR ESTA LÍNEA
          />
        </div>

        {/* Información adicional */}
        <div className="mt-6 space-y-2 text-xs text-gray-500">
          {processing && (
            <div className="flex items-center gap-2 text-blue-600 font-medium">
              <FiRefreshCw className="animate-spin" size={14} />
              <span>Procesando venta...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VentasPage;