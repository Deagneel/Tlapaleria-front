import React, { useEffect, useState } from "react";
import { obtenerProductos, crearProducto, actualizarProducto, eliminarProducto } from "../api/productos";
import { crearPedido, actualizarPedido } from "../api/pedidos";
import ProductoModal from "./ProductoModal";
import { Plus, Trash } from "lucide-react";
import type { PedidoDTO, DetallePedidoDTO } from "../types/Pedido";
import type { Producto } from "../types/Producto";
import type { PedidoFullDTO} from "../types/PedidoDTO";
import { obtenerPedidoCompleto } from "../api/pedidos";
import type { DetallePedidoFullDTO } from "../types/PedidoDTO";


interface Props {
  pedido: PedidoFullDTO | null; 
  onClose: () => void;
  onGuardado: () => void;
}

interface DetalleTemp {
  id?: number;
  producto: Producto;
  cantidad: number;
  precio: number;
  recibido?: boolean;
  precioSugerido?: number;
  precioIndividualEditable?: number;
  marcados?: boolean;
  esTemporal?: boolean;
}

const PedidoModal: React.FC<Props> = ({ pedido, onClose, onGuardado }) => {
  const [productosDisponibles, setProductosDisponibles] = useState<Producto[]>([]);
  const [detalles, setDetalles] = useState<DetalleTemp[]>([]);
  const [cliente, setCliente] = useState<string>("");
  const [total, setTotal] = useState<number>(0);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [cantidadTemp, setCantidadTemp] = useState<number>(1);
  const [textoBusqueda, setTextoBusqueda] = useState<string>("");
  const [mostrarProductoModal, setMostrarProductoModal] = useState(false);
  const [productoParaEditar, setProductoParaEditar] = useState<Producto | null>(null);

  const esPendiente = pedido?.estado === "PENDIENTE" || pedido === null;
  const esSurtido = pedido?.estado === "SURTIDO";

  // Carga productos disponibles
  useEffect(() => {
    const cargar = async () => {
      const data = await obtenerProductos();
      setProductosDisponibles(data);
    };
    cargar();
  }, []);

  useEffect(() => {
    const cargarPedidoCompleto = async () => {
      if (!pedido?.id) return;
      try {
        const data: PedidoFullDTO = await obtenerPedidoCompleto(pedido.id); // backend correcto
        setCliente(data.cliente);

        const detallesTemp: DetalleTemp[] = (data.detalles || []).map((d: DetallePedidoFullDTO) => {
          const producto: Producto = {
            id: d.producto.id,
            clave: d.producto.clave,
            descripcion: d.producto.descripcion,
            codigo_barras: d.producto.codigo_barras ?? "",
            costo: d.producto.costo ?? 0,
            precio: d.producto.precio ?? 0,
            precio_individual: d.producto.precioIndividual ?? 0,
            existencia: 0,
            existencia_min: 0,
            unidad: "",
            activo: d.producto.activo ?? true,
          };

          return {
            id: d.id,
            producto,
            cantidad: d.cantidad,
            precio: d.precio,
            recibido: d.recibido ?? false,
            precioIndividualEditable: producto.precio_individual,
            marcados: false,
            esTemporal: producto.activo === false,
          };
        });

        setDetalles(detallesTemp);
      } catch (err) {
        console.error("Error al obtener pedido completo:", err);
        alert("No se pudo cargar el pedido completo");
      }
    };

    cargarPedidoCompleto();
  }, [pedido]);




  // Cálculo de total
  useEffect(() => {
    const suma = detalles.reduce((acc, d) => acc + d.cantidad * d.precio, 0);
    setTotal(suma);
  }, [detalles]);

  const productosFiltrados = productosDisponibles.filter(p =>
    p.descripcion.toLowerCase().includes(textoBusqueda.toLowerCase()) ||
    p.clave.toLowerCase().includes(textoBusqueda.toLowerCase()) ||
    (p.codigo_barras?.toLowerCase().includes(textoBusqueda.toLowerCase()) ?? false)
  );

  const puedeAgregarProducto = (prod: Producto) => !detalles.some(d => d.producto.id === prod.id);

  // Agregar detalle
  const agregarDetalle = () => {
    const productoAAgregar =
      productoSeleccionado ??
      productosDisponibles.find(p =>
        p.clave.toLowerCase().includes(textoBusqueda.toLowerCase()) ||
        (p.codigo_barras?.toLowerCase().includes(textoBusqueda.toLowerCase()) ?? false)
      );

    if (!productoAAgregar) return;
    if (!puedeAgregarProducto(productoAAgregar)) {
      alert("El producto ya está en el pedido.");
      return;
    }

    const nuevoDetalle: DetalleTemp = {
      producto: productoAAgregar,
      cantidad: cantidadTemp,
      precio: productoAAgregar.costo,
      recibido: false,
      precioIndividualEditable: productoAAgregar.precio_individual ?? 0,
      marcados: false,
      esTemporal: productoAAgregar.activo === false,
    };

    setDetalles(prev => [...prev, nuevoDetalle]);
    setProductoSeleccionado(null);
    setCantidadTemp(1);
    setTextoBusqueda("");
  };

  const agregarProductoTemporal = async (clave: string, descripcion: string, cantidad: number, costo = 0) => {
    try {
      const productoCreado = await crearProducto({
        clave,
        descripcion,
        codigo_barras: "",
        costo,
        precio: 0,
        precio_individual: 0,
        existencia: 0,
        existencia_min: 0,
        unidad: "",
        activo: false,
      });

      const nuevoDetalle: DetalleTemp = {
        producto: productoCreado,
        cantidad,
        precio: costo,
        recibido: false,
        precioIndividualEditable: productoCreado.precio_individual ?? 0,
        marcados: false,
        esTemporal: true
      };

      setDetalles(prev => [...prev, nuevoDetalle]);
    } catch (err) {
      console.error("Error creando producto temporal:", err);
      alert("No se pudo crear el producto temporal.");
    }
  };

  const eliminarDetalle = (productoId: number) => setDetalles(prev => prev.filter(d => d.producto.id !== productoId));
  const actualizarCantidad = (id: number, cantidad: number) => setDetalles(prev => prev.map(d => d.producto.id === id ? { ...d, cantidad } : d));
  const toggleRecibido = (id: number) => setDetalles(prev => prev.map(d => d.producto.id === id ? { ...d, recibido: !d.recibido, marcados: !d.marcados } : d));

  const handleSubmit = async (e?: React.FormEvent, nuevoEstado?: "PENDIENTE" | "SURTIDO" | "ENTREGADO") => {
    if (e) e.preventDefault();

    try {
      const estadoDestino = nuevoEstado ?? (pedido?.estado || "PENDIENTE");

      const pedidoBackend: PedidoDTO = {
        cliente,
        total,
        estado: estadoDestino,
        detalles: detalles.map(d => {
          const detalle: DetallePedidoDTO = {
            id: d.id,
            producto_id: d.producto.id,
            cantidad: d.cantidad,
            precio: d.precio,
          };
          if (estadoDestino === "SURTIDO") detalle.recibido = d.recibido;
          return detalle;
        }),
      };

      if (!pedido?.id) {
        await crearPedido(pedidoBackend);
      } else {
        await actualizarPedido(pedido.id!, pedidoBackend);
      }

      // Si estamos pasando a SURTIDO, actualizar productos con existencia
      if (estadoDestino === "SURTIDO") {
        for (const d of detalles) {
          const prodToUpdate: Omit<Producto, "id"> = {
            clave: d.producto.clave,
            descripcion: d.producto.descripcion,
            codigo_barras: d.producto.codigo_barras ?? "",
            costo: d.precio,
            precio: d.producto.precio,
            precio_individual: d.precioIndividualEditable ?? d.producto.precio_individual ?? 0,
            existencia: (d.producto.existencia ?? 0) + (d.recibido ? d.cantidad : 0),
            existencia_min: d.producto.existencia_min ?? 0,
            unidad: d.producto.unidad ?? "",
            activo: d.producto.activo ?? true,
          };
          try { await actualizarProducto(d.producto.id, prodToUpdate); } 
          catch (err) { console.error("No se pudo actualizar producto", d.producto.id, err); }
        }
      }

      // Si pasamos a ENTREGADO, eliminar productos temporales
      if (estadoDestino === "ENTREGADO") {
        const todos = await obtenerProductos();
        const inactivos = todos.filter(p => p.activo === false);
        for (const p of inactivos) {
          try { await eliminarProducto(p.id); } 
          catch (err) { console.error("Error al eliminar producto inactivo:", p.id, err); }
        }
      }

      onGuardado();
      onClose();

    } catch (error) {
      console.error("Error al guardar pedido:", error);
      alert("Ocurrió un error al guardar el pedido.");
    }
  };

  const abrirProductoModalPara = (producto: Producto | null) => {
    setProductoParaEditar(producto);
    setMostrarProductoModal(true);
  };

  const onProductoGuardado = async () => {
    const data = await obtenerProductos();
    setProductosDisponibles(data);
    setDetalles(prev => prev.map(d => {
      const prod = data.find(p => p.id === d.producto.id);
      return prod ? { ...d, producto: prod } : d;
    }));
    setMostrarProductoModal(false);
    setProductoParaEditar(null);
  };

  // ----------------------
  // Render
  // ----------------------
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">
          {pedido ? `Editar Pedido (${pedido.cliente})` : "Nuevo Pedido"}
        </h2>

        <form onSubmit={e => handleSubmit(e)} className="grid grid-cols-1 gap-4">
          {/* Cliente y estado */}
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-gray-700 mb-1">Nombre del Pedido</label>
              <input type="text" value={cliente} onChange={e => setCliente(e.target.value)} required className="input w-full" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-gray-700">Estado:</label>
              <div className="px-3 py-1 border rounded">{pedido?.estado ?? "PENDIENTE"}</div>
            </div>
          </div>

          {/* Productos solo si PENDIENTE */}
          {esPendiente && (
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="block text-gray-700 mb-1">Buscar producto</label>
                <input
                  type="text"
                  value={textoBusqueda}
                  onChange={e => setTextoBusqueda(e.target.value)}
                  placeholder="Descripción, clave o código de barras"
                  className="border rounded p-2 w-full"
                />
                {productosFiltrados.length > 1 && (
                  <select
                    value={productoSeleccionado?.id || ""}
                    onChange={e => setProductoSeleccionado(productosFiltrados.find(p => p.id === Number(e.target.value)) || null)}
                    className="border rounded p-2 w-full mt-1 bg-gray-100"
                  >
                    <option value="">Seleccionar producto</option>
                    {productosFiltrados.map(p => <option key={p.id} value={p.id}>{p.descripcion} ({p.clave}) - ${p.costo.toFixed(2)}</option>)}
                  </select>
                )}
              </div>

              <div className="w-24">
                <label className="block text-gray-700 mb-1">Cantidad</label>
                <input type="number" min={1} value={cantidadTemp} onChange={e => setCantidadTemp(Number(e.target.value))} className="input w-full" />
              </div>

              <button type="button" onClick={agregarDetalle} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1">
                <Plus size={16}/> Agregar
              </button>

              <button type="button" onClick={() => {
                const clave = prompt("Clave del producto:") ?? "";
                if (!clave) return;
                const descripcion = prompt("Descripción:") ?? "";
                if (!descripcion) return;
                const cantidadRaw = prompt("Cantidad:", "1") ?? "1";
                const cantidad = Number(cantidadRaw) || 1;
                const costoRaw = prompt("Costo (opcional):", "0") ?? "0";
                const costo = Number(costoRaw) || 0;
                agregarProductoTemporal(clave, descripcion, cantidad, costo);
              }} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Agregar temporal</button>
            </div>
          )}

          {/* Tabla de detalles */}
          <div className="border rounded-lg overflow-auto max-h-72">
            <div className="grid grid-cols-6 bg-gray-100 px-4 py-2 font-semibold text-gray-700">
              <div>Clave</div>
              <div>Producto</div>
              <div>Cantidad</div>
              <div>{esSurtido ? "Costo (editable)" : "Costo"}</div>
              {esSurtido && <div>Recibido</div>}
              <div>Subtotal</div>
              <div className="text-center">Acciones</div>
            </div>

            {detalles.map(d => {
              const subtotal = d.cantidad * d.precio;
              return (
                <div key={d.producto.id} className={`grid grid-cols-6 px-4 py-2 border-b items-center ${d.marcados ? "bg-green-50" : ""}`}>
                  <div>{d.producto.clave}</div>
                  <div>{d.producto.descripcion}</div>
                  <div>
                    <input type="number" min={1} value={d.cantidad} onChange={e => actualizarCantidad(d.producto.id, Number(e.target.value))} className="input w-16" />
                  </div>
                  <div>
                    {esSurtido
                      ? <input type="number" value={d.precio} onChange={e => setDetalles(prev => prev.map(det => det.producto.id === d.producto.id ? {...det, precio: Number(e.target.value)} : det))} className="input w-20" />
                      : `$${d.precio.toFixed(2)}`
                    }
                  </div>
                  {esSurtido && (
                    <div className="flex justify-center">
                      <input type="checkbox" checked={d.recibido} onChange={() => toggleRecibido(d.producto.id)} />
                    </div>
                  )}
                  <div>${subtotal.toFixed(2)}</div>
                  <div className="flex justify-center">
                    <button type="button" onClick={() => eliminarDetalle(d.producto.id)} className="text-red-500 hover:text-red-700">
                      <Trash size={16}/>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-right font-semibold text-gray-700 mt-2">Total: ${total.toFixed(2)}</div>

          {/* Botones */}
          <div className="flex justify-end gap-3 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">Cancelar</button>

            {pedido && esPendiente && (
              <button type="button" onClick={() => handleSubmit(undefined, "SURTIDO")} className="px-4 py-2 rounded bg-yellow-500 text-white hover:bg-yellow-600">Marcar SURTIDO</button>
            )}

            {pedido && esSurtido && (
              <button type="button" onClick={() => handleSubmit(undefined, "ENTREGADO")} className="px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600">Marcar ENTREGADO</button>
            )}

            <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">
              Guardar
            </button>
          </div>
        </form>

        {mostrarProductoModal && (
          <ProductoModal producto={productoParaEditar} onClose={() => setMostrarProductoModal(false)} onGuardado={onProductoGuardado} />
        )}
      </div>
    </div>
  );
};

export default PedidoModal;
