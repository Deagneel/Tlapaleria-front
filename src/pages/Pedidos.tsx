import React, { useEffect, useState, useRef, useMemo } from "react";
import Layout from "../components/Layout";
import SearchBar from "../components/SearchBar";
import PedidoModal from "../components/PedidoModal";
import { obtenerPedidos, eliminarPedido } from "../api/pedidos";
import type { PedidoDTO } from "../types/Pedido";
import { PlusCircle } from "lucide-react";
import { Virtuoso } from "react-virtuoso";

const ROW_HEIGHT = 60;

const Pedidos: React.FC = () => {
  const [pedidos, setPedidos] = useState<PedidoDTO[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<PedidoDTO | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<string>("Todos");
  const [fechaInicio, setFechaInicio] = useState<string>("");
  const [fechaFin, setFechaFin] = useState<string>("");

  const searchRef = useRef<HTMLInputElement>(null);

  const cargarPedidos = async () => {
    try {
      const data = await obtenerPedidos();
      setPedidos(data);
    } catch (error) {
      console.error("Error al cargar pedidos:", error);
    }
  };

  useEffect(() => { cargarPedidos(); }, []);

  const handleNuevo = () => {
    setPedidoSeleccionado(null);
    setMostrarModal(true);
  };

  const handleEditar = (pedido: PedidoDTO) => {
    setPedidoSeleccionado(pedido);
    setMostrarModal(true);
  };

  const handleEliminar = async (id: number) => {
    if (confirm("¿Deseas eliminar este pedido?")) {
      try { await eliminarPedido(id); cargarPedidos(); }
      catch (error) { console.error(error); }
    }
  };

  const pedidosFiltrados = useMemo(() => {
    return pedidos
      .filter(p => filtroEstado === "Todos" || p.estado.toLowerCase() === filtroEstado.toLowerCase())
      .filter(p => p.cliente.toLowerCase().includes(busqueda.toLowerCase()))
      .filter(p => {
        if (!p.fecha) return false;
        const fecha = new Date(p.fecha);
        if (fechaInicio && fecha < new Date(fechaInicio)) return false;
        if (fechaFin && fecha > new Date(fechaFin)) return false;
        return true;
      });
  }, [pedidos, busqueda, filtroEstado, fechaInicio, fechaFin]);

  useEffect(() => { searchRef.current?.focus(); }, []);

  return (
    <Layout>
      {/* Barra superior */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <SearchBar
          value={busqueda}
          onChange={setBusqueda}
          ref={searchRef}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault(); // evita submit accidental
            }
          }}
        />
        <button
          onClick={handleNuevo}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow"
        >
          <PlusCircle size={20} />
          Nuevo Pedido
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 flex-wrap mb-4">
        <div className="flex items-center gap-2">
          <label>Estado:</label>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="border rounded p-1 bg-white text-gray-800"
          >
            <option value="Todos">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="surtido">Surtido</option>
            <option value="entregado">Entregado</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label>Fecha inicio:</label>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="border rounded p-1 bg-white text-gray-800"
          />
        </div>

        <div className="flex items-center gap-2">
          <label>Fecha fin:</label>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="border rounded p-1 bg-white text-gray-800"
          />
        </div>
      </div>

      {/* Tabla virtualizada */}
      <div className="border rounded-lg overflow-hidden h-[70vh]">
        <div className="grid px-4 py-2 bg-blue-600 text-white font-semibold" style={{ gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr" }}>
          <div>Pedido</div>
          <div>Fecha</div>
          <div>Estado</div>
          <div>Total</div>
          <div className="text-center">Acciones</div>
        </div>

        {pedidosFiltrados.length === 0 ? (
          <p className="text-gray-500 mt-6 text-center">No hay pedidos que coincidan.</p>
        ) : (
          <Virtuoso
            data={pedidosFiltrados}
            itemContent={(index, pedido) => {
              const fechaPedido = pedido.fecha ? new Date(pedido.fecha) : null;
              return (
                <div
                  key={pedido.id}
                  className="grid px-4 py-2 items-center border-b hover:bg-gray-50 transition"
                  style={{ gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr", minHeight: ROW_HEIGHT }}
                >
                  <div>{pedido.cliente}</div>
                  <div>{fechaPedido ? fechaPedido.toLocaleString() : "N/A"}</div>
                  <div className="capitalize">{pedido.estado}</div>
                  <div>${Number(pedido.total ?? 0).toFixed(2)}</div>
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => handleEditar(pedido)}
                      className="bg-gray-300 text-blue-600 hover:bg-gray-400 p-1.5 rounded transition"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleEliminar(pedido.id!)}
                      className="bg-gray-300 text-red-500 hover:bg-gray-400 p-1.5 rounded transition"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              );
            }}
            style={{ height: "100%" }}
          />
        )}
      </div>

      {mostrarModal && (
        <PedidoModal
          pedido={pedidoSeleccionado}
          onClose={() => setMostrarModal(false)}
          onGuardado={cargarPedidos}
        />
      )}
    </Layout>
  );
};

export default Pedidos;
