import React, { useEffect, useState, useRef } from "react";
import Layout from "../components/Layout";
import {
  obtenerMeses,
  obtenerSemanasPorMes,
  obtenerHistorialPorSemana,
  obtenerVentasPorDia,
  obtenerProductosVendidosPorDia,
  obtenerVenta,
  eliminarVenta as apiEliminarVenta, // <-- nuevo
} from "../api/ventas";

import { eliminarDetalleVenta as apiEliminarDetalleVenta } from "../api/ventas"; 

import type { HistorialMonth, HistorialDay } from "../types/VentaDetalleDTO";
import type { HistorialWeek } from "../types/VentaDetalleDTO";
import type { VentaResumenHistorial } from "../types/VentaDetalleDTO";
import type { VentaDetalleDTO, DetalleVentaResultDTO } from "../types/VentaDetalleDTO";
import type { ProductoVendido } from "../types/VentaDetalleDTO";

import { FiX, FiTrash, FiFileText, FiFolder, FiCalendar, FiClock, FiShoppingBag  } from "react-icons/fi";
import BreadCrumbs from "../components/BreadCrumbs";

import type { PedidoDTO } from "../types/Pedido";
import type { PedidoFullDTO, DetallePedidoFullDTO } from "../types/PedidoDTO";
import type { ProductoDTO } from "../types/PedidoDTO";
import type { DetallePedidoInput } from "../api/pedidos";
import { obtenerPedidos, obtenerPedidoCompleto, agregarProductoAPedido } from "../api/pedidos";
import { ClipboardPlus, X } from "lucide-react";
import { obtenerProducto } from "../api/productos";

