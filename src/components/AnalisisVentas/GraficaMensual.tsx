import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { obtenerVentasDTO } from "../../api/ventas";
import type { VentaResumenDTO } from "../../types/VentaResumenDTO";
import { agruparVentasPorMes } from "../../utils/analyticsUtils";

const GraficaMensual: React.FC = () => {
  const [data, setData] = useState<{ fecha: string; total: number }[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const ventas: VentaResumenDTO[] = await obtenerVentasDTO();
        const months = agruparVentasPorMes(ventas);
        const last12 = months.slice(-12);
        setData(last12);
      } catch (err) {
        console.error("Error cargando ventas:", err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="text-lg font-semibold mb-2">Ventas por mes (últimos 12)</h3>

      {loading ? (
        <div>Cargando...</div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="fecha" />
            <YAxis />
            <Tooltip formatter={(val: number | string) => `$${Number(val ?? 0).toFixed(2)}`} />
            <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2} dot />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default GraficaMensual;
