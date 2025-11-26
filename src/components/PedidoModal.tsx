import React, { useEffect, useState, useRef } from "react";
import { obtenerProductos, crearProducto, actualizarProducto, eliminarProducto } from "../api/productos";
import ProductoModal from "./ProductoModal";
import { Plus, Trash, ClipboardPlus, X, Search, Filter, ArrowUpDown, Download } from "lucide-react";
import type { PedidoDTO, DetallePedidoDTO } from "../types/Pedido";
import type { Producto } from "../types/Producto";
import type { PedidoFullDTO, DetallePedidoFullDTO } from "../types/PedidoDTO";
import { obtenerPedidosPendientes, agregarProductoAPedido, obtenerPedidoCompleto, crearPedido, actualizarPedido } from "../api/pedidos";
import { obtenerPedidos as apiObtenerPedidos } from "../api/pedidos";
import { Percent } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { UserOptions, HookData } from "jspdf-autotable";

interface Props {
  pedido: PedidoFullDTO | null;
  onClose: () => void;
  onGuardado: () => void;
}

interface DetalleTemp {
  id?: number;
  producto: Producto;
  cantidad: number;
  precio: number;
  recibido?: boolean;
  precioSugerido?: number;
  precioEditable?: number;
  precioIndividualEditable?: number;
  marcados?: boolean;
  esTemporal?: boolean;
}