const VentasHistorial: React.FC = () => {
  // navegación / niveles
  const [meses, setMeses] = useState<HistorialMonth[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<HistorialMonth | null>(null);

  const [semanas, setSemanas] = useState<HistorialWeek[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<HistorialWeek | null>(null);

  const [diasVentas, setDiasVentas] = useState<VentaResumenHistorial[]>([]);
  const [selectedDay, setSelectedDay] = useState<string | null>(null); // yyyy-MM-dd

  // ventas (resumen) de un día
  const [ventasDelDia, setVentasDelDia] = useState<VentaResumenHistorial[]>([]);

  // detalle de venta (modal)
  const [ventaDetalle, setVentaDetalle] = useState<VentaDetalleDTO | null>(null);
  const [detalleModalOpen, setDetalleModalOpen] = useState(false);

  // productos agregados de un día (modal)
  const [productosDia, setProductosDia] = useState<ProductoVendido[]>([]);
  const [productosModalOpen, setProductosModalOpen] = useState(false);

  // búsqueda en listado de meses / ventas
  const [busqueda] = useState("");
  const [loading, setLoading] = useState(true);

  // === Para replicar la funcionalidad del PedidoModal ===
  const [productoParaMover, setProductoParaMover] = useState<ProductoDTO | null>(null);
  const [pedidosPendientes, setPedidosPendientes] = useState<(PedidoDTO & { id: number })[]>([]);
  const [pedidoDestinoId, setPedidoDestinoId] = useState<number | null>(null);
  const [mostrarSeleccionPedidos, setMostrarSeleccionPedidos] = useState(false);

  const [mostrarCantidadModal, setMostrarCantidadModal] = useState(false);
  const [cantidadInput, setCantidadInput] = useState("1");
  const inputCantidadRef = useRef<HTMLInputElement>(null);

  const [expandedYears, setExpandedYears] = useState<{[key: number]: boolean}>({});

  const productoVendidoToProductoAsync = async (p: ProductoVendido): Promise<ProductoDTO> => {
    try {
      // 1. Obtener producto REAL desde el backend
      const prod = await obtenerProducto(p.productoId);

      return {
        id: p.productoId,
        clave: p.clave ?? "",
        descripcion: p.descripcion ?? "",
        costo: Number(prod.costo ?? 0),   // costo REAL del API
        precio: Number(prod.precio ?? prod.costo ?? 0),
        activo: true,
      };

    } catch (err) {
      console.error("Error obteniendo producto del API:", err);

      // fallback en caso de error
      return {
        id: p.productoId,
        clave: p.clave ?? "",
        descripcion: p.descripcion ?? "",
        costo: Number(p.subtotalTotal) / Number(p.cantidadTotal),
        precio: Number(p.subtotalTotal) / Number(p.cantidadTotal),
        activo: true,
      };
    }
  };


  useEffect(() => {
    if (mostrarCantidadModal && inputCantidadRef.current) {
      inputCantidadRef.current.focus();
      inputCantidadRef.current.select(); // Esto selecciona el valor por defecto
    }
  }, [mostrarCantidadModal]);


  const detalleToProducto = async (d: DetalleVentaResultDTO): Promise<ProductoDTO> => {
    try {
      // 🔥 1. LLAMADA REAL AL API DE PRODUCTOS
      const prod = await obtenerProducto(d.producto_id);

      return {
        id: d.producto_id,
        clave: d.clave ?? "",
        descripcion: d.descripcion ?? "",
        costo: Number(prod.costo ?? 0),   // 🔥 2. COSTO REAL DEL PRODUCTO
        precio: Number(d.precio), 
        activo: true,
      };
    } catch (err) {
      console.error("Error obteniendo producto del API:", err);

      // fallback (lo que tenías antes)
      return {
        id: d.producto_id,
        clave: d.clave ?? "",
        descripcion: d.descripcion ?? "",
        costo: Number(d.subtotal) / Number(d.cantidad),
        precio: Number(d.precio),
        activo: true,
      };
    }
};


  // --- inicial: obtener meses ---
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const m = await obtenerMeses();
        setMeses(m);
      } catch (err) {
        console.error("Error cargando meses:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    mostrarVentasDeHoy();
  }, []);


  // --- seleccionar mes -> cargar semanas ---
  const seleccionarMes = async (mes: HistorialMonth) => {
    setSelectedMonth(mes);
    setSelectedWeek(null);
    setSelectedDay(null);
    setVentasDelDia([]);
    try {
      const weeks = await obtenerSemanasPorMes(mes.year, mes.month);
      setSemanas(weeks);
    } catch (err) {
      console.error("Error cargando semanas:", err);
      setSemanas([]);
    }
  };

  const mostrarVentasDeHoy = async () => {
  const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });

  setSelectedMonth(null);
  setSelectedWeek(null);
  setSelectedDay(hoy);

  try {
    const ventasHoy = await obtenerVentasPorDia(hoy);
    setVentasDelDia(ventasHoy);
  } catch (err) {
    console.error("Error obteniendo ventas de hoy:", err);
    setVentasDelDia([]);
  }
};


  // --- seleccionar semana -> cargar dias (usaremos endpoint existente obtenerHistorialPorSemana) ---
  const seleccionarSemana = async (week: HistorialWeek) => {
    setSelectedWeek(week);
    setSelectedDay(null);
    setVentasDelDia([]);

    try {
      const dias: HistorialDay[] = await obtenerHistorialPorSemana(week.year, week.week);

      const dayTotals: VentaResumenHistorial[] = dias.map(d => ({
        id: 0, // no aplica aquí, este resumen es por día
        fecha: d.date + "T00:00:00",
        total: Number(d.totalDia),
        lineas: d.ventasCount
      }));

      setDiasVentas(dayTotals);
      
    } catch (err) {
      console.error("Error al obtener días de la semana:", err);
      setDiasVentas([]);
    }
  };

  // --- seleccionar día -> cargar ventas del día ---
  const seleccionarDia = async (dateIso: string) => {
    // dateIso in format 'yyyy-MM-dd' or 'yyyy-MM-ddT00:00:00'
    const justDate = dateIso.split("T")[0];
    setSelectedDay(justDate);
    setVentasDelDia([]);
    try {
      const ventas = await obtenerVentasPorDia(justDate);
      setVentasDelDia(ventas);
    } catch (err) {
      console.error("Error obteniendo ventas del día:", err);
      setVentasDelDia([]);
    }
  };

  // --- abrir detalle de venta individual ---
  const abrirDetalle = async (id: number) => {
    try {
      const det = await obtenerVenta(id);
      setVentaDetalle(det);
      setDetalleModalOpen(true);
    } catch (err) {
      console.error("Error obteniendo detalle venta:", err);
    }
  };

  // --- ver productos agregados del día ---
  const verProductosDelDia = async () => {
    if (!selectedDay) return;
    try {
      const prods = await obtenerProductosVendidosPorDia(selectedDay);
      setProductosDia(prods);
      setProductosModalOpen(true);
    } catch (err) {
      console.error("Error cargando productos del día:", err);
      setProductosDia([]);
    }
  };

  // --- eliminar venta completa (y actualizar estado) ---
  const handleEliminarVenta = async (ventaId: number) => {
    const ok = window.confirm("¿Eliminar esta venta y todos sus detalles? Esta acción no se puede deshacer.");
    if (!ok) return;
    try {
      await apiEliminarVenta(ventaId);
      // actualizar lista de ventas del día
      setVentasDelDia(prev => prev.filter(v => v.id !== ventaId));
      // si el modal está abierto para esa venta, cerrarlo
      if (ventaDetalle && ventaDetalle.id === ventaId) {
        setDetalleModalOpen(false);
        setVentaDetalle(null);
      }
      alert("Venta eliminada.");
    } catch (err) {
      console.error("Error eliminando venta:", err);
      alert("No se pudo eliminar la venta.");
    }
  };

  // --- eliminar un detalle específico dentro de la venta abierta ---
  const handleEliminarDetalle = async (detalleId: number) => {
  if (!ventaDetalle) return;

  const ok = window.confirm(
    "¿Eliminar este producto de la venta? Se actualizará el total de la venta."
  );
  if (!ok) return;

  // verificar que el detalle exista en el estado actual (solo validación visual)
  const detalle = ventaDetalle.detalles.find(d => d.id === detalleId);
  if (!detalle) return alert("Detalle no encontrado en el cliente.");

  try {
    // ahora el backend regresa la venta COMPLETA actualizada
    const updatedVenta = await apiEliminarDetalleVenta(detalleId);

    // 1) actualizar el modal de detalle
    setVentaDetalle(updatedVenta);

    // 2) actualizar también la lista de ventas del día
    setVentasDelDia(prev =>
      prev.map(v =>
        v.id === updatedVenta.id
          ? { ...v, total: updatedVenta.total }
          : v
      )
    );

    alert("Producto eliminado de la venta.");
  } catch (err) {
    console.error("Error eliminando detalle:", err);
    alert("No se pudo eliminar el producto.");
  }
};


  // --- breadcrumbs back ---
  const onBack = () => {
    if (productosModalOpen) {
      setProductosModalOpen(false);
      return;
    }
    if (detalleModalOpen) {
      setDetalleModalOpen(false);
      setVentaDetalle(null);
      return;
    }
    if (selectedDay) {
      setSelectedDay(null);
      setVentasDelDia([]);
      return;
    }
    if (selectedWeek) {
      setSelectedWeek(null);
      setDiasVentas([]);
      return;
    }
    if (selectedMonth) {
      setSelectedMonth(null);
      setSemanas([]);
      return;
    }
    // at top: do nothing
  };

  // small helpers
  const formatCurrency = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleAgregarAotroPedido = async (producto: ProductoDTO) => {
    
  setProductoParaMover(producto);

  try {
    const all = await obtenerPedidos();
    const pendientes = all.filter(p => (p.estado ?? "").toUpperCase() === "PENDIENTE");
    const pendientesConId = pendientes.filter(p => p.id != null);

    if (pendientesConId.length === 0) return alert("No hay pedidos pendientes disponibles.");

    setPedidosPendientes(pendientesConId as (PedidoDTO & { id: number })[]);
    setPedidoDestinoId(pendientesConId[0].id ?? null);
    setMostrarSeleccionPedidos(true);
  } catch (err) {
    console.error("Error cargando pedidos pendientes:", err);
    alert("No se pudieron obtener pedidos pendientes.");
  }
};

