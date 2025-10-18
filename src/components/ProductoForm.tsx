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



  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 p-2 border rounded">
      <div className="grid grid-cols-3 gap-2">
        <input name="clave" value={form.clave} onChange={handleChange} placeholder="Clave" className="border p-1" required />
        <input name="descripcion" value={form.descripcion} onChange={handleChange} placeholder="Descripción" className="border p-1" required />
        <input name="codigo_barras" value={form.codigo_barras} onChange={handleChange} placeholder="Código de barras" className="border p-1" required />
        <input name="costo" type="number" value={form.costo} onChange={handleChange} placeholder="Costo" className="border p-1" required />
        <input name="precio" type="number" value={form.precio} onChange={handleChange} placeholder="Precio caja" className="border p-1" required />
        <input name="precio_individual" type="number" value={form.precio_individual} onChange={handleChange} placeholder="Precio individual" className="border p-1" required />
        <input name="existencia" type="number" value={form.existencia} onChange={handleChange} placeholder="Existencia" className="border p-1" required />
        <input name="existencia_min" type="number" value={form.existencia_min} onChange={handleChange} placeholder="Existencia mínima" className="border p-1" required />
        <input name="unidad" value={form.unidad} onChange={handleChange} placeholder="Unidad" className="border p-1" required />
        <label className="flex items-center gap-1">
          Activo
          <input name="activo" type="checkbox" checked={form.activo} onChange={handleChange} />
        </label>
      </div>
      <button type="submit" className="bg-blue-500 text-white px-3 py-1 mt-2">
        {producto ? 'Actualizar' : 'Agregar'}
      </button>
    </form>
  );
};

export default ProductoForm;
