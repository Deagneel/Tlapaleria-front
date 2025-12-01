import React, { useEffect, useState, useMemo } from "react";
import { obtenerVentasDTO } from "../../api/ventas";
import type { VentaResumenDTO } from "../../types/VentaResumenDTO";
import { obtenerTopProductos } from "../../utils/analyticsUtils";

function esMismoDia(fecha: Date, referencia: Date): boolean {
  return (
    fecha.getFullYear() === referencia.getFullYear() &&
    fecha.getMonth() === referencia.getMonth() &&
    fecha.getDate() === referencia.getDate()
  );
}

function esMismaSemana(fecha: Date, referencia: Date): boolean {
  const f1 = new Date(fecha);
  const f2 = new Date(referencia);

  const getSemana = (d: Date) => {
    const oneJan = new Date(d.getFullYear(), 0, 1);
    const ms = d.getTime() - oneJan.getTime();
    return Math.floor(ms / (1000 * 60 * 60 * 24 * 7));
  };

  return (
    fecha.getFullYear() === referencia.getFullYear() &&
    getSemana(f1) === getSemana(f2)
  );
}

function esMismoMes(fecha: Date, referencia: Date): boolean {
  return (
    fecha.getFullYear() === referencia.getFullYear() &&
    fecha.getMonth() === referencia.getMonth()
  );
}

function esMismoAnio(fecha: Date, referencia: Date): boolean {
  return fecha.getFullYear() === referencia.getFullYear();
}

const TablaProductosMasVendidos: React.FC = () => {
  const [topN, setTopN] = useState<number>(10);
  const [filtro, setFiltro] = useState<string>("mes");
  const [loading, setLoading] = useState<boolean>(true);
  const [ventasActuales, setVentasActuales] = useState<VentaResumenDTO[]>([]);
  const [topProductos, setTopProductos] = useState<
    { productoId: number; descripcion: string; cantidadTotal: number; subtotalTotal: number }[]
  >([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const ventas = await obtenerVentasDTO();
        const hoy = new Date();

        let actuales = ventas;

        const ayer = new Date(hoy);
        ayer.setDate(hoy.getDate() - 1);

        const semanaPasada = new Date(hoy);
        semanaPasada.setDate(hoy.getDate() - 7);

        const mesPasado = new Date(hoy);
        mesPasado.setMonth(hoy.getMonth() - 1);

        const anioPasado = new Date(hoy);
        anioPasado.setFullYear(hoy.getFullYear() - 1);

        if (filtro === "dia") {
          actuales = ventas.filter((v) => esMismoDia(new Date(v.fecha), hoy));
        } else if (filtro === "semana") {
          actuales = ventas.filter((v) => esMismaSemana(new Date(v.fecha), hoy));
        } else if (filtro === "mes") {
          actuales = ventas.filter((v) => esMismoMes(new Date(v.fecha), hoy));
        } else if (filtro === "anio") {
          actuales = ventas.filter((v) => esMismoAnio(new Date(v.fecha), hoy));
        }

        setVentasActuales(actuales);

        const top = obtenerTopProductos(actuales, topN);
        setTopProductos(top);
      } catch (err) {
        console.error("Error cargando ventas:", err);
        setVentasActuales([]);
        setTopProductos([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [topN, filtro]);

  const crecimiento = useMemo(() => {
    const totalActual = ventasActuales.reduce((acc, v) => acc + v.total, 0);

    if (filtro === "general") {
      return { porcentaje: null, color: "text-gray-500" };
    }

    const hoy = new Date();
    const fechaAnterior = new Date();

    if (filtro === "dia") fechaAnterior.setDate(hoy.getDate() - 1);
    if (filtro === "semana") fechaAnterior.setDate(hoy.getDate() - 7);
    if (filtro === "mes") fechaAnterior.setMonth(hoy.getMonth() - 1);
    if (filtro === "anio") fechaAnterior.setFullYear(hoy.getFullYear() - 1);

    const ventasAnteriores = ventasActuales.filter((v) => {
      const f = new Date(v.fecha);
      if (filtro === "dia") return esMismoDia(f, fechaAnterior);
      if (filtro === "semana") return esMismaSemana(f, fechaAnterior);
      if (filtro === "mes") return esMismoMes(f, fechaAnterior);
      if (filtro === "anio") return esMismoAnio(f, fechaAnterior);
      return false;
    });

    const totalAnterior = ventasAnteriores.reduce((acc, v) => acc + v.total, 0);

    if (totalAnterior === 0) {
      return { porcentaje: null, color: "text-gray-500" };
    }

    const diferencia = ((totalActual - totalAnterior) / totalAnterior) * 100;
    const color = diferencia >= 0 ? "text-green-600" : "text-red-600";

    return {
      porcentaje: diferencia,
      color
    };
  }, [ventasActuales, filtro]);


  const formatCurrency = (n: number) => 
    n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Productos Más Vendidos</h3>
          <p className="text-gray-600 text-sm mt-1">Análisis de productos por período</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Selector de período */}
          <div className="relative">
            <select
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm font-medium"
            >
              <option value="dia">Hoy</option>
              <option value="semana">Esta semana</option>
              <option value="mes">Este mes</option>
              <option value="anio">Este año</option>
              <option value="general">General</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Selector de top N */}
          <div className="relative">
            <select
              value={topN}
              onChange={(e) => setTopN(Number(e.target.value))}
              className="appearance-none bg-white border border-gray-300 rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm font-medium"
            >
              <option value={5}>Top 5</option>
              <option value={10}>Top 10</option>
              <option value={20}>Top 20</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>


      {crecimiento.porcentaje !== null && (
        <div className={`flex items-center gap-2 mb-6 p-4 bg-gradient-to-r ${crecimiento.porcentaje >= 0 ? 'from-green-50 to-green-100 border border-green-200' : 'from-red-50 to-red-100 border border-red-200'} rounded-xl`}>
          <div className={`p-2 rounded-lg ${crecimiento.porcentaje >= 0 ? 'bg-green-500' : 'bg-red-500'}`}>
            {crecimiento.porcentaje >= 0 ? (
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            )}
          </div>
          <div>
            <span className={`font-semibold ${crecimiento.color}`}>
              {crecimiento.porcentaje >= 0 ? "Crecimiento: " : "Disminución: "}
              {Math.abs(crecimiento.porcentaje).toFixed(2)}%
            </span>
            <p className="text-sm text-gray-600 mt-1">
              Comparado con el período anterior
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="overflow-hidden border border-gray-200 rounded-xl">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="p-4 text-left font-semibold text-gray-700">Producto</th>
                <th className="p-4 text-right font-semibold text-gray-700">Cantidad</th>
                <th className="p-4 text-right font-semibold text-gray-700">Total Vendido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {topProductos.map((p, index) => (
                <tr 
                  key={p.productoId} 
                  className="hover:bg-gray-50 transition-colors duration-150"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-sm">
                          #{index + 1}
                        </span>
                      </div>
                      <span className="font-medium text-gray-900">{p.descripcion}</span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {p.cantidadTotal.toLocaleString()} unidades
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <span className="font-bold text-green-600">
                      ${formatCurrency(p.subtotalTotal)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {topProductos.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>No hay datos disponibles para este período</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TablaProductosMasVendidos;