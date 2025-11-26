// src/utils/analyticsUtils.ts
import type { VentaResumenDTO, VentaDetalleResumenDTO } from "../types/VentaResumenDTO";

export type SeriePunto = {
  fecha: string; // YYYY-MM-DD (día) o YYYY-WW (semana) o YYYY-MM (mes) o YYYY (año)
  total: number;
};

/**
 * Agrupa ventas por día (fecha ISO yyyy-MM-dd)
 */
export function agruparVentasPorDia(ventas: VentaResumenDTO[]): SeriePunto[] {
  const map = new Map<string, number>();
  for (const v of ventas) {
    const fechaIso = (v.fecha ?? "").split("T")[0] || new Date().toISOString().split("T")[0];
    const current = map.get(fechaIso) ?? 0;
    map.set(fechaIso, current + Number(v.total ?? 0));
  }
  const arr = Array.from(map.entries()).map(([fecha, total]) => ({ fecha, total }));
  arr.sort((a, b) => a.fecha.localeCompare(b.fecha));
  return arr;
}

/**
 * Agrupa ventas por semana ISO (YYYY-WW)
 */
export function agruparVentasPorSemana(ventas: VentaResumenDTO[]): SeriePunto[] {
  const map = new Map<string, number>();

  // --- Agrupar por año-semana ---
  for (const v of ventas) {
    const d = new Date(v.fecha ?? "");
    const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));

    // ISO week: mover al jueves de la semana
    tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));

    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
    const diffDays = Math.floor((tmp.getTime() - yearStart.getTime()) / 86400000);
    const weekNo = Math.floor((diffDays + 1) / 7) + 1;

    const key = `${tmp.getUTCFullYear()}-${String(weekNo).padStart(2, "0")}`;
    const current = map.get(key) ?? 0;
    map.set(key, current + Number(v.total ?? 0));
  }

  // --- Convertir a rango legible ---
  const formatearSemana = (year: number, week: number): string => {
    const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
    const dow = simple.getUTCDay();
    const monday = new Date(simple);

    if (dow <= 4) {
      monday.setUTCDate(simple.getUTCDate() - simple.getUTCDay() + 1);
    } else {
      monday.setUTCDate(simple.getUTCDate() + 8 - simple.getUTCDay());
    }

    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);

    const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

    const diaIni = String(monday.getUTCDate()).padStart(2, "0");
    const diaFin = String(sunday.getUTCDate()).padStart(2, "0");
    const mes = meses[monday.getUTCMonth()];

    return `${diaIni}–${diaFin} ${mes}`;
  };

  // --- Crear arreglo con clave auxiliar ---
  const arr = Array.from(map.entries())
    .map(([key, total]) => {
      const [yearStr, weekStr] = key.split("-");
      const year = Number(yearStr);
      const week = Number(weekStr);
      const rangoLegible = formatearSemana(year, week);

      return {
        fecha: rangoLegible,
        total,
        orden: key // <-- clave para ordenar cronológicamente
      };
    });

  // --- Ordenar cronológicamente ---
  arr.sort((a, b) => a.orden.localeCompare(b.orden));

  // --- Elimina la clave auxiliar antes de devolver ---
  return arr.map(({ fecha, total }) => ({ fecha, total }));
}



/**
 * Agrupa ventas por mes (YYYY-MM)
 */
export function agruparVentasPorMes(ventas: VentaResumenDTO[]): SeriePunto[] {
  const map = new Map<string, number>();
  for (const v of ventas) {
    const fecha = v.fecha ? v.fecha.split("T")[0] : new Date().toISOString().split("T")[0];
    const parts = fecha.split("-");
    const key = `${parts[0]}-${parts[1]}`; // YYYY-MM
    const current = map.get(key) ?? 0;
    map.set(key, current + Number(v.total ?? 0));
  }
  const arr = Array.from(map.entries()).map(([fecha, total]) => ({ fecha, total }));
  arr.sort((a, b) => a.fecha.localeCompare(b.fecha));
  return arr;
}

/**
 * Agrupa ventas por año (YYYY)
 */
export function agruparVentasPorAnio(ventas: VentaResumenDTO[]): SeriePunto[] {
  const map = new Map<string, number>();
  for (const v of ventas) {
    const year = v.fecha ? v.fecha.split("T")[0].split("-")[0] : String(new Date().getFullYear());
    const current = map.get(year) ?? 0;
    map.set(year, current + Number(v.total ?? 0));
  }
  const arr = Array.from(map.entries()).map(([fecha, total]) => ({ fecha, total }));
  arr.sort((a, b) => a.fecha.localeCompare(b.fecha));
  return arr;
}

/**
 * Top productos — recibe ventas en formato DTO y extrae los detalles.
 */
export function obtenerTopProductos(
  ventas: VentaResumenDTO[],
  topN: number
): { productoId: number; descripcion: string; cantidadTotal: number; subtotalTotal: number }[] {
  const map = new Map<number, { descripcion: string; cantidadTotal: number; subtotalTotal: number }>();

  for (const v of ventas) {
    const detalles = (v.detalles ?? []) as VentaDetalleResumenDTO[];
    for (const d of detalles) {
      const pid = d.productoId ?? null;
      if (pid === null) continue;

      const cantidad = Number(d.cantidad ?? 0);
      const subtotal = Number(d.subtotal ?? (d.precio ?? 0) * (d.cantidad ?? 0));
      const descripcion = d.descripcion ?? `#${pid}`;

      const current = map.get(pid);
      if (!current) {
        map.set(pid, { descripcion, cantidadTotal: cantidad, subtotalTotal: subtotal });
      } else {
        current.cantidadTotal += cantidad;
        current.subtotalTotal += subtotal;
        map.set(pid, current);
      }
    }
  }

  const arr = Array.from(map.entries()).map(([productoId, v]) => ({
    productoId,
    descripcion: v.descripcion,
    cantidadTotal: v.cantidadTotal,
    subtotalTotal: v.subtotalTotal,
  }));

  arr.sort((a, b) => b.cantidadTotal - a.cantidadTotal);
  return arr.slice(0, topN);
}

/**
 * Suma totales de una serie
 */
export function totalVentas(series: { fecha: string; total: number }[]) {
  return series.reduce((acc, s) => acc + Number(s.total ?? 0), 0);
}
