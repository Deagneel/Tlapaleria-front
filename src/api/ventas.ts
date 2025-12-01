import axios from "axios";
import type { VentaDTO, VentaResponse } from "../types/Venta";
import type { VentaDetalleDTO } from "../types/VentaDetalleDTO";
import type { VentaResumenHistorial } from "../types/VentaDetalleDTO";
import type { HistorialMonth } from "../types/VentaDetalleDTO";
import type { HistorialWeek } from "../types/VentaDetalleDTO";
import type { ProductoVendido } from "../types/VentaDetalleDTO";
import type { VentaResumenDTO } from "../types/VentaResumenDTO";


const API_URL = import.meta.env.VITE_API_URL + "/ventas";

export const crearVenta = async (venta: VentaDTO): Promise<VentaResponse> => {
  const { data } = await axios.post<VentaResponse>(API_URL, venta);
  return data;
};

export const obtenerVentas = async () => {
  const { data } = await axios.get(API_URL);
  return data;
};

export const calcularCambio = async (total: number, pagoCon: number) => {
  const { data } = await axios.get(`${API_URL}/cambio`, {
    params: { total, pagoCon },
  });
  return data;
};

export async function obtenerMeses(): Promise<HistorialMonth[]> {
  const res = await axios.get(`${API_URL}/historial/meses`);
  return res.data;
}

export async function obtenerSemanasPorMes(year: number, month: number): Promise<HistorialWeek[]> {
  const res = await axios.get(`${API_URL}/historial/${year}/mes/${month}/semanas`);
  return res.data;
}


export async function obtenerHistorialPorSemana(year: number, week: number) {
  const res = await axios.get(`${API_URL}/historial/${year}/${week}`);
  return res.data;
}


export async function obtenerVentasPorDia(dateIso: string): Promise<VentaResumenHistorial[]> {
  const res = await axios.get(`${API_URL}/historial/dia/${dateIso}`);
  return res.data;
}


export async function obtenerProductosVendidosPorDia(dateIso: string): Promise<ProductoVendido[]> {
  const res = await axios.get(`${API_URL}/historial/dia/${dateIso}/productos`);
  return res.data;
}


export async function obtenerVenta(id: number): Promise<VentaDetalleDTO> {
  const res = await axios.get(`${API_URL}/${id}`);
  return res.data;
}

/*
export const obtenerAnios = async () => {
const resp = await axios.get('/api/ventas/historial/anios');
return resp.data;
}*/

export const eliminarVenta = async (id: number) => {
  await axios.delete(`${API_URL}/venta/${id}`);
}

export const eliminarDetalleVenta = async (detalleId: number) => {
  const res = await axios.delete(`${API_URL}/detalle/${detalleId}`);
  return res.data;
};


export const eliminarProductoEnDia = async (date: string, productoId: number) => {
  await axios.delete(`${API_URL}/historial/dia/${date}/producto/${productoId}`);
};


export async function obtenerVentasDTO(): Promise<VentaResumenDTO[]> {
  const res = await axios.get<VentaResumenDTO[]>(API_URL + "/dto");
  return res.data;
}