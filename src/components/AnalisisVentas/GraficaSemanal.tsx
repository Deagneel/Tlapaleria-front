import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { obtenerVentasDTO } from "../../api/ventas";
import type { VentaResumenDTO } from "../../types/VentaResumenDTO";
import { agruparVentasPorSemana } from "../../utils/analyticsUtils";

const GraficaSemanal: React.FC = () => {
  const [data, setData] = useState<{ fecha: string; total: number }[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const ventas: VentaResumenDTO[] = await obtenerVentasDTO();
        const weeks = agruparVentasPorSemana(ventas);
        const last12 = weeks.slice(-12);
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
      <h3 className="text-lg font-semibold mb-2">Ventas por semana (últimas 12)</h3>

      {loading ? (
        <div>Cargando...</div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="fecha" />
            <YAxis />
            <Tooltip formatter={(val: number | string) => `$${Number(val ?? 0).toFixed(2)}`} />
            <Bar dataKey="total" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default GraficaSemanal;
