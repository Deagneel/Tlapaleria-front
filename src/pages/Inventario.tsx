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
      const data = await obtenerProductos();
      setProductos(data);
    } catch (error) {
      console.error('Error al cargar productos', error);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  const handleEliminar = async (id: number) => {
    if (confirm('¿Deseas eliminar este producto?')) {
      await eliminarProducto(id);
      cargarProductos();
    }
  };

  const handleEditar = (producto: Producto) => {
    setProductoSeleccionado(producto);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGuardado = () => {
    setProductoSeleccionado(null);
    cargarProductos();
  };

  // Filtrado por clave, descripción o código de barras
  const productosFiltrados = productos.filter(p =>
    p.clave.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.codigo_barras.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Inventario</h1>

      {/* Formulario para agregar o editar */}
      <ProductoForm producto={productoSeleccionado} onGuardado={handleGuardado} />

      {/* Barra de búsqueda */}
      <input
        type="text"
        placeholder="Buscar por clave, descripción o código de barras"
        className="border p-2 mb-4 w-full"
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
      />

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
