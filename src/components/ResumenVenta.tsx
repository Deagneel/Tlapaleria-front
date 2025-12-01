import React, { useState, useEffect, useRef } from "react";
import type { ProductoLowStock } from "../types/Venta";
import type { PedidoDTO } from "../types/Pedido";
import type { DetallePedidoInput } from "../api/pedidos";
import { FiAlertCircle, FiRefreshCw, FiDollarSign, FiPlus, FiMinus, FiX } from "react-icons/fi";
import { ClipboardPlus, Calculator, CreditCard } from "lucide-react";
import { obtenerPedidos, obtenerPedidoCompleto, agregarProductoAPedido } from "../api/pedidos";
import { obtenerProducto } from "../api/productos";
import { calcularCambio } from "../api/ventas";

interface Props {
  subtotal: number;
  cargoExtra: number;
  setCargoExtra: (v: number) => void;
  total: number;
  pagoCon?: number;
  setPagoCon: (v?: number) => void;
  onConfirmVenta: () => void;
  lowStock: ProductoLowStock[];
  processing?: boolean; 
  cartCount?: number;
  onFocusSearch?: () => void;
}

interface DesgloseCambio {
  cambio: number;
  desglose: Record<string, number>;
}

const ResumenVenta: React.FC<Props> = ({
  subtotal,
  cargoExtra,
  setCargoExtra,
  total,
  pagoCon,
  setPagoCon,
  onConfirmVenta,
  lowStock,
  processing = false, 
  cartCount = 0,
  onFocusSearch
}) => {
  const [mostrarSeleccionPedidos, setMostrarSeleccionPedidos] = useState(false);
  const [pedidoDestinoId, setPedidoDestinoId] = useState<number | null>(null);
  const [pedidosPendientes, setPedidosPendientes] = useState<PedidoDTO[]>([]);
  const [productoParaMover, setProductoParaMover] = useState<ProductoLowStock | null>(null);
  const [cantidadInput, setCantidadInput] = useState<string>("1");
  const [mostrarLowStock, setMostrarLowStock] = useState(true);
  const [mostrarDesgloseCambio, setMostrarDesgloseCambio] = useState(false);
  const [desgloseCambio, setDesgloseCambio] = useState<DesgloseCambio | null>(null);
  const cantidadInputRef = useRef<HTMLInputElement>(null);
  const cambio = pagoCon && pagoCon > 0 ? pagoCon - total : 0;

  const denominaciones = {
    "0.5": { emoji: "🪙", label: "50¢", type: "moneda" },
    "1": { emoji: "🪙", label: "$1", type: "moneda" },
    "2": { emoji: "🪙", label: "$2", type: "moneda" },
    "5": { emoji: "🪙", label: "$5", type: "moneda" },
    "10": { emoji: "💵", label: "$10", type: "billete" },
    "20": { emoji: "💵", label: "$20", type: "billete" },
    "50": { emoji: "💵", label: "$50", type: "billete" },
    "100": { emoji: "💵", label: "$100", type: "billete" },
    "200": { emoji: "💵", label: "$200", type: "billete" },
    "500": { emoji: "💵", label: "$500", type: "billete" }
  };

  const handleSimularCambio = async () => {
    if (!pagoCon || pagoCon <= 0) {
      alert("Ingresa un pago válido");
      return;
    }
    try {
      const data = await calcularCambio(total, pagoCon);
      setDesgloseCambio(data);
      setMostrarDesgloseCambio(true);
      if (onFocusSearch) {
        setTimeout(() => onFocusSearch(), 50);
      }
    } catch (err) {
      console.error(err);
      alert("No se pudo calcular cambio");
      if (onFocusSearch) {
        setTimeout(() => onFocusSearch(), 50);
      }
    }
  };


  const cerrarDesgloseCambio = () => {
    setMostrarDesgloseCambio(false);
    if (onFocusSearch) {
      setTimeout(() => onFocusSearch(), 50);
    }
  };

  const renderDesglose = () => {
    if (!desgloseCambio?.desglose) return null;

    const entries = Object.entries(desgloseCambio.desglose)
      .sort(([a], [b]) => parseFloat(b) - parseFloat(a));

    return (
      <div className="mt-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-56 overflow-y-auto"> 
          {entries.map(([denominacion, cantidad]) => {
            const denomInfo = denominaciones[denominacion as keyof typeof denominaciones] || 
                            { emoji: "💰", label: `$${denominacion}`, type: "otro" };
            
            return (
              <div 
                key={denominacion}
                className={`p-2 rounded-lg border text-center transition-all ${
                  denomInfo.type === "moneda" 
                    ? "bg-yellow-50 border-yellow-200" 
                    : "bg-green-50 border-green-200"
                }`}
              >
                <div className="text-xl mb-1">{denomInfo.emoji}</div> 
                <div className="font-bold text-gray-800 text-sm">{denomInfo.label}</div> 
                <div className={`font-semibold ${
                  denomInfo.type === "moneda" ? "text-yellow-600" : "text-green-600"
                }`}>
                  ×{cantidad}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  ${(parseFloat(denominacion) * cantidad).toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>
        
      </div>
    );
  };
  useEffect(() => {
    if (lowStock.length > 0) {
      const timer = setTimeout(() => {
        setMostrarLowStock(false);
      }, 5 * 60 * 1000);

      return () => clearTimeout(timer);
    }
  }, [lowStock.length]);

  useEffect(() => {
    if (lowStock.length > 0) {
      setMostrarLowStock(true);
    }
  }, [lowStock]);

  const handleAgregarPedido = async (producto: ProductoLowStock) => {
    setProductoParaMover(producto);
    try {
      const allPedidos = await obtenerPedidos();
      const pendientes = allPedidos.filter(
        (p) => (p.estado ?? "").toUpperCase() === "PENDIENTE" && p.id != null
      );
      if (pendientes.length === 0) return alert("No hay pedidos pendientes disponibles.");
      setPedidosPendientes(pendientes);
      setPedidoDestinoId(pendientes[0].id ?? null);
      setCantidadInput("1");
      setMostrarSeleccionPedidos(true);
    } catch (err) {
      console.error("Error obteniendo pedidos pendientes:", err);
      alert("No se pudieron obtener los pedidos pendientes.");
    }
  };

  const confirmarAgregarPedido = async () => {
    if (!productoParaMover || !pedidoDestinoId) return;
    try {
      const pedidoFull = await obtenerPedidoCompleto(pedidoDestinoId);
      const yaExiste = pedidoFull.detalles.some(
        (d: DetallePedidoInput) => d.producto_id === productoParaMover.producto_id
      );
      if (yaExiste) return alert("El producto ya existe en el pedido seleccionado.");
      const cantidadNum = Number(cantidadInput);
      const cantidad = !isNaN(cantidadNum) && cantidadNum > 0 ? cantidadNum : 1;
      const productoReal = await obtenerProducto(productoParaMover.producto_id);
      const detalle: DetallePedidoInput = {
        producto_id: productoParaMover.producto_id,
        cantidad,
        precio: Number(productoReal.costo ?? 0),
        recibido: false,
      };
      await agregarProductoAPedido(pedidoDestinoId, detalle);
      alert(`Se agregaron ${cantidad} unidades de "${productoParaMover.descripcion}" al pedido.`);
      setMostrarSeleccionPedidos(false);
      setProductoParaMover(null);
      setPedidoDestinoId(null);
      setCantidadInput("1");
      if (onFocusSearch) {
        setTimeout(() => onFocusSearch(), 50);
      }
    } catch (err) {
      console.error("Error agregando producto al pedido:", err);
      alert("No se pudo agregar el producto al pedido.");
    }
  };

  useEffect(() => {
    if (mostrarSeleccionPedidos && cantidadInputRef.current) {
      cantidadInputRef.current.focus();
      cantidadInputRef.current.select();
    }
  }, [mostrarSeleccionPedidos]);

  const ajustarCargoExtra = (incremento: number) => {
    setCargoExtra(Math.max(0, cargoExtra + incremento));
    if (onFocusSearch) {
      setTimeout(() => onFocusSearch(), 50);
    }
  };

  const ocultarLowStock = () => {
    setMostrarLowStock(false);
  };


  const isSimularCambioDisabled = processing || (cartCount === 0 && cargoExtra === 0) || !pagoCon || pagoCon <= 0;
  const isConfirmVentaDisabled = processing || (cartCount === 0 && cargoExtra === 0);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-semibold text-gray-900">${subtotal.toFixed(2)}</span>
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Cargo extra</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => ajustarCargoExtra(-1)}
              disabled={processing || cargoExtra <= 0}
              className="p-1 rounded bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300 transition-colors border border-gray-300 text-gray-900"
            >
              <FiMinus size={12} />
            </button>
            <input
              type="number"
              value={cargoExtra}
              onChange={(e) => setCargoExtra(e.target.value === "" ? 0 : Number(e.target.value))}
              onFocus={(e) => e.target.select()}
              className="w-16 px-2 py-1 border border-gray-300 rounded text-right text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              disabled={processing}
            />
            <button
              onClick={() => ajustarCargoExtra(1)}
              disabled={processing}
              className="p-1 rounded bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300 transition-colors border border-gray-300 text-gray-900"
            >
              <FiPlus size={12} />
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
          <span className="font-bold text-gray-800">Total</span>
          <span className="font-bold text-green-600 text-lg">${total.toFixed(2)}</span>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
          <FiDollarSign size={12} />
          Pago recibido
        </label>
        <input
          type="number"
          value={pagoCon ?? ""}
          onChange={(e) => setPagoCon(e.target.value ? Number(e.target.value) : undefined)}
          onFocus={(e) => e.target.select()}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm bg-white text-gray-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          placeholder="0.00"
          disabled={processing}
        />
      </div>

      {pagoCon && pagoCon > 0 && (
        <div className="p-2 bg-green-50 rounded-lg border border-green-200">
          <div className="flex justify-between items-center text-green-800 text-sm">
            <span className="font-semibold">Cambio</span>
            <span className="font-bold">${cambio.toFixed(2)}</span>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleSimularCambio}
          disabled={isSimularCambioDisabled}
          className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
            isSimularCambioDisabled
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          <Calculator size={16} />
          {processing ? "..." : "Cambio"}
        </button>

        <button
          onClick={onConfirmVenta}
          disabled={isConfirmVentaDisabled}
          className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
            isConfirmVentaDisabled
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-green-600 text-white hover:bg-green-700"
          }`}
        >
          {processing ? (
            <FiRefreshCw className="animate-spin" size={16} />
          ) : (
            <CreditCard size={16} />
          )}
          <span>{processing ? "..." : "Cobrar"}</span>
        </button>
      </div>

      {cartCount === 0 && cargoExtra === 0 && (
        <div className="text-center text-gray-500 text-xs py-2 bg-gray-50 rounded-lg">
          🛒 Agrega productos o cargo extra para cobrar
        </div>
      )}

      {(lowStock?.length ?? 0) > 0 && mostrarLowStock && (
  <div className="mt-3 p-2 border border-orange-200 rounded-lg bg-orange-50"> 
    <div className="flex items-center justify-between mb-1"> 
      <div className="flex items-center gap-1 font-semibold text-orange-800 text-xs"> 
        <FiAlertCircle size={12} /> 
        <span>Para Reponer ({lowStock.length})</span>
      </div>
      <button
        onClick={ocultarLowStock}
        className="p-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors text-gray-600"
        title="Ocultar alertas"
      >
        <FiX size={12} /> 
      </button>
    </div>
    <div className="space-y-1 max-h-20 overflow-auto">
      {lowStock.map((l) => (
        <div 
          key={l.producto_id} 
          className="flex items-center justify-between p-1.5 bg-white rounded border border-orange-100 text-xs"
        >
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-800 truncate">
              {l.descripcion}
            </div>
            <div className="text-gray-600 flex gap-1"> 
              <span>#{l.clave}</span>
              <span className="text-red-600 font-semibold">Exist: {l.existencia}</span>
            </div>
          </div>
          <button
            onClick={() => handleAgregarPedido(l)}
            disabled={processing}
            className={`ml-1 p-1 rounded transition-all ${
              processing
                ? "bg-gray-300 text-gray-400 cursor-not-allowed"
                : "bg-blue-500 text-white hover:bg-blue-600 border border-blue-600"
            }`}
            title="Agregar a pedido"
          >
            <ClipboardPlus size={12} /> 
          </button>
        </div>
      ))}
    </div>
  </div>
)}


      {mostrarDesgloseCambio && desgloseCambio && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[9999] p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-gray-300">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-50 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <Calculator size={18} />
                </div>
                <h2 className="text-lg font-bold text-gray-800">Desglose del Cambio</h2>
              </div>
              <button
                onClick={cerrarDesgloseCambio} 
                className="p-2 text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border border-gray-300"
              >
                <FiX size={16} />
              </button>
            </div>
            <div className="p-4 space-y-4 bg-white">
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-2">Cambio a entregar:</div>
                <div className="text-3xl font-bold text-green-600">
                  ${desgloseCambio.cambio.toFixed(2)}
                </div>
              </div>
              
              {renderDesglose()}
            </div>
            <div className="flex justify-end p-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <button
                onClick={cerrarDesgloseCambio} 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium border border-blue-700"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarSeleccionPedidos && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[9999] p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-gray-300">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-800">Agregar a Pedido</h2>
              <button
                onClick={() => setMostrarSeleccionPedidos(false)}
                className="p-2 text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border border-gray-300"
                disabled={processing}
              >
                <FiX size={16} />
              </button>
            </div>
            <div className="p-4 space-y-4 bg-white">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar pedido</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-gray-900"
                  value={pedidoDestinoId ?? ""}
                  onChange={(e) => setPedidoDestinoId(Number(e.target.value))}
                  disabled={processing}
                >
                  {pedidosPendientes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.cliente ?? "Sin cliente"} - ${p.total?.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad a agregar</label>
                <input
                  ref={cantidadInputRef}
                  type="text" 
                  inputMode="numeric" 
                  pattern="[0-9]*" 
                  value={cantidadInput}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    const cleanValue = value.replace(/^0+/, '');
                    setCantidadInput(cleanValue === '' ? '1' : cleanValue);
                  }}
                  onKeyDown={(e) => {
                    if (
                      !/[0-9]/.test(e.key) &&
                      e.key !== 'Backspace' &&
                      e.key !== 'Delete' &&
                      e.key !== 'Tab' &&
                      e.key !== 'ArrowLeft' &&
                      e.key !== 'ArrowRight' &&
                      e.key !== 'Home' &&
                      e.key !== 'End'
                    ) {
                      e.preventDefault();
                    }
                  }}
                  onPaste={(e) => {
                    const pasteData = e.clipboardData.getData('text');
                    if (!/^\d+$/.test(pasteData)) {
                      e.preventDefault();
                      alert('Solo se permiten números');
                    }
                  }}
                  onFocus={(e) => e.target.select()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-sm font-semibold bg-white text-gray-900"
                  disabled={processing}
                  placeholder="1"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => setMostrarSeleccionPedidos(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium border border-gray-300"
                disabled={processing}
              >
                Cancelar
              </button>
              <button
                onClick={confirmarAgregarPedido}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                  processing
                    ? "bg-gray-400 text-gray-200 cursor-not-allowed border-gray-400"
                    : "bg-blue-600 text-white hover:bg-blue-700 border-blue-700"
                }`}
                disabled={processing}
              >
                {processing ? "Procesando..." : "Agregar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumenVenta;