import React, { useState, useEffect } from "react";
import type { PedidoDTO, Producto } from "../types/Pedido";
import { obtenerProductos } from "../api/productos";
import { crearPedido, actualizarPedido } from "../api/pedidos";
import { Plus, Trash } from "lucide-react";

interface Props {
  pedido: PedidoDTO | null;
  onClose: () => void;
  onGuardado: () => void;
}

interface DetalleTemp {
  id?: number;
  producto: Producto;
  cantidad: number;
  precio: number;
}

const PedidoModal: React.FC<Props> = ({ pedido, onClose, onGuardado }) => {
  const [productosDisponibles, setProductosDisponibles] = useState<Producto[]>([]);
  const [detalles, setDetalles] = useState<DetalleTemp[]>([]);
  const [cliente, setCliente] = useState<string>("");
  const [total, setTotal] = useState<number>(0);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [cantidadTemp, setCantidadTemp] = useState<number>(1);
  const [textoBusqueda, setTextoBusqueda] = useState<string>("");

  useEffect(() => {
    const cargar = async () => {
      const data = await obtenerProductos();
      setProductosDisponibles(data);
    };
    cargar();
  }, []);

  useEffect(() => {
  if (pedido && productosDisponibles.length > 0) {
    setCliente(pedido.cliente);

    const detallesTemp: DetalleTemp[] = pedido.detalles?.reduce<DetalleTemp[]>((acc, d) => {
      const producto = productosDisponibles.find(p => p.id === d.producto_id);
      if (!producto) return acc; // descartamos sin crear undefined
      acc.push({
        id: d.id,
        producto,
        cantidad: d.cantidad,
        precio: d.precio
      });
      return acc;
    }, []) || [];

    setDetalles(detallesTemp);
  }
}, [pedido, productosDisponibles]);


  useEffect(() => {
    const suma = detalles.reduce((acc, d) => acc + d.cantidad * d.precio, 0);
    setTotal(suma);
  }, [detalles]);

  const productosFiltrados = productosDisponibles.filter(p =>
    p.descripcion.toLowerCase().includes(textoBusqueda.toLowerCase()) ||
    p.clave.toLowerCase().includes(textoBusqueda.toLowerCase()) ||
    (p.codigo_barras?.toLowerCase().includes(textoBusqueda.toLowerCase()) ?? false)
  );

  const agregarDetalle = () => {
    const productoAAgregar =
      productoSeleccionado ??
      productosDisponibles.find(p =>
        p.clave.toLowerCase().includes(textoBusqueda.toLowerCase()) ||
        (p.codigo_barras?.toLowerCase().includes(textoBusqueda.toLowerCase()) ?? false)
      );

    if (!productoAAgregar) return;

    const existente = detalles.find(d => d.producto.id === productoAAgregar.id);
    if (existente) {
      setDetalles(detalles.map(d =>
        d.producto.id === productoAAgregar.id
          ? { ...d, cantidad: d.cantidad + cantidadTemp }
          : d
      ));
    } else {
      setDetalles([...detalles, {
        producto: productoAAgregar,
        cantidad: cantidadTemp,
        precio: productoAAgregar.costo
      }]);
    }

    setProductoSeleccionado(null);
    setCantidadTemp(1);
    setTextoBusqueda("");
  };

  const eliminarDetalle = (id: number) => {
    setDetalles(detalles.filter(d => d.producto.id !== id));
  };

  const actualizarCantidad = (id: number, cantidad: number) => {
    setDetalles(detalles.map(d => d.producto.id === id ? { ...d, cantidad } : d));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const pedidoBackend: PedidoDTO = {
        cliente,
        total,
        estado: pedido?.estado || "PENDIENTE",
        detalles: detalles.map(d => ({
          id: d.id,
          producto_id: d.producto.id,
          cantidad: d.cantidad,
          precio: d.precio
        }))
      };

      if (pedido?.id) {
        await actualizarPedido(pedido.id, pedidoBackend);
      } else {
        await crearPedido(pedidoBackend);
      }

      onGuardado();
      onClose();
    } catch (error) {
      console.error("Error al guardar pedido:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">{pedido ? "Editar Pedido" : "Nuevo Pedido"}</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-gray-700 mb-1">Nombre del Pedido</label>
            <input
              type="text"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              required
              className="input w-full"
            />
          </div>

          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-gray-700 mb-1">Buscar producto</label>
              <input
                type="text"
                value={textoBusqueda}
                onChange={(e) => setTextoBusqueda(e.target.value)}
                placeholder="Descripción, clave o código de barras"
                className="border rounded p-2 w-full"
              />
              {productosFiltrados.length > 1 && (
                <select
                  value={productoSeleccionado?.id || ""}
                  onChange={(e) => {
                    const prod = productosFiltrados.find(p => p.id === Number(e.target.value));
                    setProductoSeleccionado(prod || null);
                  }}
                  className="border rounded p-2 w-full mt-1 bg-gray-100"
                >
                  <option value="">Seleccionar producto</option>
                  {productosFiltrados.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.descripcion} ({p.clave}) - ${p.costo.toFixed(2)}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="w-24">
              <label className="block text-gray-700 mb-1">Cantidad</label>
              <input
                type="number"
                min={1}
                value={cantidadTemp}
                onChange={(e) => setCantidadTemp(Number(e.target.value))}
                className="input w-full"
              />
            </div>

            <button type="button" onClick={agregarDetalle} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1">
              <Plus size={16}/> Agregar
            </button>
          </div>

          <div className="border rounded-lg overflow-auto max-h-60">
            <div className="grid grid-cols-5 bg-gray-100 px-4 py-2 font-semibold text-gray-700">
              <div>Producto</div>
              <div>Cantidad</div>
              <div>Costo</div>
              <div>Subtotal</div>
              <div className="text-center">Eliminar</div>
            </div>
            {detalles.map(d => (
              <div key={d.producto.id} className="grid grid-cols-5 px-4 py-2 border-b items-center">
                <div>{d.producto?.descripcion || "Producto desconocido"}</div>
                <div>
                  <input
                    type="number"
                    min={1}
                    value={d.cantidad}
                    onChange={(e) => actualizarCantidad(d.producto.id, Number(e.target.value))}
                    className="input w-20"
                  />
                </div>
                <div>${d.precio.toFixed(2)}</div>
                <div>${(d.cantidad * d.precio).toFixed(2)}</div>
                <div className="flex justify-center">
                  <button type="button" onClick={() => eliminarDetalle(d.producto.id)} className="text-red-500 hover:text-red-700">
                    <Trash size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end text-lg font-semibold mt-2">
            Total: ${total.toFixed(2)}
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
              Cancelar
            </button>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              {pedido ? "Actualizar Pedido" : "Crear Pedido"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PedidoModal;
