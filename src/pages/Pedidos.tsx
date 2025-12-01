import React, { useEffect, useState, useRef, useMemo } from "react";
import Layout from "../components/Layout";
import SearchBar from "../components/SearchBar";
import PedidoModal from "../components/PedidoModal";
import PedidoTable from "../components/PedidoTable";
import { obtenerPedidos, eliminarPedido, actualizarPedido } from "../api/pedidos";
import type { PedidoDTO } from "../types/Pedido";
import type { PedidoFullDTO } from "../types/PedidoDTO"; 
import { obtenerPedidoCompleto } from "../api/pedidos";
import { PlusCircle, Filter, Calendar, Users } from "lucide-react";

const Pedidos: React.FC = () => {
  const [pedidos, setPedidos] = useState<PedidoDTO[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<PedidoFullDTO | null>(null);
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
    const filtrados = pedidos
      .filter(
        (p) =>
          filtroEstado === "Todos" ||
          p.estado?.toLowerCase() === filtroEstado.toLowerCase()
      )
      .filter((p) => p.cliente.toLowerCase().includes(busqueda.toLowerCase()))
      .filter((p) => {
        if (!p.fecha) return false;

        const fechaPedido = new Date(p.fecha);
        const fechaPedidoLocal = new Date(
          fechaPedido.getFullYear(),
          fechaPedido.getMonth(),
          fechaPedido.getDate()
        );

        const inicio = fechaInicio ? new Date(fechaInicio) : null;
        const fin = fechaFin ? new Date(fechaFin) : null;

        const inicioLocal = inicio
          ? new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate())
          : null;

        const finLocal = fin
          ? new Date(fin.getFullYear(), fin.getMonth(), fin.getDate())
          : null;

        if (inicioLocal && fechaPedidoLocal < inicioLocal) return false;
        if (finLocal && fechaPedidoLocal > finLocal) return false;

        return true;
      });

    const orden: Record<string, number> = {
      PENDIENTE: 1,
      SURTIDO: 2,
      ENTREGADO: 3,
    };

      return filtrados.sort((a, b) => {
      const estadoA = a.estado?.toUpperCase() || "";
      const estadoB = b.estado?.toUpperCase() || "";
      const ordenEstado = (orden[estadoA] || 99) - (orden[estadoB] || 99);

      if (ordenEstado !== 0) return ordenEstado;

      const fechaA = a.fecha ? new Date(a.fecha).getTime() : 0;
      const fechaB = b.fecha ? new Date(b.fecha).getTime() : 0;
      return fechaB - fechaA;
    });

  }, [pedidos, busqueda, filtroEstado, fechaInicio, fechaFin]);

  // Estadísticas rápidas
  const estadisticas = useMemo(() => {
    const total = pedidosFiltrados.length;
    const pendientes = pedidosFiltrados.filter(p => p.estado?.toUpperCase() === "PENDIENTE").length;
    const surtidos = pedidosFiltrados.filter(p => p.estado?.toUpperCase() === "SURTIDO").length;
    const entregados = pedidosFiltrados.filter(p => p.estado?.toUpperCase() === "ENTREGADO").length;
    
    return { total, pendientes, surtidos, entregados };
  }, [pedidosFiltrados]);

  return (
    <Layout>
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Pedidos</h1>
        </div>
        
        <button
          onClick={handleNuevo}
          className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3.5 rounded-xl hover:shadow-lg transition-all duration-200 font-semibold shadow-md"
        >
          <PlusCircle size={20} className="flex-shrink-0" />
          Nuevo Pedido
        </button>
      </div>

      <div className="mb-6">
        <SearchBar
          value={busqueda}
          onChange={setBusqueda}
          ref={searchRef}
          onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{estadisticas.total}</p>
              <p className="text-sm text-gray-600">Total Pedidos</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Users size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{estadisticas.pendientes}</p>
              <p className="text-sm text-gray-600">Pendientes</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Users size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{estadisticas.surtidos}</p>
              <p className="text-sm text-gray-600">Surtidos</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{estadisticas.entregados}</p>
              <p className="text-sm text-gray-600">Entregados</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-blue-100 rounded-lg">
            <Filter size={16} className="text-blue-600" />
          </div>
          <label className="text-sm font-medium text-gray-700">Estado:</label>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="border border-gray-300 rounded-xl px-3 py-2 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
          >
            <option value="Todos">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="surtido">Surtido</option>
            <option value="entregado">Entregado</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-green-100 rounded-lg">
            <Calendar size={16} className="text-green-600" />
          </div>
          <label className="text-sm font-medium text-gray-700">Fecha inicio:</label>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="border border-gray-300 rounded-xl px-3 py-2 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-purple-100 rounded-lg">
            <Calendar size={16} className="text-purple-600" />
          </div>
          <label className="text-sm font-medium text-gray-700">Fecha fin:</label>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="border border-gray-300 rounded-xl px-3 py-2 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
          />
        </div>

        {(filtroEstado !== "Todos" || fechaInicio || fechaFin) && (
          <button
            onClick={() => {
              setFiltroEstado("Todos");
              setFechaInicio("");
              setFechaFin("");
            }}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 text-sm font-medium ml-auto"
          >
            <Filter size={14} />
            Limpiar Filtros
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <PedidoTable
          pedidos={pedidosFiltrados}
          onEditar={handleEditar}
          onEliminar={handleEliminar}
          onCambiarEstado={handleCambiarEstado}
        />
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