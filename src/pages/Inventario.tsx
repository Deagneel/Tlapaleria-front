import React, { useEffect, useState, useRef } from "react";
import Layout from "../components/Layout";
import InventarioTable from "../components/InventarioTable";
import SearchBar from "../components/SearchBar";
import ProductoModal from "../components/ProductoModal";
import { obtenerProductos, eliminarProducto } from "../api/productos";
import { obtenerPedidos, obtenerPedidoCompleto, agregarProductoAPedido } from "../api/pedidos";
import type { Producto } from "../types/Producto";
import type { PedidoDTO, DetallePedidoDTO } from "../types/Pedido";
import { PlusCircle, X } from "lucide-react";

const Inventario: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);

  const [productoParaPedido, setProductoParaPedido] = useState<Producto | null>(null);
  const [mostrarAgregarAPedido, setMostrarAgregarAPedido] = useState(false);
  const [pedidosPendientes, setPedidosPendientes] = useState<PedidoDTO[]>([]);
  const [pedidoDestinoId, setPedidoDestinoId] = useState<number | null>(null);
  const [mostrarCantidadModal, setMostrarCantidadModal] = useState(false);
  const [cantidadInput, setCantidadInput] = useState("1");
  const inputCantidadRef = useRef<HTMLInputElement>(null);

  const searchRef = useRef<HTMLInputElement>(null);

  const cargarProductos = async () => {
    try {
      const data = await obtenerProductos();
      setProductos(data);
    } catch (error) {
      console.error("Error al cargar productos:", error);
    }
  };  

  useEffect(() => {
    if (mostrarCantidadModal && inputCantidadRef.current) {
      inputCantidadRef.current.focus();
      inputCantidadRef.current.select();
    }
  }, [mostrarCantidadModal]);

  useEffect(() => {
    cargarProductos();
  }, []);

  const handleEditar = (producto: Producto) => {
    setProductoSeleccionado(producto);
    setMostrarModal(true);
  };

  const handleEliminar = async (id: number) => {
    if (confirm("¿Deseas eliminar este producto?")) {
      try {
        await eliminarProducto(id);
        cargarProductos();
      } catch (error) {
        console.error("Error al eliminar producto:", error);
      }
    }
  };

  const handleNuevo = () => {
    setProductoSeleccionado(null);
    setMostrarModal(true);
  };

  const handleBusquedaKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      // estado 'busqueda' ya está actualizado
    }
  };

  const productosFiltrados = productos.filter(
    (p) =>
      p.clave.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.codigo_barras && p.codigo_barras.includes(busqueda))
  );

  const handleAgregarAPedido = async (producto: Producto) => {
    setProductoParaPedido(producto);
    try {
      const all = await obtenerPedidos();
      const pendientes = all.filter(p => (p.estado ?? "").toUpperCase() === "PENDIENTE");
      setPedidosPendientes(pendientes.filter((p): p is PedidoDTO & { id: number } => p.id !== undefined));
      setPedidoDestinoId(pendientes.length && pendientes[0].id !== undefined ? pendientes[0].id : null);
      setMostrarAgregarAPedido(true);
    } catch (err) {
      console.error("Error cargando pedidos pendientes:", err);
      alert("No se pudieron obtener pedidos pendientes.");
    }
  };

  const confirmarCantidadPedido = async () => {
    if (!productoParaPedido || pedidoDestinoId == null) return alert("Selecciona un pedido destino.");

    try {
      const pedidoFull = await obtenerPedidoCompleto(pedidoDestinoId);
      const yaExiste = (pedidoFull.detalles || []).some(
        (dt: DetallePedidoDTO) => dt.producto_id === productoParaPedido.id
      );
      if (yaExiste) return alert("El producto ya existe en el pedido seleccionado.");

      const cantidadNum = Number(cantidadInput);
      const cantidad = !isNaN(cantidadNum) && cantidadNum > 0 ? cantidadNum : 1;

      const detalle: DetallePedidoDTO = {
        producto_id: productoParaPedido.id,
        cantidad,
        precio: productoParaPedido.costo ?? 0,
        recibido: false,
      };

      await agregarProductoAPedido(pedidoDestinoId, detalle);
      alert(`Se agregaron ${cantidad} unidades de "${productoParaPedido.descripcion}" al pedido.`);

      // Reset
      setMostrarAgregarAPedido(false);
      setMostrarCantidadModal(false);
      setProductoParaPedido(null);
      setPedidoDestinoId(null);
      setCantidadInput("1");
    } catch (err) {
      console.error("Error agregando producto al pedido:", err);
      alert("No se pudo agregar el producto al pedido.");
    }
  };


  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <SearchBar
          value={busqueda}
          onChange={setBusqueda}
          onKeyDown={handleBusquedaKeyDown}
          ref={searchRef} 
        />
        <button
          onClick={handleNuevo}
          className="flex items-center gap-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-3.5 rounded-xl transition-all duration-200 font-semibold shadow-md hover:shadow-lg group"
        >
          <div className="p-1 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
            <PlusCircle size={18} className="text-white" />
          </div>
          Agregar Producto
        </button>
      </div>

      <InventarioTable
        productos={productosFiltrados}
        onEditar={handleEditar}
        onEliminar={handleEliminar}
        onAgregarAPedido={handleAgregarAPedido} 
        busqueda={busqueda}
      />

      {mostrarModal && (
        <ProductoModal
          producto={productoSeleccionado}
          onClose={() => setMostrarModal(false)}
          onGuardado={cargarProductos}
        />
      )}

      {/* Selección de pedido */}
      {mostrarAgregarAPedido && productoParaPedido && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[9999]">
          <div className="bg-white p-4 rounded shadow-md w-96 relative">
            <button
              onClick={() => { setMostrarAgregarAPedido(false); setProductoParaPedido(null); }}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 bg-gray-200 p-1 rounded"
            >
              <X size={20} />
            </button>

            <h2 className="text-lg font-semibold mb-3">Selecciona un Pedido Pendiente</h2>

            {pedidosPendientes.length === 0 ? (
              <p>No hay pedidos pendientes disponibles.</p>
            ) : (
              <>
                <select
                  className="w-full border p-2 rounded mb-4"
                  value={pedidoDestinoId ?? pedidosPendientes[0]?.id ?? ""}
                  onChange={e => setPedidoDestinoId(Number(e.target.value))}
                >
                  {pedidosPendientes.map(p => (
                    <option key={p.id} value={p.id}>
                      Pedido — {p.cliente ?? "Sin cliente"}
                    </option>
                  ))}
                </select>

                {pedidoDestinoId == null && (
                  <p className="text-red-600 text-sm mb-2">Debes seleccionar un pedido.</p>
                )}

                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => { setMostrarAgregarAPedido(false); setProductoParaPedido(null); }}
                    className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => setMostrarCantidadModal(true)}
                    className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Aceptar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal de cantidad */}
      {mostrarCantidadModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[9999]">
          <div className="bg-white p-4 rounded shadow-md w-80">
            <h2 className="text-lg font-semibold mb-3">Cantidad a Agregar</h2>

            <input
              type="number"
              ref={inputCantidadRef}
              className="w-full border p-2 rounded"
              value={cantidadInput}
              min="1"
              onChange={e => setCantidadInput(e.target.value)}
            />

            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setMostrarCantidadModal(false)}
                className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarCantidadPedido}
                className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
};

export default Inventario;
