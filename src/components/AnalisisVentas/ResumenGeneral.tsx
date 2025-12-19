import React, { useEffect, useState } from "react";
import { obtenerVentasDTO } from "../../api/ventas";
import { obtenerPedidos } from "../../api/pedidos";
import type { VentaResumenDTO } from "../../types/VentaResumenDTO";
import type { PedidoDTO } from "../../types/Pedido";
import { agruparVentasPorDia, totalVentas } from "../../utils/analyticsUtils";
import { TrendingUp, Calendar, DollarSign, Target, Package } from "lucide-react";

const ResumenGeneral: React.FC = () => {
  const [ventas, setVentas] = useState<VentaResumenDTO[]>([]);
  const [pedidos, setPedidos] = useState<PedidoDTO[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  
  // NUEVO: Estados solo para la ganancia estimada
  const [mesSeleccionado, setMesSeleccionado] = useState<number>(new Date().getMonth());
  const [anioSeleccionado, setAnioSeleccionado] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    const load = async () => {
      setCargando(true);
      try {
        const v = await obtenerVentasDTO();
        const p = await obtenerPedidos(); // NUEVO: Cargar pedidos también
        setVentas(v);
        setPedidos(p);
      } catch (err) {
        console.error("Error obteniendo datos:", err);
        setVentas([]);
        setPedidos([]);
      } finally {
        setCargando(false);
      }
    };
    load();
  }, []);

  const ventasPorDia = agruparVentasPorDia(ventas);

  const hoyIso = new Date().toISOString().split("T")[0];
  const ventasHoy = ventasPorDia.find((d) => d.fecha === hoyIso)?.total ?? 0;

  const ultimoMes = ventasPorDia.slice(-30);
  const promedioDiario = ultimoMes.length === 0
    ? 0
    : Number((totalVentas(ultimoMes) / ultimoMes.length).toFixed(2));

  const ahora = new Date();
  const mesActual = ahora.getMonth();
  const añoActual = ahora.getFullYear();

  const ventasMesActual = ventas
    .filter((v) => {
      if (!v.fecha) return false;
      const d = new Date(v.fecha);
      return d.getMonth() === mesActual && d.getFullYear() === añoActual;
    })
    .reduce((acc, v) => acc + Number(v.total ?? 0), 0);

  const ayerIso = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const ventasAyer = ventasPorDia.find((d) => d.fecha === ayerIso)?.total ?? 0;
  const tendenciaHoy = ventasAyer > 0 ? ((ventasHoy - ventasAyer) / ventasAyer) * 100 : 0;

  const mesAnterior = mesActual === 0 ? 11 : mesActual - 1;
  const añoMesAnterior = mesActual === 0 ? añoActual - 1 : añoActual;
  
  const ventasMesAnterior = ventas
    .filter((v) => {
      if (!v.fecha) return false;
      const d = new Date(v.fecha);
      return d.getMonth() === mesAnterior && d.getFullYear() === añoMesAnterior;
    })
    .reduce((acc, v) => acc + Number(v.total ?? 0), 0);

  const tendenciaMes = ventasMesAnterior > 0 
    ? ((ventasMesActual - ventasMesAnterior) / ventasMesAnterior) * 100 
    : 0;

  // NUEVO: Cálculo de ganancia estimada (solo para la nueva sección)
  const filtrarPorMes = (fechaStr: string | undefined, mes: number, anio: number) => {
    if (!fechaStr) return false;
    const d = new Date(fechaStr);
    return d.getMonth() === mes && d.getFullYear() === anio;
  };

  // Ventas del mes seleccionado
  const ventasMesSeleccionado = ventas
    .filter((v) => filtrarPorMes(v.fecha, mesSeleccionado, anioSeleccionado))
    .reduce((acc, v) => acc + Number(v.total ?? 0), 0);

  // Pedidos entregados del mes seleccionado
  const pedidosEntregadosMesSeleccionado = pedidos
    .filter((p) => {
      const esEntregado = p.estado?.toLowerCase() === "entregado";
      return esEntregado && filtrarPorMes(p.fecha, mesSeleccionado, anioSeleccionado);
    })
    .reduce((acc, p) => acc + Number(p.total ?? 0), 0);

  // Ganancia estimada (ventas - pedidos entregados)
  const gananciaEstimada = ventasMesSeleccionado - pedidosEntregadosMesSeleccionado;

  if (cargando) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const MetricCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    description 
  }: { 
    title: string;
    value: string;
    icon: React.ElementType;
    trend?: number;
    description?: string;
  }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${
          title.includes("hoy") ? "bg-blue-50 text-blue-600" :
          title.includes("promedio") ? "bg-green-50 text-green-600" :
          title.includes("Ganancia") ? "bg-amber-50 text-amber-600" :
          "bg-purple-50 text-purple-600"
        }`}>
          <Icon size={24} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-medium ${
            trend > 0 ? "text-green-600" : trend < 0 ? "text-red-600" : "text-gray-500"
          }`}>
            <TrendingUp size={16} className={trend < 0 ? "transform rotate-180" : ""} />
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
      
      <div className="mb-2">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-lg font-semibold text-gray-700 mt-1">{title}</div>
      </div>
      
      {description && (
        <div className="text-sm text-gray-500 mt-2">{description}</div>
      )}
    </div>
  );

  // NUEVO: Lista de meses y años para el selector
  const meses = [
    { value: 0, label: "Enero" },
    { value: 1, label: "Febrero" },
    { value: 2, label: "Marzo" },
    { value: 3, label: "Abril" },
    { value: 4, label: "Mayo" },
    { value: 5, label: "Junio" },
    { value: 6, label: "Julio" },
    { value: 7, label: "Agosto" },
    { value: 8, label: "Septiembre" },
    { value: 9, label: "Octubre" },
    { value: 10, label: "Noviembre" },
    { value: 11, label: "Diciembre" },
  ];

  // Generar lista de años disponibles (últimos 5 años y el próximo)
  const aniosDisponibles = Array.from(
    { length: 6 }, 
    (_, i) => new Date().getFullYear() - i + 1
  ).sort((a, b) => b - a); // Ordenar de mayor a menor

  return (
    <div className="space-y-6">
      {/* TRES MÉTRICAS ORIGINALES (igual que antes) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Ventas hoy"
          value={`$${ventasHoy.toFixed(2)}`}
          icon={DollarSign}
          trend={tendenciaHoy}
          description={ventasAyer > 0 ? `Vs. ayer: $${ventasAyer.toFixed(2)}` : "Sin datos del día anterior"}
        />

        <MetricCard
          title="Promedio diario"
          value={`$${promedioDiario.toFixed(2)}`}
          icon={Target} 
          description="Últimos 30 días"
        />

        <MetricCard
          title="Ventas del mes"
          value={`$${ventasMesActual.toFixed(2)}`}
          icon={Calendar}
          trend={tendenciaMes}
          description={ventasMesAnterior > 0 ? `Mes anterior: $${ventasMesAnterior.toFixed(2)}` : "Primer mes con datos"}
        />
      </div>

      {/* NUEVA SECCIÓN: Ganancia estimada */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Ganancia Estimada</h3>
            <p className="text-gray-600 text-sm mt-1">
              Ventas netas descontando pedidos entregados (estimación)
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Selector de año */}
            <div className="relative">
              <select
                value={anioSeleccionado}
                onChange={(e) => setAnioSeleccionado(Number(e.target.value))}
                className="appearance-none bg-white border border-gray-300 rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 text-sm font-medium"
              >
                {aniosDisponibles.map((anio) => (
                  <option key={anio} value={anio}>{anio}</option>
                ))}
              </select>
            </div>

            {/* Selector de mes */}
            <div className="relative">
              <select
                value={mesSeleccionado}
                onChange={(e) => setMesSeleccionado(Number(e.target.value))}
                className="appearance-none bg-white border border-gray-300 rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 text-sm font-medium"
              >
                {meses.map((mes) => (
                  <option key={mes.value} value={mes.value}>{mes.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Ventas del mes seleccionado */}
          <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
                <DollarSign size={20} />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Ventas totales</h4>
                <p className="text-sm text-gray-600">{meses.find(m => m.value === mesSeleccionado)?.label} {anioSeleccionado}</p>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">${ventasMesSeleccionado.toFixed(2)}</div>
          </div>

          {/* Pedidos entregados del mes seleccionado */}
          <div className="bg-rose-50 rounded-xl border border-rose-200 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-rose-100 text-rose-600">
                <Package size={20} />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Pedidos entregados</h4>
                <p className="text-sm text-gray-600">{meses.find(m => m.value === mesSeleccionado)?.label} {anioSeleccionado}</p>
              </div>
            </div>
            <div className="text-2xl font-bold text-rose-600">-${pedidosEntregadosMesSeleccionado.toFixed(2)}</div>
          </div>

          {/* Ganancia estimada (resultado) */}
          <div className={`rounded-xl border p-5 ${
            gananciaEstimada >= 0 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${
                gananciaEstimada >= 0 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-red-100 text-red-600'
              }`}>
                <TrendingUp size={20} className={gananciaEstimada < 0 ? "transform rotate-180" : ""} />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Ganancia estimada</h4>
                <p className="text-sm text-gray-600">{meses.find(m => m.value === mesSeleccionado)?.label} {anioSeleccionado}</p>
              </div>
            </div>
            <div className={`text-2xl font-bold ${
              gananciaEstimada >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              ${gananciaEstimada.toFixed(2)}
            </div>
            <div className="text-sm text-gray-500 mt-2">
              {gananciaEstimada >= 0 ? 'Resultado positivo' : 'Resultado negativo'}
            </div>
          </div>
        </div>

        {/* Desglose de la fórmula */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">Desglose del cálculo:</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-700">Ventas totales del mes:</span>
              <span className="font-medium">${ventasMesSeleccionado.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-700">Menos: Pedidos entregados:</span>
              <span className="font-medium text-rose-600">-${pedidosEntregadosMesSeleccionado.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
              <span className="font-bold text-gray-900">Ganancia estimada:</span>
              <span className={`font-bold ${
                gananciaEstimada >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ${gananciaEstimada.toFixed(2)}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-3">
              Nota: Esta es una estimación que resta el total de pedidos con estado "entregado" 
              de las ventas totales del mes seleccionado.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumenGeneral;