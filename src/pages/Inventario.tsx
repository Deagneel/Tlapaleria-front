import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import InventarioTable from "../components/InventarioTable";
import SearchBar from "../components/SearchBar";
import ProductoModal from "../components/ProductoModal";
import { obtenerProductos, eliminarProducto } from "../api/productos";
import type { Producto } from "../types/Producto";
import { PlusCircle } from "lucide-react";

const Inventario: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);

  const cargarProductos = async () => {
    try {
      const data = await obtenerProductos();
      setProductos(data);
    } catch (error) {
      console.error("Error al cargar productos:", error);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  const handleEditar = (producto: Producto) => {
    setProductoSeleccionado(producto);
    setMostrarModal(true);
  };

  const handleEliminar = async (id: number) => {
    if (confirm("¿Deseas eliminar este producto?")) {
      try {
        await eliminarProducto(id);
        cargarProductos();
      } catch (error) {
        console.error("Error al eliminar producto:", error);
      }
    }
  };

  const handleNuevo = () => {
    setProductoSeleccionado(null);
    setMostrarModal(true);
  };

  const productosFiltrados = productos.filter(
    (p) =>
      p.clave.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.descripcion.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <SearchBar value={busqueda} onChange={setBusqueda} />
        <button
          onClick={handleNuevo}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow"
        >
          <PlusCircle size={20} />
          Agregar Producto
        </button>
      </div>

      <InventarioTable
        productos={productosFiltrados}
        onEditar={handleEditar}
        onEliminar={handleEliminar}
      />

      {mostrarModal && (
        <ProductoModal
          producto={productoSeleccionado}
          onClose={() => setMostrarModal(false)}
          onGuardado={cargarProductos}
        />
      )}
    </Layout>
  );
};

export default Inventario;
