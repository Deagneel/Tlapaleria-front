import React, { useEffect, useState } from "react";
import { X, Save, Package, Barcode, DollarSign, Box, Layers, ChevronDown } from "lucide-react";
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
    es_producto_paquete: false,
    piezas_por_paquete: 1,
    piezas_individuales: 0,
  });

  useEffect(() => {
    let buffer = "";
    let lastKeyTime = 0;
    let timer: number;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT") return;

      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 100) buffer = "";

      if (e.key === "Enter") {
        if (buffer.length > 0) {
          setForm((prev) => ({ ...prev, codigo_barras: buffer.trim() }));
          buffer = "";
        }
      } else {
        if (/^[a-zA-Z0-9\-_.]$/.test(e.key)) buffer += e.key;
      }

      lastKeyTime = currentTime;
      clearTimeout(timer);
      timer = window.setTimeout(() => (buffer = ""), 300);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
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
        es_producto_paquete: producto.es_producto_paquete ?? false,
        piezas_por_paquete: producto.piezas_por_paquete ?? 1,
        piezas_individuales: producto.piezas_individuales ?? 0,
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header - SIN CAMBIOS */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Package size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {producto ? "Editar Producto" : "Agregar Producto"}
              </h2>
              <p className="text-blue-100 text-sm">
                {producto ? "Actualiza la información del producto" : "Completa los datos del nuevo producto"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition-all duration-200 hover:scale-110"
          >
            <X size={24} />
          </button>
        </div>

        <form 
          onSubmit={handleSubmit} 
          onKeyDown={(e) => {
            const target = e.target as HTMLElement;
            if (e.key === "Enter" && target.tagName === "INPUT") {
              e.preventDefault(); 
            }
          }} 
          className="p-6 overflow-auto max-h-[calc(90vh-80px)]"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <div className="p-1.5 bg-blue-100 rounded-lg">
                    <Package size={14} className="text-blue-600" />
                  </div>
                  Clave del Producto *
                </label>
                <input
                  name="clave"
                  value={form.clave}
                  onChange={handleChange}
                  placeholder="Ej: A12345"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 bg-white text-gray-900 placeholder-gray-500"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <div className="p-1.5 bg-green-100 rounded-lg">
                    <Package size={14} className="text-green-600" />
                  </div>
                  Descripción *
                </label>
                <input
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleChange}
                  placeholder="Descripción completa del producto"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 bg-white text-gray-900 placeholder-gray-500"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <div className="p-1.5 bg-purple-100 rounded-lg">
                    <Barcode size={14} className="text-purple-600" />
                  </div>
                  Código de Barras
                </label>
                <input
                  name="codigo_barras"
                  value={form.codigo_barras}
                  onChange={handleChange}
                  placeholder="Escanea o ingresa el código"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 bg-white text-gray-900 placeholder-gray-500"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <div className="p-1.5 bg-orange-100 rounded-lg">
                    <DollarSign size={14} className="text-orange-600" />
                  </div>
                  Costo de Compra *
                </label>
                <input
                  name="costo"
                  type="number"
                  step="0.01"
                  value={form.costo}
                  onFocus={(e) => e.target.select()}
                  onChange={handleChange}
                  placeholder="0.00"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 bg-white text-gray-900 placeholder-gray-500 no-spin"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <div className="p-1.5 bg-green-100 rounded-lg">
                      <Box size={14} className="text-green-600" />
                    </div>
                    Precio *
                  </label>
                  <input
                    name="precio"
                    type="number"
                    step="0.01"
                    value={form.precio}
                    onFocus={(e) => e.target.select()}
                    onChange={handleChange}
                    placeholder="0.00"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 bg-white text-gray-900 placeholder-gray-500 no-spin"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <div className="p-1.5 bg-blue-100 rounded-lg">
                      <Package size={14} className="text-blue-600" />
                    </div>
                    Precio por unidad *
                  </label>
                  <input
                    name="precio_individual"
                    type="number"
                    step="0.01"
                    value={form.precio_individual}
                    onFocus={(e) => e.target.select()}
                    onChange={handleChange}
                    placeholder="0.00"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 bg-white text-gray-900 placeholder-gray-500 no-spin"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <details className="group bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border border-orange-200 overflow-hidden">
              <summary className="cursor-pointer p-4 flex items-center justify-between text-gray-700 hover:bg-white/50 transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Package size={18} className="text-orange-600" />
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900">Producto Empaquetado</span>
                    <p className="text-sm text-gray-600">Configuración para productos que se venden por unidad</p>
                  </div>
                </div>
                <div className="transform group-open:rotate-180 transition-transform duration-200">
                  <ChevronDown size={20} className="text-orange-400" />
                </div>
              </summary>
              
              <div className="p-4 border-t border-orange-200 bg-white">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      name="es_producto_paquete"
                      checked={form.es_producto_paquete}
                      onChange={handleChange}
                      className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
                    />
                    <label className="text-sm font-medium text-gray-700">
                      ¿Es producto empaquetado?
                    </label>
                  </div>
                  {form.es_producto_paquete && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6 border-l-2 border-orange-200">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Piezas por paquete *
                        </label>
                        <input
                          name="piezas_por_paquete"
                          type="number"
                          value={form.piezas_por_paquete}
                          onChange={handleChange}
                          min="1"
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-200 bg-white text-gray-900"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Piezas individuales en stock
                        </label>
                        <input
                          name="piezas_individuales"
                          type="number"
                          value={form.piezas_individuales}
                          onChange={handleChange}
                          min="0"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-200 bg-white text-gray-900"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </details>
          </div>
          <div className="mt-6">
            <details className="group bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200 overflow-hidden">
              <summary className="cursor-pointer p-4 flex items-center justify-between text-gray-700 hover:bg-white/50 transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Layers size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900">Configuración de Inventario</span>
                    <p className="text-sm text-gray-600">Existencia y niveles de stock</p>
                  </div>
                </div>
                <div className="transform group-open:rotate-180 transition-transform duration-200">
                  <ChevronDown size={20} className="text-gray-400" />
                </div>
              </summary>
              
              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      Existencia Actual
                    </label>
                    <input
                      name="existencia"
                      type="number"
                      value={form.existencia}
                      onFocus={(e) => e.target.select()}
                      onChange={handleChange}
                      placeholder="0"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 bg-white text-gray-900 placeholder-gray-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      Existencia Mínima
                    </label>
                    <input
                      name="existencia_min"
                      type="number"
                      value={form.existencia_min}
                      onFocus={(e) => e.target.select()}
                      onChange={handleChange}
                      placeholder="0"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 bg-white text-gray-900 placeholder-gray-500"
                    />
                  </div>
                </div>
              </div>
            </details>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
            <button 
              type="button" 
              onClick={onClose}
              className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 transition-all duration-200 font-medium border border-red-200"
            >
              <X size={18} />
              Cancelar
            </button>
            <button 
              type="submit" 
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
            >
              <Save size={18} />
              {producto ? "Actualizar Producto" : "Agregar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductoModal;