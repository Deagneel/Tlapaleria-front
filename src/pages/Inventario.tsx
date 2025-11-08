import React, { useEffect, useState, useRef } from "react";
import Layout from "../components/Layout";
import InventarioTable from "../components/InventarioTable";
import SearchBar from "../components/SearchBar";
import ProductoModal from "../components/ProductoModal";
import { obtenerProductos, eliminarProducto } from "../api/productos";
import { obtenerPedidos, obtenerPedidoCompleto, agregarProductoAPedido } from "../api/pedidos"; // ajusta según tu API
import type { Producto } from "../types/Producto";
import type { PedidoDTO, DetallePedidoDTO } from "../types/Pedido";
import { PlusCircle } from "lucide-react";

const Inventario: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);

  const [productoParaPedido, setProductoParaPedido] = useState<Producto | null>(null);
  const [mostrarAgregarAPedido, setMostrarAgregarAPedido] = useState(false);
  const [pedidosPendientes, setPedidosPendientes] = useState<PedidoDTO[]>([]);
  const [pedidoDestinoId, setPedidoDestinoId] = useState<number | null>(null);

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

  useEffect(() => {
    searchRef.current?.focus();
  }, []);


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

  const confirmarAgregarAotroPedido = async () => {
    if (!productoParaPedido || pedidoDestinoId == null) return alert("Selecciona un pedido destino.");

    try {
      const pedidoFull = await obtenerPedidoCompleto(pedidoDestinoId);
      const yaExiste = (pedidoFull.detalles || []).some(
        (dt: DetallePedidoDTO) => dt.producto_id === productoParaPedido.id
      );

      if (yaExiste) return alert("El producto ya existe en el pedido seleccionado.");

      const cantidadInput = window.prompt(
        `¿Cuántas unidades de "${productoParaPedido.descripcion}" deseas agregar?`,
        "1"
      );
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

      setMostrarAgregarAPedido(false);
      setProductoParaPedido(null);
    } catch (err) {
      console.error("Error agregando producto al pedido:", err);
      alert("No se pudo agregar el producto al pedido.");
    }
  };

  // ============================
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
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow"
        >
          <PlusCircle size={20} />
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

      {mostrarAgregarAPedido && productoParaPedido && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-full max-w-md">
            <h3 className="font-semibold mb-2">Seleccionar pedido pendiente</h3>

            {pedidosPendientes.length === 0 ? (
              <p>No hay pedidos pendientes disponibles.</p>
            ) : (
              <>
                <select
                  className="border rounded p-2 w-full mb-3"
                  value={pedidoDestinoId ?? ""}
                  onChange={(e) => setPedidoDestinoId(Number(e.target.value))}
                >
                  {pedidosPendientes.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.cliente} — {p.fecha ? new Date(p.fecha).toLocaleString() : ""}
                    </option>
                  ))}
                </select>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => { setMostrarAgregarAPedido(false); setProductoParaPedido(null); }}
                    className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={confirmarAgregarAotroPedido}
                    className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Agregar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Inventario;