const confirmarAgregarAotroPedido = async () => {
  if (!productoParaMover) return alert("No se seleccionó un producto.");
  if (pedidoDestinoId == null) return alert("Selecciona un pedido destino.");

  try {
    const pedidoFull: PedidoFullDTO = await obtenerPedidoCompleto(pedidoDestinoId);

    const yaExiste = pedidoFull.detalles.some(
      (dt: DetallePedidoFullDTO) => dt.producto_id === productoParaMover.id
    );
    if (yaExiste) return alert("El producto ya existe en el pedido seleccionado.");

    const cantidadNum = Number(cantidadInput);
    const cantidad = !isNaN(cantidadNum) && cantidadNum > 0 ? cantidadNum : 1;

    const detalle: DetallePedidoInput = {
      producto_id: productoParaMover.id,
      cantidad,
      precio: productoParaMover.costo ?? 0, // ahora sí llega correctamente
      recibido: false,
    };

    console.log("➡️ Datos enviados al backend (agregarProductoAPedido):", {
      pedidoDestinoId,
      detalle
    });

    await agregarProductoAPedido(pedidoDestinoId, detalle);

    alert(`Se agregaron ${cantidad} unidades de "${productoParaMover.descripcion}" al pedido.`);

    // Reset
    setMostrarSeleccionPedidos(false);
    setMostrarCantidadModal(false);
    setProductoParaMover(null);
    setPedidoDestinoId(null);
    setCantidadInput("1");

  } catch (err) {
    console.error("Error agregando producto al pedido:", err);
    alert("No se pudo agregar el producto al pedido.");
  }
};


  // --- UTIL: agrupar meses por año para mostrar división por año ---
  const mesesPorAnio = React.useMemo(() => {
    const map = new Map<number, HistorialMonth[]>();
    for (const m of meses) {
      const arr = map.get(m.year) ?? [];
      arr.push(m);
      map.set(m.year, arr);
    }
    // ordenar años descendente, meses descendente
    const sorted = Array.from(map.entries()).sort((a, b) => b[0] - a[0])
      .map(([year, arr]) => [year, arr.sort((x, y) => y.month - x.month)] as [number, HistorialMonth[]]);
    return sorted; // [ [year, [months...] ], ... ]
  }, [meses]);


  // Función para obtener nombre del mes en español
