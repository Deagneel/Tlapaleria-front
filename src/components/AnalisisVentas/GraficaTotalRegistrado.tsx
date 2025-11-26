import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from "recharts";
import { obtenerVentasDTO } from "../../api/ventas";
import type { VentaResumenDTO } from "../../types/VentaResumenDTO";

interface PuntoAnual {
  anio: string;
  total: number;
}

const GraficaTotalRegistrado: React.FC = () => {
  const [data, setData] = useState<PuntoAnual[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalGeneral, setTotalGeneral] = useState<number>(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const ventas: VentaResumenDTO[] = await obtenerVentasDTO();

        const map = new Map<string, number>();
        let acumulado = 0;

        ventas.forEach((v) => {
          if (!v.fecha) return;
          const d = new Date(v.fecha);
          const year = d.getFullYear().toString();

          const monto = Number(v.total ?? 0);
          acumulado += monto;

          map.set(year, (map.get(year) ?? 0) + monto);
        });

        const arr = Array.from(map.entries())
          .map(([anio, total]) => ({ anio, total }))
          .sort((a, b) => a.anio.localeCompare(b.anio));

        setData(arr);
        setTotalGeneral(acumulado);
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
    <div className="p-4 bg-white rounded shadow space-y-4">
      <h3 className="text-lg font-semibold">Total registrado por año</h3>

      {/* Totales visibles */}
      <div className="bg-gray-50 p-3 rounded border space-y-2">
        <div className="text-base font-semibold">
          Total registrado (histórico):
        </div>
        <div className="text-2xl font-bold text-blue-600">
          ${totalGeneral.toFixed(2)}
        </div>

        <hr />

        <div className="text-sm text-gray-600">Totales por año:</div>
        <ul className="text-sm space-y-1">
          {data.map((p) => (
            <li key={p.anio} className="flex justify-between">
              <span>Año {p.anio}:</span>
              <span className="font-medium">
                ${p.total.toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Gráfica */}
      {loading ? (
        <div>Cargando...</div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="anio" />
            <YAxis />
            <Tooltip formatter={(val: number) => `$${val.toFixed(2)}`} />

            <Line
              type="monotone"
              dataKey="total"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default GraficaTotalRegistrado;
