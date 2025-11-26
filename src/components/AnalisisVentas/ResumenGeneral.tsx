import React, { useEffect, useState } from "react";
import { obtenerVentasDTO } from "../../api/ventas";
import type { VentaResumenDTO } from "../../types/VentaResumenDTO";
import { agruparVentasPorDia, totalVentas } from "../../utils/analyticsUtils";
import { TrendingUp, Calendar, DollarSign, Target } from "lucide-react";

const ResumenGeneral: React.FC = () => {
  const [ventas, setVentas] = useState<VentaResumenDTO[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      setCargando(true);
      try {
        const v = await obtenerVentasDTO();
        setVentas(v);
      } catch (err) {
        console.error("Error obteniendo ventas:", err);
        setVentas([]);
      } finally {
        setCargando(false);
      }
    };
    load();
  }, []);

  // --- Ventas por día ---
  const ventasPorDia = agruparVentasPorDia(ventas);

  // --- Ventas del día ---
  const hoyIso = new Date().toISOString().split("T")[0];
  const ventasHoy = ventasPorDia.find((d) => d.fecha === hoyIso)?.total ?? 0;

  // --- Promedio diario últimos 30 días ---
  const ultimoMes = ventasPorDia.slice(-30);
  const promedioDiario = ultimoMes.length === 0
    ? 0
    : Number((totalVentas(ultimoMes) / ultimoMes.length).toFixed(2));

  // --- Ventas del mes actual ---
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

  // --- Indicadores de tendencia ---
  const ayerIso = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const ventasAyer = ventasPorDia.find((d) => d.fecha === ayerIso)?.total ?? 0;
  const tendenciaHoy = ventasAyer > 0 ? ((ventasHoy - ventasAyer) / ventasAyer) * 100 : 0;

  // Mes anterior para comparación
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

  return (
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
        icon={Target}  // Cambiado de TrendingUp a Target
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
  );
};

export default ResumenGeneral;