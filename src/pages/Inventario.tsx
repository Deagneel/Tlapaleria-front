import React, { useEffect, useState } from 'react';
import type { Producto } from '../types/Producto';
import { obtenerProductos, eliminarProducto } from '../api/productos';
import ProductoForm from '../components/ProductoForm';
import ProductoList from '../components/ProductoList';

const Inventario: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [busqueda, setBusqueda] = useState('');

  const cargarProductos = async () => {
    try {
      const datos = await obtenerProductos();
      setProductos(datos);
    } catch (error) {
      console.error("Error cargando productos:", error);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  const handleEditar = (producto: Producto) => {
    setProductoSeleccionado(producto);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEliminar = async (id: number) => {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      try {
        await eliminarProducto(id);
        cargarProductos();
      } catch (error) {
        console.error("Error eliminando producto:", error);
      }
    }
  };

  const handleGuardado = () => {
    setProductoSeleccionado(null);
    cargarProductos();
  };

  const productosFiltrados = productos.filter(p =>
    p.clave.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.descripcion.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4 text-gray-700">Inventario</h1>

      {/* Formulario */}
      <ProductoForm producto={productoSeleccionado} onGuardado={handleGuardado} />

      {/* Búsqueda */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por clave o descripción..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none"
        />
      </div>

      {/* Lista de productos */}
      <ProductoList
        productos={productosFiltrados}
        onEditar={handleEditar}
        onEliminar={handleEliminar}
      />
    </div>
  );
};

export default Inventario;
