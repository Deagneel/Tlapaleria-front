import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  Cell,
} from "recharts";

import { obtenerVentasDTO } from "../../api/ventas";
import type { VentaResumenDTO } from "../../types/VentaResumenDTO";
import { agruparVentasPorMes } from "../../utils/analyticsUtils";

const MONTH_LABELS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];


type MyTooltipProps = {
  active?: boolean;
  payload?: {
    value: number;
    payload: {
      total1: number;
      total2: number;
    };
  }[];
  label?: string;
};

const CustomTooltip: React.FC<MyTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;

  const totalActual = Number(payload[0].payload.total1);
  const totalComparado = Number(payload[0].payload.total2);

  const diferencia = totalActual - totalComparado;
  const porcentaje = totalComparado !== 0 ? (diferencia / totalComparado) * 100 : 0;

  const sube = porcentaje >= 0;
  const color = sube ? "text-green-600" : "text-red-600";
  const icono = sube ? "▲" : "▼";

  return (
    <div className="bg-white p-4 border border-gray-200 rounded-xl shadow-lg">
      <p className="font-bold text-gray-900 mb-2">{label}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-gray-600">Total:</span>
          <span className="font-semibold">${totalActual.toFixed(2)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-600">Comparado:</span>
          <span className="font-semibold">${totalComparado.toFixed(2)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-600">Diferencia:</span>
          <span className={`font-semibold ${color}`}>
            ${Math.abs(diferencia).toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between gap-4 pt-2 border-t border-gray-100">
          <span className="text-gray-600">Variación:</span>
          <span className={`font-bold ${color}`}>
            {icono} {Math.abs(porcentaje).toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
};


const ComparadorMeses: React.FC = () => {
  const hoy = new Date();
  const [ventas, setVentas] = useState<VentaResumenDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const [mes1, setMes1] = useState(hoy.getMonth() + 1);
  const [anio1, setAnio1] = useState(hoy.getFullYear());

  const [mes2, setMes2] = useState(hoy.getMonth() + 1);
  const [anio2, setAnio2] = useState(hoy.getFullYear() - 1);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        setVentas(await obtenerVentasDTO());
      } catch (error) {
        console.error("Error cargando ventas:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const mesesAgrupados = useMemo(() => agruparVentasPorMes(ventas), [ventas]);

  const calcularTotal = (mes: number, anio: number): number => {
    const item = mesesAgrupados.find((m) => {
      const [yStr, mesStr] = m.fecha.split("-");
      return Number(yStr) === anio && Number(mesStr) === mes;
    });
    return item?.total ?? 0;
  };

  const total1 = calcularTotal(mes1, anio1);
  const total2 = calcularTotal(mes2, anio2);

  const chartData = [
    {
      name: `${MONTH_LABELS[mes1 - 1]} ${anio1}`,
      total: total1,
      total1: total1,
      total2: total2,
    },
    {
      name: `${MONTH_LABELS[mes2 - 1]} ${anio2}`,
      total: total2,
      total1: total2,
      total2: total1,
    },
  ];

  const aniosDisponibles = useMemo(() => {
    const s = new Set<number>();
    ventas.forEach((v) => s.add(new Date(v.fecha).getFullYear()));
    return Array.from(s).sort((a, b) => b - a);
  }, [ventas]);

  const diferencia = total1 - total2;
  const porcentaje = total2 !== 0 ? (diferencia / total2) * 100 : 0;
  const esPositivo = diferencia >= 0;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Comparador de Meses</h2>
        <p className="text-gray-600 mt-1">Análisis comparativo de ventas por período</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        
        {/* Mes A Comparar */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl border border-blue-200">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            Mes Actual
          </h3>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <select
                className="appearance-none w-full bg-white border border-gray-300 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-medium"
                value={mes1}
                onChange={(e) => setMes1(Number(e.target.value))}
              >
                {MONTH_LABELS.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            <div className="relative flex-1">
              <select
                className="appearance-none w-full bg-white border border-gray-300 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-medium"
                value={anio1}
                onChange={(e) => setAnio1(Number(e.target.value))}
              >
                {aniosDisponibles.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
          <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">${total1.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Total de ventas</div>
          </div>
        </div>

        {/* Mes de Comparación */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-xl border border-purple-200">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            Mes de Comparación
          </h3>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <select
                className="appearance-none w-full bg-white border border-gray-300 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 font-medium"
                value={mes2}
                onChange={(e) => setMes2(Number(e.target.value))}
              >
                {MONTH_LABELS.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            <div className="relative flex-1">
              <select
                className="appearance-none w-full bg-white border border-gray-300 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 font-medium"
                value={anio2}
                onChange={(e) => setAnio2(Number(e.target.value))}
              >
                {aniosDisponibles.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
          <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-purple-600">${total2.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Total de ventas</div>
          </div>
        </div>
      </div>

      {/* Indicador de Resultado */}
      <div className={`flex items-center justify-between p-4 mb-6 rounded-xl ${
        esPositivo ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${esPositivo ? 'bg-green-500' : 'bg-red-500'}`}>
            {esPositivo ? (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            )}
          </div>
          <div>
            <span className={`text-lg font-bold ${esPositivo ? 'text-green-700' : 'text-red-700'}`}>
              {esPositivo ? 'Crecimiento' : 'Disminución'}: {Math.abs(porcentaje).toFixed(2)}%
            </span>
            <p className="text-sm text-gray-600">
              Diferencia: ${Math.abs(diferencia).toFixed(2)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${esPositivo ? 'text-green-600' : 'text-red-600'}`}>
            {esPositivo ? '+' : ''}${diferencia.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => {
            setMes1(hoy.getMonth() + 1);
            setAnio1(hoy.getFullYear());
            setMes2(hoy.getMonth());
            setAnio2(hoy.getFullYear());
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-xl transition-all duration-200 font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Mes actual vs anterior
        </button>

        <button
          onClick={() => {
            setMes1(hoy.getMonth() + 1);
            setAnio1(hoy.getFullYear());
            setMes2(hoy.getMonth() + 1);
            setAnio2(hoy.getFullYear() - 1);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 rounded-xl transition-all duration-200 font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Vs mismo mes año pasado
        </button>
      </div>

      {/* Gráfica */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} barSize={80}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="name" 
                tick={{ fill: '#374151' }}
                axisLine={{ stroke: '#d1d5db' }}
              />
              <YAxis 
                tick={{ fill: '#374151' }}
                axisLine={{ stroke: '#d1d5db' }}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={index === 0 ? "#3b82f6" : "#8b5cf6"} 
                    strokeWidth={2}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default ComparadorMeses;