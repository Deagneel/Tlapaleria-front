import React, { useEffect, useState, useRef, useMemo } from "react";
import Layout from "../components/Layout";
import SearchBar from "../components/SearchBar";
import PedidoModal from "../components/PedidoModal";
import PedidoTable from "../components/PedidoTable";
import { obtenerPedidos, eliminarPedido, actualizarPedido } from "../api/pedidos";
import type { PedidoDTO } from "../types/Pedido";
import type { PedidoFullDTO } from "../types/PedidoDTO"; 
import { obtenerPedidoCompleto } from "../api/pedidos";

const Pedidos: React.FC = () => {
  const [pedidos, setPedidos] = useState<PedidoDTO[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<PedidoFullDTO | null>(null); // <-- cambia a PedidoFullDTO
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

  const handleEditar = async (pedido: PedidoDTO) => {
    if (!pedido.id) {
      console.error("El pedido no tiene id válido:", pedido);
      alert("No se puede editar este pedido (id faltante).");
      return;
    }

    try {
      const data: PedidoFullDTO = await obtenerPedidoCompleto(pedido.id);
      setPedidoSeleccionado(data);
      setMostrarModal(true);
    } catch (err) {
      console.error("Error al obtener pedido completo:", err);
      alert("No se pudo cargar el pedido completo");
    }
  };



  const handleEliminar = async (id: number) => {
    if (confirm("¿Deseas eliminar este pedido?")) {
      try {
        await eliminarPedido(id);
        cargarPedidos();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleCambiarEstado = async (pedido: PedidoDTO, nuevoEstado: "SURTIDO" | "ENTREGADO") => {
    try {
      await actualizarPedido(pedido.id!, { ...pedido, estado: nuevoEstado });
      cargarPedidos();
    } catch (err) {
      console.error("Error al cambiar estado:", err);
      alert("No se pudo cambiar el estado del pedido.");
    }
  };

  const pedidosFiltrados = useMemo(() => {
    return pedidos
      .filter(p => filtroEstado === "Todos" || p.estado?.toLowerCase() === filtroEstado.toLowerCase())
      .filter(p => p.cliente.toLowerCase().includes(busqueda.toLowerCase()))
      .filter(p => {
        if (!p.fecha) return false;
        const fechaPedido = new Date(p.fecha);
        if (fechaInicio && fechaPedido < new Date(fechaInicio)) return false;
        if (fechaFin && fechaPedido > new Date(fechaFin)) return false;
        return true;
      });
  }, [pedidos, busqueda, filtroEstado, fechaInicio, fechaFin]);

  useEffect(() => { searchRef.current?.focus(); }, []);

  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <SearchBar
          value={busqueda}
          onChange={setBusqueda}
          ref={searchRef}
          onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
        />
        <button
          onClick={handleNuevo}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow"
        >
          Nuevo Pedido
        </button>
      </div>

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

      <PedidoTable
        pedidos={pedidosFiltrados}
        onEditar={handleEditar}
        onEliminar={handleEliminar}
        onCambiarEstado={handleCambiarEstado}
      />

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