const getMonthName = (monthNumber: number) => {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return months[monthNumber - 1] || '';
};

// Función para formatear la semana de forma más legible
// Función para formatear la semana de forma más legible
const formatWeekDisplay = (week: number, year: number, month?: number) => {
  if (month) {
    // Calcular el rango de fechas para esta semana del año
    const firstDayOfYear = new Date(year, 0, 1);
    const daysToFirstThursday = (4 - firstDayOfYear.getDay() + 7) % 7;
    const firstThursday = new Date(year, 0, 1 + daysToFirstThursday);
    
    const targetDate = new Date(firstThursday.getTime());
    targetDate.setDate(firstThursday.getDate() + (week - 1) * 7);
    
    const startOfWeek = new Date(targetDate.getTime());
    startOfWeek.setDate(targetDate.getDate() - 3); // Lunes de esa semana
    
    const endOfWeek = new Date(startOfWeek.getTime());
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Domingo de esa semana
    
    // Verificar si la semana pertenece al mes seleccionado
    if (startOfWeek.getMonth() + 1 === month || endOfWeek.getMonth() + 1 === month) {
      const startDay = startOfWeek.getDate();
      const endDay = endOfWeek.getDate();
      const startMonth = getMonthName(startOfWeek.getMonth() + 1);
      const endMonth = getMonthName(endOfWeek.getMonth() + 1);
      
      if (startMonth === endMonth) {
        return `${startDay}-${endDay} ${startMonth}`;
      } else {
        return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
      }
    }
  }
  
  // Si no tenemos mes o la semana no coincide, mostrar solo el número
  return `Semana`;
};

  return (
    <Layout>
    <div className="p-6 flex flex-col gap-6 text-gray-800 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div>
          <h1 className="text-3xl font-bold text-gray-900">Historial de Ventas</h1>
        </div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        
        
        <BreadCrumbs
          week={selectedWeek ? `${selectedWeek.week}` : undefined}
          day={selectedDay ?? undefined}
          ventaId={ventaDetalle ? ventaDetalle.id : undefined}
          onBack={onBack}
          onShowToday={mostrarVentasDeHoy}
        />
        
      </div>



      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column A: Years -> Months or Weeks */}
        <div className="col-span-1">
          {!selectedMonth ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 max-h-[calc(100vh-200px)] overflow-auto">
              <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold">Meses</div>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : meses.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <FiFolder className="mx-auto text-4xl text-gray-300 mb-2" />
                  No hay meses con ventas.
                </div>
              ) : (
                <div className="divide-y divide-gray-100 h-full overflow-auto">
                  {mesesPorAnio.map(([year, months]) => (
                    <div key={year} className="bg-gray-50">
                      <div 
                        className="px-6 py-3 bg-gray-100 font-semibold text-gray-700 border-b border-gray-200 cursor-pointer hover:bg-gray-200 transition-colors flex justify-between items-center"
                        onClick={() => setExpandedYears(prev => ({
                          ...prev,
                          [Number(year)]: !prev[Number(year)]
                        }))}
                      >
                        <span>{year}</span>
                        <svg 
                          className={`w-4 h-4 transform transition-transform ${expandedYears[year] ? 'rotate-180' : ''}`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      {expandedYears[year] && months
                        .filter(m => {
                          const label = `${m.year}-${String(m.month).padStart(2,"0")}`;
                          return label.includes(busqueda) || (m.totalMes + "").includes(busqueda) || (m.ventasCount + "").includes(busqueda);
                        })
                        .map(m => (
                          <div key={`${m.year}-${m.month}`} className="cursor-pointer p-4 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0" onClick={() => seleccionarMes(m)}>
                            <div className="flex justify-between items-center">
                              <div className="font-semibold text-gray-900">{getMonthName(m.month)} {m.year}</div>
                              <div className="text-green-600 font-bold">${formatCurrency(m.totalMes)}</div>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{m.ventasCount} ventas</span>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 max-h-[calc(100vh-200px)] overflow-auto">
              <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold">
                {getMonthName(selectedMonth.month)} {selectedMonth.year}
              </div>
              {semanas.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <FiCalendar className="mx-auto text-4xl text-gray-300 mb-2" />
                  No se encontraron semanas.
                </div>
              ) : (
                <div className="divide-y divide-gray-100 h-full overflow-auto">
                  {semanas
                    .filter(s => `${s.week}`.includes(busqueda) || `${s.totalSemana}`.includes(busqueda))
                    .map(s => (
                    <div key={`${s.year}-${s.week}`} className="cursor-pointer p-4 hover:bg-blue-50 transition-colors" onClick={() => { seleccionarSemana(s); setSelectedWeek(s); }}>
                      <div className="flex justify-between items-center">
                        <div className="font-semibold text-gray-900">{formatWeekDisplay(s.week, s.year, selectedMonth?.month)}</div>
                        <div className="text-green-600 font-bold">${formatCurrency(s.totalSemana)}</div>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{s.ventasCount} ventas</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Column B: Days (when week selected) or placeholder */}
        <div className="col-span-1">
          {!selectedWeek ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-[60vh] flex flex-col items-center justify-center text-gray-500 p-8">
              <FiCalendar className="text-4xl text-gray-300 mb-4" />
              <p className="text-center">Selecciona un mes y luego una semana para ver los días.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 max-h-[calc(100vh-200px)] overflow-auto">
              <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold">
                Días ({formatWeekDisplay(selectedWeek.week, selectedWeek.year, selectedMonth?.month)})
              </div>
              {diasVentas.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <FiClock className="mx-auto text-4xl text-gray-300 mb-2" />
                  <p className="text-center">Haz clic en una semana para cargar los días.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 h-full overflow-auto">
                  {diasVentas
                    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                    .map((d, idx) => {
                    const dia = d.fecha.split("T")[0];
                    return (
                      <div 
                        key={idx} 
                        className="cursor-pointer p-4 hover:bg-blue-50 transition-colors flex justify-between items-start"
                        onClick={() => seleccionarDia(dia)}
                      >
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 text-lg">
                            {new Date(dia + 'T00:00:00-06:00').toLocaleDateString('es-ES', { 
                              weekday: 'long',
                              day: 'numeric',
                              month: 'short'
                            })}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">{d.lineas ?? 0} ventas</div>
                        </div>
                        <div className="flex flex-col items-end gap-3">
                          <div className="text-green-600 font-bold text-lg">${formatCurrency(d.total)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Column C: Ventas del día (cuando day selected) */}
        <div className="col-span-1">
          {!selectedDay ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-[60vh] flex flex-col items-center justify-center text-gray-500 p-8">
              <FiShoppingBag className="text-4xl text-gray-300 mb-4" />
              <p className="text-center">Selecciona un día para ver las ventas de ese día.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 max-h-[calc(100vh-200px)] overflow-auto">
              <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold">Ventas del {selectedDay}</div>
              <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <div className="text-gray-700 font-medium">Total ventas: {ventasDelDia.length}</div>
                <button className="px-4 py-2 bg-yellow-200 border-yellow-300 hover:border-yellow-300 text-gray-700 rounded-lg hover:bg-yellow-100 transition-colors text-sm font-bold" onClick={verProductosDelDia}>Resumen</button>
              </div>

              {ventasDelDia.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 p-8 text-gray-500">
                  <FiFileText className="text-3xl text-gray-300 mb-2" />
                  No hay ventas para este día.
                </div>
              ) : (
                <div className="divide-y divide-gray-100 h-full overflow-auto">
                  {ventasDelDia
                    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                    .map(v => (
                    <div 
                      key={v.id} 
                      className="p-4 hover:bg-blue-50 transition-colors flex justify-between items-center cursor-pointer"
                      onClick={() => abrirDetalle(v.id)}
                    >
                      <div>
                        <div className="text-sm text-gray-700 mt-1 font-bold">{new Date(v.fecha).toLocaleTimeString()}</div>
                      </div>
                      <div className="flex gap-2 items-center" onClick={(e) => e.stopPropagation()}>
                        <div className="text-green-600 font-bold">${formatCurrency(v.total)}</div>

                        {/* Botón eliminar venta (en la lista de ventas del día) */}
                        <button
                          title="Eliminar venta"
                          onClick={() => handleEliminarVenta(v.id)}
                          className="p-2 bg-red-100 text-red-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <FiTrash size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal: detalle venta individual */}
      {detalleModalOpen && ventaDetalle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white w-full max-w-6xl rounded-2xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Detalle de Venta</h2>
                <p className="text-gray-600 mt-1">
                  {new Date(ventaDetalle.fecha).toLocaleDateString('es-MX', { 
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total de la venta</p>
                  <p className="text-2xl font-bold text-green-600">${formatCurrency(Number(ventaDetalle.total))}</p>
                </div>
                <button 
                  className="p-2 bg-gray-100 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                  onClick={() => { setDetalleModalOpen(false); setVentaDetalle(null); }}
                >
                  <FiX size={24} />
                </button>
              </div>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-auto p-6">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                      <tr className="text-left text-sm font-semibold text-gray-700">
                        <th className="px-4 py-3 font-semibold">Clave</th>
                        <th className="px-4 py-3 font-semibold">Producto</th>
                        <th className="px-4 py-3 font-semibold text-center">Precio</th>
                        <th className="px-4 py-3 font-semibold text-center">Cantidad</th>
                        <th className="px-4 py-3 font-semibold text-center">Subtotal</th>
                        <th className="px-4 py-3 font-semibold text-center">Existencia</th>
                        <th className="px-4 py-3 font-semibold text-center">Mínimo</th>
                        <th className="px-4 py-3 font-semibold text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {ventaDetalle.detalles.map((d: DetalleVentaResultDTO, i) => {
                        const bajoMinimo = d.existencia <= d.existencia_min;
                        const necesitaReposicion = bajoMinimo;

                        return (
                          <tr 
                            key={i} 
                            className={`hover:bg-gray-50 transition-colors ${
                              bajoMinimo ? "bg-red-50 border-l-4 border-l-red-500" : ""
                            }`}
                          >
                            <td className="px-4 py-3">
                              <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                {d.clave}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="max-w-xs">
                                <p className="font-medium text-gray-800">{d.descripcion}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center font-mono text-sm text-gray-700">
                              ${formatCurrency(Number(d.precio))}
                            </td>
                            <td className="px-4 py-3 text-center font-mono text-sm text-gray-700">
                              {d.cantidad}
                            </td>
                            <td className="px-4 py-3 text-center font-mono font-semibold text-gray-900">
                              ${formatCurrency(Number(d.subtotal))}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`font-mono text-sm ${
                                bajoMinimo ? "text-red-700 font-bold" : "text-gray-700"
                              }`}>
                                {d.existencia}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="font-mono text-sm text-red-700 font-bold">
                                {d.existencia_min}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex justify-center gap-2">
                                {necesitaReposicion && (
                                  <button
                                    onClick={async () => handleAgregarAotroPedido(await detalleToProducto(d))}
                                    className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors tooltip"
                                    title="Agregar a pedido pendiente"
                                  >
                                    <ClipboardPlus size={18} />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleEliminarDetalle(d.id)}
                                  className="p-2 bg-red-100 text-red-600 hover:bg-red-50 rounded-lg transition-colors tooltip"
                                  title="Eliminar de la venta"
                                >
                                  <FiTrash size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {ventaDetalle.detalles.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-6xl mb-4">📦</div>
                    <p className="text-lg font-medium">No hay productos en esta venta</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-600">
                {ventaDetalle.detalles.length} producto(s) en esta venta
              </div>
              <div className="flex gap-2">
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Productos Vendidos del Día */}
      {productosModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white w-full max-w-6xl rounded-2xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Productos Vendidos</h2>
                <p className="text-gray-600 mt-1">
                  Resumen del día {selectedDay}
                </p>
              </div>
              <button 
                className="p-2 bg-gray-100 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                onClick={() => setProductosModalOpen(false)}
              >
                <FiX size={24} />
              </button>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <p className="text-sm text-blue-600 font-medium">Total de Productos</p>
                  <p className="text-2xl font-bold text-blue-700">{productosDia.length}</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                  <p className="text-sm text-purple-600 font-medium">Productos para pedir</p>
                  <p className="text-2xl font-bold text-purple-700">
                    {productosDia.filter(p => p.existencia <= p.existenciaMin).length}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                      <tr className="text-left text-sm font-semibold text-gray-700">
                        <th className="px-4 py-3 font-semibold">Clave</th>
                        <th className="px-4 py-3 font-semibold">Producto</th>
                        <th className="px-4 py-3 font-semibold text-center">Veces Vendido</th>
                        <th className="px-4 py-3 font-semibold text-center">Cantidad Total</th>
                        <th className="px-4 py-3 font-semibold text-center">Subtotal Total</th>
                        <th className="px-4 py-3 font-semibold text-center">Existencia</th>
                        <th className="px-4 py-3 font-semibold text-center">Mínimo</th>
                        <th className="px-4 py-3 font-semibold text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {productosDia.map((p, i) => {
                        const bajoMinimo = p.existencia <= p.existenciaMin;
                        const necesitaReposicion = bajoMinimo;

                        return (
                          <tr 
                            key={i} 
                            className={`hover:bg-gray-50 transition-colors ${
                              bajoMinimo ? "bg-red-50 border-l-4 border-l-red-500" : ""
                            }`}
                          >
                            <td className="px-4 py-3">
                              <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                {p.clave}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="max-w-xs">
                                <p className="font-medium text-gray-800">{p.descripcion}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="font-mono text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                {p.cantidadTotal}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center font-mono text-sm text-gray-700">
                              {p.veces ?? "-"}
                            </td>
                            <td className="px-4 py-3 text-center font-mono font-semibold text-gray-900">
                              ${formatCurrency(Number(p.subtotalTotal))}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`font-mono text-sm ${
                                bajoMinimo ? "text-red-700 font-bold" : "text-gray-700"
                              }`}>
                                {p.existencia}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="font-mono text-sm text-red-700 font-bold">
                                {p.existenciaMin}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {necesitaReposicion && (
                                <button
                                  onClick={async () => handleAgregarAotroPedido(await productoVendidoToProductoAsync(p))}
                                  className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors tooltip"
                                  title="Agregar a pedido pendiente"
                                >
                                  <ClipboardPlus size={18} />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {productosDia.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-6xl mb-4">📊</div>
                    <p className="text-lg font-medium">No hay ventas para este día</p>
                    <p className="text-sm mt-1">No se registraron productos vendidos en la fecha seleccionada</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-600">
                Mostrando {productosDia.length} producto(s)
              </div>
            </div>
          </div>
        </div>
      )}
        {mostrarSeleccionPedidos && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[9999]">
            <div className="bg-white p-6 rounded-2xl shadow-xl w-96 relative">
              <button
                onClick={() => { setMostrarSeleccionPedidos(false); setProductoParaMover(null); }}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 bg-gray-100 p-2 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>

              <h2 className="text-xl font-bold text-gray-900 mb-4">Selecciona un Pedido Pendiente</h2>

              <select
                className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                value={pedidoDestinoId ?? pedidosPendientes[0]?.id ?? ""}
                onChange={e => setPedidoDestinoId(Number(e.target.value))}
              >
                {pedidosPendientes.map(p => (
                  <option key={p.id} value={p.id}>
                    Pedido — {p.cliente ?? "Sin cliente"}
                  </option>
                ))}
              </select>

              {pedidoDestinoId == null && (
                <p className="text-red-600 text-sm mb-4">Debes seleccionar un pedido.</p>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setMostrarSeleccionPedidos(false)}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => setMostrarCantidadModal(true)}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium"
                >
                  Aceptar
                </button>
              </div>
            </div>
          </div>
        )}

        {mostrarCantidadModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[9999]">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-80">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Elegir cantidad</h2>

            <input
              type="number"
              ref={inputCantidadRef} 
              className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={cantidadInput}
              min="1"
              onChange={e => setCantidadInput(e.target.value)}
            />

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setMostrarCantidadModal(false)}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarAgregarAotroPedido}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium"
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
    </Layout>
  );
  
};

export default VentasHistorial;