const PedidoModal: React.FC<Props> = ({ pedido, onClose, onGuardado }) => {
  const [productosDisponibles, setProductosDisponibles] = useState<Producto[]>([]);
  const [detalles, setDetalles] = useState<DetalleTemp[]>([]);
  const [cliente, setCliente] = useState<string>("");
  const [total, setTotal] = useState<number>(0);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [cantidadTemp, setCantidadTemp] = useState<number>(1);
  const [textoBusqueda, setTextoBusqueda] = useState<string>("");
  const [mostrarProductoModal, setMostrarProductoModal] = useState(false);
  const [productoParaEditar, setProductoParaEditar] = useState<Producto | null>(null);
  const [pedidosPendientes, setPedidosPendientes] = useState<PedidoDTO[]>([]);
  const [mostrarSeleccionPedidos, setMostrarSeleccionPedidos] = useState(false);
  const [productoParaMover, setProductoParaMover] = useState<Producto | null>(null);
  const [pedidoDestinoId, setPedidoDestinoId] = useState<number | null>(null);
  const [busquedaInterna, setBusquedaInterna] = useState("");
  const [filtroRecibido, setFiltroRecibido] = useState<"TODOS" | "RECIBIDOS" | "NO_RECIBIDOS">("TODOS");
  const [ordenAlfabeticoAsc, setOrdenAlfabeticoAsc] = useState(true);
  const [productoFiltradoId, setProductoFiltradoId] = useState<number | null>(null);
  const [productoParaCantidad, setProductoParaCantidad] = useState<Producto | null>(null);
  const [cantidadModal, setCantidadModal] = useState<number>(1);
  const [mostrarModalCantidad, setMostrarModalCantidad] = useState(false);
  const inputBusquedaRef = useRef<HTMLInputElement>(null);
  const inputCantidadRef = useRef<HTMLInputElement>(null);
  const esPendiente = pedido?.estado === "PENDIENTE" || pedido === null;
  const esSurtido = pedido?.estado === "SURTIDO";
  const [mostrarCantidadModal, setMostrarCantidadModal] = useState(false);
  const [cantidadInput, setCantidadInput] = useState("1");

  // Estilos CSS mejorados
  const styles = {
    input: "w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 bg-white text-gray-900 placeholder-gray-500",
    button: {
      primary: "px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-medium flex items-center gap-2",
      secondary: "px-5 py-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 font-medium flex items-center gap-2",
      success: "px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 font-medium flex items-center gap-2",
      warning: "px-5 py-2.5 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-all duration-200 font-medium flex items-center gap-2",
      danger: "px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 font-medium flex items-center gap-2",
      ghost: "px-4 py-2 bg-gray-100 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-200"
    },
    card: "bg-white rounded-2xl shadow-lg border border-gray-200",
    badge: {
      pendiente: "px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium",
      surtido: "px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium",
      entregado: "px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
    }
  };

  useEffect(() => {
    if (mostrarCantidadModal && inputCantidadRef.current) {
      inputCantidadRef.current.focus();
      inputCantidadRef.current.select();
    }
  }, [mostrarCantidadModal]);

  useEffect(() => {
    if (mostrarModalCantidad) {
      setTimeout(() => inputCantidadRef.current?.focus(), 100);
    }
  }, [mostrarModalCantidad]);

  useEffect(() => {
    if (!mostrarModalCantidad) {
      setTimeout(() => inputBusquedaRef.current?.focus(), 100);
    }
  }, [mostrarModalCantidad]);

  useEffect(() => {
    const handleEnterKey = (e: KeyboardEvent) => {
      if (!esSurtido) return;

      if (e.key === "Enter" && busquedaInterna.trim() !== "") {
        e.preventDefault();
        const codigo = busquedaInterna.trim().toLowerCase();

        const productoEncontrado = detalles.find(
          (d) =>
            d.producto.codigo_barras?.toLowerCase() === codigo ||
            d.producto.clave.toLowerCase() === codigo
        );

        if (productoEncontrado) {
          setDetalles((prev) =>
            prev.map((det) =>
              det.producto.id === productoEncontrado.producto.id
                ? { ...det, recibido: true }
                : det
            )
          );

          setProductoFiltradoId(productoEncontrado.producto.id);
          setBusquedaInterna("");
        }
      }
    };

    window.addEventListener("keydown", handleEnterKey);
    return () => window.removeEventListener("keydown", handleEnterKey);
  }, [busquedaInterna, detalles, esSurtido]);

  useEffect(() => {
    const cargarPedidosPendientes = async () => {
      try {
        const data = await obtenerPedidosPendientes();
        setPedidosPendientes(data);
      } catch (err) {
        console.error("Error al cargar pedidos pendientes:", err);
      }
    };
    cargarPedidosPendientes();
  }, []);

  useEffect(() => {
    const cargar = async () => {
      const data = await obtenerProductos();
      setProductosDisponibles(data);
    };
    cargar();
  }, []);

  useEffect(() => {
    const cargarPedidoCompleto = async () => {
      if (!pedido?.id) return;
      try {
        const data: PedidoFullDTO = await obtenerPedidoCompleto(pedido.id);
        setCliente(data.cliente);

        const detallesTemp: DetalleTemp[] = (data.detalles || []).map((d: DetallePedidoFullDTO) => {
          const producto: Producto = {
            id: d.producto.id,
            clave: d.producto.clave,
            descripcion: d.producto.descripcion,
            codigo_barras: d.producto.codigo_barras ?? "",
            costo: d.producto.costo ?? 0,
            precio: d.producto.precio ?? 0,
            precio_individual: d.producto.precioIndividual ?? 0,
            existencia: 0,
            existencia_min: 0,
            unidad: "",
            activo: d.producto.activo ?? true,
          };

          return {
            id: d.id,
            producto,
            cantidad: d.cantidad,
            precio: d.precio,
            recibido: d.recibido ?? false,
            precioIndividualEditable: producto.precio_individual,
            marcados: d.recibido ?? false,
            esTemporal: producto.activo === false,
          };
        });

        setDetalles(detallesTemp);
      } catch (err) {
        console.error("Error al obtener pedido completo:", err);
        alert("No se pudo cargar el pedido completo");
      }
    };

    cargarPedidoCompleto();
  }, [pedido]);

  useEffect(() => {
    const suma = detalles.reduce((acc, d) => {
      const subtotal = Number(d.producto.costo ?? 0) * (d.cantidad ?? 0);
      return acc + subtotal;
    }, 0);
    setTotal(suma);
  }, [detalles]);

    const agregarCantidadModal = () => {
    if (!productoParaCantidad || cantidadModal <= 0) return;

    if (!puedeAgregarProducto(productoParaCantidad)) {
      alert("El producto ya está en el pedido.");
    } else {
      const nuevoDetalle: DetalleTemp = {
        producto: productoParaCantidad,
        cantidad: cantidadModal,
        precio: productoParaCantidad.costo,
        recibido: false,
        precioIndividualEditable: productoParaCantidad.precio_individual ?? 0,
        marcados: false,
        esTemporal: productoParaCantidad.activo === false,
      };
      setDetalles(prev => [...prev, nuevoDetalle]);
    }

    setTextoBusqueda("");
    setProductoParaCantidad(null);
    setCantidadModal(1);
    setMostrarModalCantidad(false);
  };

  const generarNotaPedidoSimple = (pedido: PedidoFullDTO) => {
    if (!pedido) return;

    const doc = new jsPDF();
    let y = 20;
    const margenX = 15;
    const pageWidth = doc.internal.pageSize.getWidth();

    const fechaHoy = new Date();
    const fechaStr = `${fechaHoy.getDate().toString().padStart(2, "0")}-${(
      fechaHoy.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}-${fechaHoy.getFullYear()}`;

    // Header
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("NOTA DE PEDIDO", pageWidth / 2, y, { align: "center" });
    
    y += 10;
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Negocio: Tlapalería Leo`, margenX, y);
    doc.text(`Fecha: ${fechaStr}`, pageWidth - margenX, y, { align: "right" });
    
    y += 7;
    doc.text(`Proveedor: ${pedido.cliente}`, margenX, y);

    y += 15;

    // Tabla única con todos los productos (solo cantidad, código y descripción)
    const filas = pedido.detalles.map((d) => [
      d.cantidad.toString(),
      d.producto.clave.substring(2), // 🔹 Quita los primeros 2 caracteres
      d.producto.descripcion
    ]);

    const options: UserOptions = {
      startY: y,
      head: [["Cantidad", "Código", "Descripción"]],
      body: filas,
      theme: "grid",
      headStyles: { 
        fillColor: [59, 130, 246], 
        fontStyle: "bold", 
        halign: "center",
        textColor: 255
      },
      styles: { 
        fontSize: 9, 
        cellPadding: 3,
        halign: "left"
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 25 },
        1: { halign: "center", cellWidth: 30 },
        2: { halign: "left", cellWidth: 120 }
      },
      margin: { left: margenX, right: margenX },
      didDrawPage: (data: HookData) => {
        if (data.cursor) {
          y = data.cursor.y;
        }
      },
    };

    autoTable(doc, options);

    // Pie de página
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");

    doc.save(`NotaSimple_${pedido.cliente}_${fechaStr}.pdf`);
  };


  const generarNotaPedido = (pedido: PedidoFullDTO) => {
    if (!pedido) return;

    const doc = new jsPDF();
    let y = 20;
    const margenX = 15;

    const fechaHoy = new Date();
    const fechaStr = `${fechaHoy.getDate().toString().padStart(2, "0")}-${(
      fechaHoy.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}-${fechaHoy.getFullYear().toString().slice(-2)}`;

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("ORDEN DE PEDIDO", margenX, y);
    doc.text("Remisión", 150, y, { align: "right" });

    y += 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Negocio: Tlapalería Leo`, margenX, y);
    doc.text(`Fecha: ${fechaStr}`, 150, y, { align: "right" });

    y += 7;
    doc.text(`Clave: 36482`, 150, y, { align: "right" });

    y += 10;

    const productosSeccion1 = pedido.detalles.filter(
      (d) => !["T","P","V","F","H","K","t","p","v","f","h","k"].includes(d.producto.clave[0])
    );
    const productosSeccion2 = pedido.detalles.filter(
      (d) => ["T","P","V","F","H","K","t","p","v","f","h","k"].includes(d.producto.clave[0])
    );

    const generarTabla = (productos: typeof pedido.detalles, razonSocial: string) => {
      if (!productos.length) return;

      y += 5;
      doc.text(`Razón social: ${razonSocial}`, margenX, y);
      y += 5;

      const filas: (string | number)[][] = productos.map((d) => [
        d.cantidad,
        d.producto.clave,
        d.producto.descripcion,
      ]);

      const options: UserOptions = {
        startY: y,
        head: [["Cantidad", "Código", "Descripción"]],
        body: filas,
        theme: "grid",
        headStyles: { fillColor: [70, 130, 180], fontStyle: "bold", halign: "center" },
        styles: { fontSize: 8.5, cellPadding: 1 },
        columnStyles: {
          0: { halign: "center" },
          1: { halign: "center" },
        },
        margin: { left: margenX, right: margenX },
        didDrawPage: (hookData: HookData) => {
          if (hookData.cursor) {
            y = hookData.cursor.y + 4;
          }
        },
      };

      autoTable(doc, options);
    };

    generarTabla(productosSeccion1, "Impacto");

    if (productosSeccion2.length) {
      doc.addPage();
      y = 20;
      generarTabla(productosSeccion2, "Truper");
    }

    doc.save(`NotaPedido_${pedido.cliente}_${fechaStr}.pdf`);
  };

  const eliminarDetalle = (productoId: number) => {
    const confirmar = window.confirm("¿Seguro que deseas eliminar este producto del pedido?");
    if (confirmar) {
      setDetalles(prev => prev.filter(d => d.producto.id !== productoId));
    }
  };

  const productosFiltrados = productosDisponibles.filter(p =>
    p.descripcion.toLowerCase().includes(textoBusqueda.toLowerCase()) ||
    p.clave.toLowerCase().includes(textoBusqueda.toLowerCase()) ||
    (p.codigo_barras?.toLowerCase().includes(textoBusqueda.toLowerCase()) ?? false)
  );

  const detallesFiltrados = esSurtido
  ? detalles
      .filter((d) => !productoFiltradoId || d.producto.id === productoFiltradoId)
      .filter((d) =>
        d.producto.descripcion.toLowerCase().includes(busquedaInterna.toLowerCase()) ||
        d.producto.clave.toLowerCase().includes(busquedaInterna.toLowerCase()) ||
        (d.producto.codigo_barras?.toLowerCase().includes(busquedaInterna.toLowerCase()) ?? false)
      )
      .filter((d) => {
        if (filtroRecibido === "RECIBIDOS") return d.recibido;
        if (filtroRecibido === "NO_RECIBIDOS") return !d.recibido;
        return true;
      })
      .sort((a, b) =>
        ordenAlfabeticoAsc
          ? a.producto.descripcion.localeCompare(b.producto.descripcion)
          : b.producto.descripcion.localeCompare(a.producto.descripcion)
      )
  : detalles;

  const puedeAgregarProducto = (prod: Producto) => !detalles.some(d => d.producto.id === prod.id);

  const agregarDetalle = () => {
    const productoAAgregar =
      productoSeleccionado ??
      productosDisponibles.find(p =>
        p.clave.toLowerCase().includes(textoBusqueda.toLowerCase()) ||
        (p.codigo_barras?.toLowerCase().includes(textoBusqueda.toLowerCase()) ?? false)
      );

    if (!productoAAgregar) return;
    if (!puedeAgregarProducto(productoAAgregar)) {
      alert("El producto ya está en el pedido.");
      return;
    }

    const nuevoDetalle: DetalleTemp = {
      producto: productoAAgregar,
      cantidad: cantidadTemp,
      precio: productoAAgregar.costo,
      recibido: false,
      precioIndividualEditable: productoAAgregar.precio_individual ?? 0,
      marcados: false,
      esTemporal: productoAAgregar.activo === false,
    };

    setDetalles(prev => [...prev, nuevoDetalle]);
    setProductoSeleccionado(null);
    setCantidadTemp(1);
    setTextoBusqueda("");
  };

  const agregarProductoTemporal = async (clave: string, descripcion: string, cantidad: number, costo = 0) => {
    try {
      const productoCreado = await crearProducto({
        clave,
        descripcion,
        codigo_barras: "",
        costo,
        precio: 0,
        precio_individual: 0,
        existencia: 0,
        existencia_min: 0,
        unidad: "",
        activo: false,
      });

      const nuevoDetalle: DetalleTemp = {
        producto: productoCreado,
        cantidad,
        precio: costo,
        recibido: false,
        precioIndividualEditable: productoCreado.precio_individual ?? 0,
        marcados: false,
        esTemporal: true
      };

      setDetalles(prev => [...prev, nuevoDetalle]);
    } catch (err) {
      console.error("Error creando producto temporal:", err);
      alert("No se pudo crear el producto temporal.");
    }
  };

  const actualizarCantidad = (id: number, cantidad: number) => setDetalles(prev => prev.map(d => d.producto.id === id ? { ...d, cantidad } : d));
  const toggleRecibido = (id: number) => setDetalles(prev => prev.map(d => d.producto.id === id ? { ...d, recibido: !d.recibido, marcados: !d.marcados } : d));

    const handleAgregarAotroPedido = async (producto: Producto) => {
    setProductoParaMover(producto);
    try {
      const all = await apiObtenerPedidos();
      const pendientes = all.filter(p => (p.estado ?? "").toUpperCase() === "PENDIENTE");
      const pendientesConId = pendientes.filter((p): p is PedidoDTO & { id: number } => p.id !== undefined);

      if (pendientesConId.length === 0) {
        return alert("No hay pedidos pendientes disponibles.");
      }

      setPedidosPendientes(pendientesConId);
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
      const pedidoFull = await obtenerPedidoCompleto(pedidoDestinoId);

      const yaExiste = (pedidoFull.detalles || []).some(
        (dt: DetallePedidoDTO) => dt.producto_id === productoParaMover.id
      );
      if (yaExiste) return alert("El producto ya existe en el pedido seleccionado.");

      const cantidadNum = Number(cantidadInput);
      const cantidad = !isNaN(cantidadNum) && cantidadNum > 0 ? cantidadNum : 1;

      const detalle = {
        producto_id: productoParaMover.id,
        cantidad,
        precio: productoParaMover.costo ?? 0,
        recibido: false,
      };

      await agregarProductoAPedido(pedidoDestinoId, detalle);
      alert(`Se agregaron ${cantidad} unidades de "${productoParaMover.descripcion}" al pedido.`);

      setMostrarSeleccionPedidos(false);
      setMostrarCantidadModal(false);
      setProductoParaMover(null);
      setPedidoDestinoId(null);
      setCantidadInput("1");
      onGuardado();
    } catch (err) {
      console.error("Error agregando producto al pedido:", err);
      alert("No se pudo agregar el producto al pedido.");
    }
  };

  const handleSubmit = async (
  e?: React.FormEvent,
  nuevoEstado?: "PENDIENTE" | "SURTIDO" | "ENTREGADO"
) => {
  if (e) e.preventDefault();

  try {
    const estadoDestino = nuevoEstado ?? (pedido?.estado || "PENDIENTE");
    const debeSumarExistencia = estadoDestino === "SURTIDO" || estadoDestino === "ENTREGADO";

    const totalSubtotal = detalles.reduce(
      (acc, d) => acc + (d.producto.costo ?? 0) * (d.cantidad ?? 0),
      0
    );

    const pedidoBackend: PedidoDTO = {
      cliente,
      total: totalSubtotal,
      estado: estadoDestino,
      detalles: detalles.map((d) => ({
        id: d.id,
        producto_id: d.producto.id,
        cantidad: d.cantidad,
        precio: d.precio,
        recibido: d.recibido ?? false, // 🔹 AQUÍ ESTÁ LA CORRECCIÓN - incluir el estado recibido
      })),
    };

    if (!pedido?.id) {
      await crearPedido(pedidoBackend);
    } else {
      await actualizarPedido(pedido.id!, pedidoBackend);
    }

    if (debeSumarExistencia) {
      for (const d of detalles) {
        if (!d.recibido) continue;

        try {
          const productoActualizado = productosDisponibles.find(p => p.id === d.producto.id);
          const existenciaActual = productoActualizado?.existencia ?? d.producto.existencia ?? 0;

          const debeSumarExistencia = nuevoEstado === "ENTREGADO";

          const nuevaExistencia = debeSumarExistencia
            ? existenciaActual + d.cantidad
            : existenciaActual;

          const prodToUpdate: Omit<Producto, "id"> = {
            clave: d.producto.clave,
            descripcion: d.producto.descripcion,
            codigo_barras: d.producto.codigo_barras ?? "",
            costo: d.precio,
            precio: d.precioEditable ?? d.producto.precio,
            precio_individual: d.precioIndividualEditable ?? d.producto.precio_individual ?? 0,
            existencia: nuevaExistencia,
            existencia_min: productoActualizado?.existencia_min ?? d.producto.existencia_min ?? 0,
            unidad: productoActualizado?.unidad ?? d.producto.unidad ?? "",
            activo: d.producto.activo ?? true,
          };

          await actualizarProducto(d.producto.id, prodToUpdate);
        } catch (err) {
          console.error("No se pudo actualizar producto", d.producto.id, err);
        }
      }
    }

    if (estadoDestino === "ENTREGADO") {
      const temporalesDelPedido = detalles
        .map((d) => d.producto)
        .filter((p) => p.activo === false);

      for (const prod of temporalesDelPedido) {
        try {
          await eliminarProducto(prod.id);
          console.log(`Producto temporal eliminado: ${prod.descripcion} (${prod.clave})`);
        } catch (err) {
          console.error("Error al eliminar producto temporal:", prod.id, err);
        }
      }
    }

    onGuardado();
    onClose();
  } catch (error) {
    console.error("Error al guardar pedido:", error);
    alert("Ocurrió un error al guardar el pedido.");
  }
};

  const abrirProductoModalPara = (producto: Producto | null) => {
    setProductoParaEditar(producto);
    setMostrarProductoModal(true);
  };

  const onProductoGuardado = async () => {
    try {
      if (productoParaEditar && productoParaEditar.activo === false) {
        await actualizarProducto(productoParaEditar.id, {
          ...productoParaEditar,
          activo: true,
        });
      }

      const data = await obtenerProductos();
      setProductosDisponibles(data);

      setDetalles(prev =>
        prev.map(d => {
          const prod = data.find(p => p.id === d.producto.id);
          return prod ? { ...d, producto: prod, esTemporal: !prod.activo } : d;
        })
      );

    } catch (err) {
      console.error("Error al actualizar estado del producto:", err);
    } finally {
      setMostrarProductoModal(false);
      setProductoParaEditar(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${styles.card} w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {pedido ? `Editar Pedido` : "Nuevo Pedido"}
            </h2>
            {pedido && (
              <div className="flex items-center gap-3 mt-2">
                <span className="text-gray-600">Cliente:</span>
                <span className="font-semibold text-gray-800">{pedido.cliente}</span>
                <span className={styles.badge[pedido.estado?.toLowerCase() as keyof typeof styles.badge] || styles.badge.pendiente}>
                  {pedido.estado ?? "PENDIENTE"}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className={styles.button.ghost}
            title="Cerrar ventana"
          >
            <X size={24} />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-auto p-6">
          <form
            onSubmit={(e) => handleSubmit(e)}
            onKeyDown={(e) => {
              const target = e.target as HTMLElement;
              if (e.key === "Enter" && target.tagName === "INPUT") {
                e.preventDefault();
              }
            }}
            className="space-y-6"
          >
            
            {/* Información del pedido */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Pedido
                </label>
                <input
                  type="text"
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  required
                  className={styles.input}
                  placeholder="Ingresa el nombre del cliente o pedido"
                />
              </div>
              
              <div className="flex items-end">
                <div className="flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-xl w-full">
                  <span className="text-sm font-medium text-gray-700">Estado:</span>
                  <div className={`px-4 py-2 rounded-full font-medium ${
                    pedido?.estado === "PENDIENTE" ? styles.badge.pendiente :
                    pedido?.estado === "SURTIDO" ? styles.badge.surtido :
                    styles.badge.entregado
                  }`}>
                    {pedido?.estado ?? "PENDIENTE"}
                  </div>
                </div>
              </div>
            </div>
                        {/* Búsqueda de productos - Solo para PENDIENTE */}
            {esPendiente && (
              <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Search size={20} />
                  Agregar Productos
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
                  <div className="lg:col-span-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Buscar producto
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        ref={inputBusquedaRef}
                        type="text"
                        value={textoBusqueda}
                        onChange={(e) => setTextoBusqueda(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const producto = productosFiltrados[0];
                            if (producto) {
                              setProductoParaCantidad(producto);
                              setMostrarModalCantidad(true);
                              setTimeout(() => inputBusquedaRef.current?.focus(), 100);
                            } else {
                              alert("Producto no encontrado");
                            }
                          }
                        }}
                        placeholder="Descripción, clave o código de barras..."
                        className="pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-full bg-white text-gray-900 placeholder-gray-500"
                      />
                      {textoBusqueda && (
                        <button
                          type="button"
                          onClick={() => setTextoBusqueda("")}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X size={18} />
                        </button>
                      )}
                    </div>

                    {productosFiltrados.length > 1 && (
                      <select
                        value={productoSeleccionado?.id || ""}
                        onChange={(e) =>
                          setProductoSeleccionado(
                            productosFiltrados.find((p) => p.id === Number(e.target.value)) || null
                          )
                        }
                        className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                      >
                        <option value="">Seleccionar producto específico...</option>
                        {productosFiltrados.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.descripcion} ({p.clave}) - ${p.costo.toFixed(2)}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cantidad
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={cantidadTemp}
                      onChange={(e) => setCantidadTemp(Number(e.target.value))}
                      className={styles.input}
                    />
                  </div>

                  <div className="lg:col-span-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (!productoSeleccionado && textoBusqueda.trim() === "") {
                          alert("Escribe o selecciona un producto válido");
                          return;
                        }
                        agregarDetalle();
                      }}
                      className={styles.button.primary}
                    >
                      <Plus size={18} />
                      Agregar
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const clave = prompt("Clave del producto:") ?? "";
                        if (!clave) return;
                        const descripcion = prompt("Descripción:") ?? "";
                        if (!descripcion) return;
                        const cantidadRaw = prompt("Cantidad:", "1") ?? "1";
                        const cantidad = Number(cantidadRaw) || 1;
                        const costoRaw = prompt("Costo (opcional):", "0") ?? "0";
                        const costo = Number(costoRaw) || 0;
                        agregarProductoTemporal(clave, descripcion, cantidad, costo);
                      }}
                      className={styles.button.secondary}
                    >
                      <Plus size={18} />
                      Temporal
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Buscador interno para modo SURTIDO */}
            {esSurtido && (
              <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Filter size={20} />
                  Control de Recepción
                </h3>
                
                <div className="flex flex-col lg:flex-row gap-4 items-end justify-between">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Buscar en el pedido
                    </label>
                    <div className="relative max-w-md">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        placeholder="Buscar por código, descripción..."
                        value={busquedaInterna}
                        onChange={(e) => setBusquedaInterna(e.target.value)}
                        className="pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none w-full bg-white text-gray-900 placeholder-gray-500"
                      />
                      {busquedaInterna && (
                        <button
                          type="button"
                          onClick={() => setBusquedaInterna("")}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X size={18} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <select
                      value={filtroRecibido}
                      onChange={(e) => setFiltroRecibido(e.target.value as "TODOS" | "RECIBIDOS" | "NO_RECIBIDOS")}
                      className="px-4 py-2.5 border border-gray-300 rounded-xl bg-white text-gray-800 focus:ring-2 focus:ring-green-500 outline-none"
                    >
                      <option value="TODOS">Todos los productos</option>
                      <option value="RECIBIDOS">Solo recibidos</option>
                      <option value="NO_RECIBIDOS">Solo pendientes</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => setOrdenAlfabeticoAsc(!ordenAlfabeticoAsc)}
                      className={styles.button.secondary}
                    >
                      <ArrowUpDown size={16} />
                      {ordenAlfabeticoAsc ? "A → Z" : "Z → A"}
                    </button>

                    {productoFiltradoId !== null && (
                      <button
                        onClick={() => setProductoFiltradoId(null)}
                        className={styles.button.secondary}
                      >
                        Mostrar todos
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tabla de productos */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <tr className="text-left text-sm font-semibold text-gray-700">
                      <th className="px-4 py-3 font-semibold">Clave</th>
                      <th className="px-4 py-3 font-semibold">Producto</th>
                      <th className="px-4 py-3 font-semibold text-center">Cantidad</th>
                      <th className="px-4 py-3 font-semibold text-right">Costo</th>
                      <th className="px-4 py-3 font-semibold text-right">{!esPendiente ? "Nuevo costo" : ""}</th>
                      <th className="px-4 py-3 font-semibold text-right">Precio</th>
                      <th className="px-4 py-3 font-semibold text-right">Unidad</th>
                      {esSurtido && <th className="px-4 py-3 font-semibold text-center">Recibido</th>}
                      <th className="px-4 py-3 font-semibold text-right">Subtotal</th>
                      <th className="px-4 py-3 font-semibold text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {detallesFiltrados.map((d) => {
                      const costoOriginal = Number(d.producto.costo ?? 0);
                      const nuevoCosto = Number(d.precio ?? 0);
                      const diffPercent =
                        costoOriginal > 0 ? ((nuevoCosto - costoOriginal) / costoOriginal) * 100 : 0;
                      const subtotal = esPendiente 
                        ? costoOriginal * (d.cantidad || 0) 
                        : (nuevoCosto || 0) * (d.cantidad || 0);

                      let diffColor = "";
                      if (Math.abs(diffPercent) >= 10)
                        diffColor = diffPercent > 0 ? "text-green-600" : "text-red-600";

                      const recalcularPrecio = (nuevoCosto: number) => {
                        const precioViejo = Number(d.producto.precio ?? 0);
                        const diferencia = nuevoCosto - costoOriginal;
                        const nuevoPrecioRaw = precioViejo + diferencia;
                        if (isNaN(nuevoPrecioRaw)) return Number(precioViejo.toFixed(2));
                        const entero = Math.trunc(nuevoPrecioRaw);
                        const fraccion = Math.abs(nuevoPrecioRaw - entero);
                        if (diferencia > 0) {
                          return fraccion >= 0.5 ? Math.ceil(nuevoPrecioRaw) : Math.floor(nuevoPrecioRaw);
                        } else if (diferencia < 0) {
                          return fraccion >= 0.4 ? Math.ceil(nuevoPrecioRaw) : Math.floor(nuevoPrecioRaw);
                        } else {
                          return Number(nuevoPrecioRaw.toFixed(2));
                        }
                      };

                      return (
                        <tr 
                          key={d.producto.id} 
                          className={`hover:bg-gray-50 transition-colors ${
                            d.marcados ? "bg-green-50 border-l-4 border-l-green-500" : ""
                          }`}
                        >
                          <td className="px-4 py-3">
                            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                              {d.producto.clave}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-800">{d.producto.descripcion}</span>
                              {d.esTemporal && (
                                <button
                                  type="button"
                                  className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full hover:bg-yellow-200 transition-colors font-medium"
                                  onClick={() => abrirProductoModalPara(d.producto)}
                                >
                                  Completar
                                </button>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min={1}
                              value={d.cantidad}
                              onChange={(e) =>
                                actualizarCantidad(d.producto.id, Number(e.target.value))
                              }
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-center focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                          </td>

                          <td className="px-4 py-3 text-right font-mono text-sm">
                            ${costoOriginal.toFixed(2)}
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              {!esPendiente ? (
                                esSurtido ? (
                                  <>
                                    <input
                                      type="number"
                                      value={nuevoCosto}
                                      onFocus={(e) => e.target.select()}
                                      onChange={(e) => {
                                        const nuevo = Number(e.target.value);
                                        setDetalles((prev) =>
                                          prev.map((det) =>
                                            det.producto.id === d.producto.id
                                              ? { ...det, precio: nuevo, precioEditable: recalcularPrecio(nuevo) }
                                              : det
                                          )
                                        );
                                      }}
                                      className="w-24 px-2 py-1 border border-gray-300 rounded text-right focus:ring-1 focus:ring-blue-500 outline-none font-mono text-sm"
                                    />
                                    {Math.abs(diffPercent) >= 10 && (
                                      <span
                                        className={`text-xs ${diffColor}`}
                                        title={`Cambio de ${diffPercent.toFixed(1)}%`}
                                      >
                                        ⚠️
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <span className="font-mono text-sm">
                                    ${nuevoCosto.toFixed(2)}
                                  </span>
                                )
                              ) : (
                                <span className="w-24">&nbsp;</span>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            {esSurtido ? (
                              <input
                                type="number"
                                step="01.00"
                                value={d.precioEditable ?? d.producto.precio ?? 0}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) =>
                                  setDetalles((prev) =>
                                    prev.map((det) =>
                                      det.producto.id === d.producto.id
                                        ? { ...det, precioEditable: Number(e.target.value) }
                                        : det
                                    )
                                  )
                                }
                                className="w-24 px-2 py-1 border border-gray-300 rounded text-right focus:ring-1 focus:ring-blue-500 outline-none font-mono text-sm"
                              />
                            ) : (
                              <span className="font-mono text-sm text-right block">
                                ${Number(d.producto.precio ?? 0).toFixed(2)}
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            {esSurtido ? (
                              <input
                                type="number"
                                step="0.01"
                                value={
                                  d.precioIndividualEditable ?? d.producto.precio_individual ?? 0
                                }
                                onFocus={(e) => e.target.select()}
                                onChange={(e) =>
                                  setDetalles((prev) =>
                                    prev.map((det) =>
                                      det.producto.id === d.producto.id
                                        ? {
                                            ...det,
                                            precioIndividualEditable: Number(e.target.value),
                                          }
                                        : det
                                    )
                                  )
                                }
                                className="w-24 px-2 py-1 border border-gray-300 rounded text-right focus:ring-1 focus:ring-blue-500 outline-none font-mono text-sm"
                              />
                            ) : (
                              <span className="font-mono text-sm text-right block">
                                ${Number(d.producto.precio_individual ?? 0).toFixed(2)}
                              </span>
                            )}
                          </td>

                          {esSurtido && (
                            <td className="px-4 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={d.recibido}
                                onChange={() => toggleRecibido(d.producto.id)}
                                className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                              />
                            </td>
                          )}

                          <td className="px-4 py-3 text-right font-mono font-semibold">
                            ${subtotal.toFixed(2)}
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => eliminarDetalle(d.producto.id)}
                                  className="p-2 bg-red-100 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Eliminar producto"
                                >
                                  <Trash size={16} />
                                </button>

                                {esSurtido && (
                                  <button
                                    type="button"
                                    onClick={() => handleAgregarAotroPedido(d.producto)}
                                    className="p-2 bg-blue-100 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Agregar a otro pedido"
                                  >
                                    <ClipboardPlus size={16} />
                                  </button>
                                )}
                              </div>
                              
                              {esSurtido && (
                                <button
                                  type="button"
                                  title="Aplicar 16% (IVA)"
                                  className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors flex items-center gap-1 font-medium"
                                  onClick={() => {
                                    const nuevo = Number((nuevoCosto * 1.16).toFixed(2));
                                    setDetalles((prev) =>
                                      prev.map((det) =>
                                        det.producto.id === d.producto.id
                                          ? {
                                              ...det,
                                              precio: nuevo,
                                              precioEditable: recalcularPrecio(nuevo),
                                            }
                                          : det
                                      )
                                    );
                                  }}
                                >
                                  <Percent size={12} />
                                  IVA
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {detallesFiltrados.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-6xl mb-4">📦</div>
                  <p className="text-lg font-medium">No hay productos en este pedido</p>
                  <p className="text-sm mt-1">Agrega productos usando el formulario de búsqueda</p>
                </div>
              )}
            </div>

            {/* Total y acciones */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pt-4 border-t border-gray-200">
              <div className="text-2xl font-bold text-gray-800">
                Total: <span className="text-blue-600">${total.toFixed(2)}</span>
              </div>

              <div className="flex flex-wrap gap-3 justify-end">
                {esPendiente && pedido && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => generarNotaPedido(pedido)}
 
                      className="px-4 py-2.5 bg-green-500 text-white rounded-xl hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 font-medium flex items-center gap-2"
                    >
                      <Download size={18} />
                      Nota Sol
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => generarNotaPedidoSimple(pedido)}
           
                      className="px-4 py-2.5 bg-gray-500 text-white rounded-xl hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 font-medium flex items-center gap-2"
                    >
                      <Download size={18} />
                      Nota Simple
                    </button>
                  </div>
                )}

                {pedido && esPendiente && (
                  <button
                    type="button"
                    onClick={() => handleSubmit(undefined, "SURTIDO")}
                    className={styles.button.warning}
                  >
                    Marcar como SURTIDO
                  </button>
                )}

                {pedido && esSurtido && (
                  <button
                    type="button"
                    onClick={() => handleSubmit(undefined, "ENTREGADO")}
                    className={styles.button.success}
                  >
                    Marcar como ENTREGADO
                  </button>
                )}

                <button
                  type="submit"
                  className={styles.button.primary}
                >
                  Guardar
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
            {/* Modal de selección de pedidos */}
      {mostrarSeleccionPedidos && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[9999] p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Mover a otro pedido</h2>
              <button
                onClick={() => { setMostrarSeleccionPedidos(false); setProductoParaMover(null); }}
                className={styles.button.ghost}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Selecciona un pedido pendiente
              </label>
              <select
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                value={pedidoDestinoId ?? pedidosPendientes[0]?.id ?? ""}
                onChange={e => setPedidoDestinoId(Number(e.target.value))}
              >
                {pedidosPendientes.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.cliente ?? "Sin cliente"} - ${p.total?.toFixed(2)}
                  </option>
                ))}
              </select>

              {pedidoDestinoId == null && (
                <p className="text-red-600 text-sm mt-2">Debes seleccionar un pedido.</p>
              )}
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => setMostrarSeleccionPedidos(false)}
                className={styles.button.secondary}
              >
                Cancelar
              </button>
              <button
                onClick={() => setMostrarCantidadModal(true)}
                className={styles.button.primary}
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de cantidad */}
      {mostrarCantidadModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[9999] p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Cantidad a agregar</h2>
            </div>
            
            <div className="p-6">
              <input
                type="number"
                ref={inputCantidadRef}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-center text-lg font-semibold"
                value={cantidadInput}
                min="1"
                onChange={e => setCantidadInput(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => setMostrarCantidadModal(false)}
                className={styles.button.secondary}
              >
                Cancelar
              </button>
              <button
                onClick={confirmarAgregarAotroPedido}
                className={styles.button.primary}
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de cantidad para agregar producto */}
      {mostrarModalCantidad && productoParaCantidad && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[9999] p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-1">
                Cantidad para agregar
              </h3>
              <p className="text-sm text-gray-600">{productoParaCantidad.descripcion}</p>
            </div>
            
            <div className="p-6">
              <input
                type="number"
                ref={inputCantidadRef}
                min={1}
                autoFocus
                value={cantidadModal}
                onChange={(e) => setCantidadModal(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-center text-lg font-semibold"
                onKeyDown={(e) => {
                  if (cantidadModal === 1 && /^[0-9]$/.test(e.key)) {
                    e.preventDefault();
                    setCantidadModal(Number(e.key));
                    return;
                  }

                  if (e.key === "Enter") {
                    e.preventDefault();
                    agregarCantidadModal();
                  }
                }}
              />
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setMostrarModalCantidad(false)}
                className={styles.button.secondary}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={agregarCantidadModal}
                className={styles.button.primary}
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarProductoModal && (
        <ProductoModal
          producto={productoParaEditar}
          onClose={() => setMostrarProductoModal(false)}
          onGuardado={onProductoGuardado}
        />
      )}
    </div>
  );
};

export default PedidoModal;