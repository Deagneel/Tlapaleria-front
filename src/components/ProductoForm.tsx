import React, { useEffect, useState } from 'react';
import type { Producto } from '../types/Producto';
import { crearProducto, actualizarProducto } from '../api/productos';

interface Props {
  producto: Producto | null;
  onGuardado: () => void;
}

const ProductoForm: React.FC<Props> = ({ producto, onGuardado }) => {
  const [form, setForm] = useState<Omit<Producto, 'id'>>({
    clave: '',
    descripcion: '',
    codigo_barras: '',
    costo: 0,
    precio: 0,
    precio_individual: 0,
    existencia: 0,
    existencia_min: 0,
    unidad: '',
    activo: true,
  });

  // Cargar datos del producto al editar
  useEffect(() => {
    if (producto) {
      setForm({
        clave: producto.clave,
        descripcion: producto.descripcion,
        codigo_barras: producto.codigo_barras,
        costo: producto.costo,
        precio: producto.precio,
        precio_individual: producto.precio_individual,
        existencia: producto.existencia,
        existencia_min: producto.existencia_min,
        unidad: producto.unidad,
        activo: producto.activo,
      });
    }
  }, [producto]);

  // Escucha del lector de código de barras (solo si no hay modal activo)
  useEffect(() => {
    const modalAbierto = document.querySelector('.fixed.inset-0');
    if (modalAbierto) return; // no escuchar si hay un modal abierto

    let buffer = '';
    let timer: number;

    const handleKeyPress = (e: KeyboardEvent) => {
      // si el usuario escribe manualmente dentro de un input, no interferir
      if ((e.target as HTMLElement).tagName === 'INPUT') return;

      if (e.key === 'Enter') {
        if (buffer.length > 0) {
          setForm(prev => ({ ...prev, codigo_barras: buffer }));
          buffer = '';
        }
      } else {
        buffer += e.key;
        clearTimeout(timer);
        timer = window.setTimeout(() => {
          buffer = '';
        }, 50);
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => {
      window.removeEventListener('keypress', handleKeyPress);
      clearTimeout(timer);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (producto) {
        await actualizarProducto(producto.id, form);
      } else {
        await crearProducto(form);
      }

      setForm({
        clave: '',
        descripcion: '',
        codigo_barras: '',
        costo: 0,
        precio: 0,
        precio_individual: 0,
        existencia: 0,
        existencia_min: 0,
        unidad: '',
        activo: true,
      });

      onGuardado();
    } catch (error) {
      console.error('Error al guardar el producto:', error);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white shadow-lg rounded-xl p-6 mb-6 border border-gray-200"
    >
      <h2 className="text-xl font-semibold mb-4 text-gray-700">
        {producto ? 'Editar Producto' : 'Agregar Producto'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <input
          name="clave"
          value={form.clave}
          onChange={handleChange}
          placeholder="Clave"
          className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none"
          required
        />
        <input
          name="descripcion"
          value={form.descripcion}
          onChange={handleChange}
          placeholder="Descripción"
          className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none"
          required
        />
        <input
          name="codigo_barras"
          value={form.codigo_barras}
          onChange={handleChange}
          placeholder="Código de barras"
          className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none"
        />
        <input
          name="costo"
          type="number"
          value={form.costo}
          onChange={handleChange}
          placeholder="Costo"
          className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none"
          required
        />
        <input
          name="precio"
          type="number"
          value={form.precio}
          onChange={handleChange}
          placeholder="Precio Caja"
          className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none"
          required
        />
        <input
          name="precio_individual"
          type="number"
          value={form.precio_individual}
          onChange={handleChange}
          placeholder="Precio Individual"
          className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none"
          required
        />
        <input
          name="existencia"
          type="number"
          value={form.existencia}
          onChange={handleChange}
          placeholder="Existencia"
          className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none"
          required
        />
        <input
          name="existencia_min"
          type="number"
          value={form.existencia_min}
          onChange={handleChange}
          placeholder="Existencia mínima"
          className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none"
          required
        />
        <input
          name="unidad"
          value={form.unidad}
          onChange={handleChange}
          placeholder="Unidad"
          className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none"
          required
        />
        <label className="flex items-center gap-2 text-gray-700 font-medium">
          <input
            name="activo"
            type="checkbox"
            checked={form.activo}
            onChange={handleChange}
            className="w-4 h-4 accent-blue-500"
          />
          Activo
        </label>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
        >
          {producto ? 'Actualizar' : 'Agregar'}
        </button>
      </div>
    </form>
  );
};

export default ProductoForm;
