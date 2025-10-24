import React, { useEffect, useState } from "react";
import type { Producto } from "../types/Producto";
import { crearProducto, actualizarProducto } from "../api/productos";

interface Props {
  producto: Producto | null;
  onClose: () => void;
  onGuardado: () => void;
}

const ProductoModal: React.FC<Props> = ({ producto, onClose, onGuardado }) => {
  const [form, setForm] = useState<Omit<Producto, "id">>({
    clave: "",
    descripcion: "",
    codigo_barras: "",
    costo: 0,
    precio: 0,
    precio_individual: 0,
    existencia: 0,
    existencia_min: 0,
    unidad: "",
    activo: true,
  });

  // Buffer para captura rápida del código de barras
  useEffect(() => {
    let buffer = "";
    let timer: number;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        if (buffer.length > 0) {
          setForm((prev) => ({ ...prev, codigo_barras: buffer }));
          buffer = "";
        }
      } else {
        buffer += e.key;
        clearTimeout(timer);
        timer = window.setTimeout(() => {
          buffer = "";
        }, 50); // ajusta según velocidad del lector
      }
    };

    window.addEventListener("keypress", handleKeyPress);
    return () => {
      window.removeEventListener("keypress", handleKeyPress);
      clearTimeout(timer);
    };
  }, []);

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
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? Number(value) : value,
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
      onGuardado();
      onClose();
    } catch (error) {
      console.error("Error al guardar el producto:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">
          {producto ? "Editar Producto" : "Agregar Producto"}
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            {/* Clave */}
            <div className="flex flex-col">
              <input
                name="clave"
                value={form.clave}
                onChange={handleChange}
                placeholder="Clave"
                required
                className="input"
              />
            </div>

            {/* Descripción */}
            <div className="flex flex-col">
              <input
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                placeholder="Descripción"
                required
                className="input h-12"
              />
            </div>

            {/* Código de barras */}
            <div className="flex flex-col">
              <input
                name="codigo_barras"
                value={form.codigo_barras}
                onChange={handleChange}
                placeholder="Código de barras"
                className="input"
              />
            </div>

            {/* Campos numéricos */}
            <div className="flex gap-4">
              <div className="flex-1 flex flex-col">
                <span className="text-gray-700 text-sm mb-1">Costo</span>
                <input
                  name="costo"
                  type="number"
                  value={form.costo}
                  onChange={handleChange}
                  placeholder="Costo"
                  required
                  className="input"
                />
              </div>

              <div className="flex-1 flex flex-col">
                <span className="text-gray-700 text-sm mb-1">Precio</span>
                <input
                  name="precio"
                  type="number"
                  value={form.precio}
                  onChange={handleChange}
                  placeholder="Precio Caja"
                  required
                  className="input"
                />
              </div>

              <div className="flex-1 flex flex-col">
                <span className="text-gray-700 text-sm mb-1">Precio Individual</span>
                <input
                  name="precio_individual"
                  type="number"
                  value={form.precio_individual}
                  onChange={handleChange}
                  placeholder="Precio Individual"
                  required
                  className="input"
                />
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2 font-medium text-gray-700"></label>

          <div className="md:col-span-2">
            <details className="bg-gray-50 rounded-lg p-3">
              <summary className="cursor-pointer text-sm font-medium text-blue-600">Mostrar más campos</summary>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex gap-4">
                  <div className="flex-1 flex flex-col">
                    <span className="text-gray-700 text-sm mb-1">Existencia</span>
                    <input
                      name="existencia"
                      type="number"
                      value={form.existencia}
                      onChange={handleChange}
                      placeholder="Existencia"
                      className="input"
                    />
                  </div>

                  <div className="flex-1 flex flex-col">
                    <span className="text-gray-700 text-sm mb-1">Existencia mínima</span>
                    <input
                      name="existencia_min"
                      type="number"
                      value={form.existencia_min}
                      onChange={handleChange}
                      placeholder="Existencia mínima"
                      className="input"
                    />
                  </div>
                </div>
              </div>
            </details>
          </div>

          <div className="flex justify-end gap-3 md:col-span-2 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
              Cancelar
            </button>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              {producto ? "Actualizar" : "Agregar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductoModal;
