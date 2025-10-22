import React, { useState } from "react";
import type { Producto } from "../types/Producto";
import { ChevronDown, ChevronUp, Edit, Trash } from "lucide-react";

interface Props {
  productos: Producto[];
  onEditar: (producto: Producto) => void;
  onEliminar: (id: number) => void;
}

const InventarioTable: React.FC<Props> = ({ productos, onEditar, onEliminar }) => {
  const [detallesAbiertos, setDetallesAbiertos] = useState<number | null>(null);

  const toggleDetalles = (id: number) => {
    setDetallesAbiertos(detallesAbiertos === id ? null : id);
  };

  if (productos.length === 0) {
    return <p className="text-gray-500 mt-6 text-center">No hay productos registrados.</p>;
  }

  return (
    <div className="overflow-x-auto bg-white shadow rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-blue-600 text-white">
          <tr>
            <th className="px-4 py-2 text-left font-semibold">Clave</th>
            <th className="px-4 py-2 text-left font-semibold">Descripción</th>
            <th className="px-4 py-2 text-left font-semibold">Costo</th>
            <th className="px-4 py-2 text-left font-semibold">Precio</th>
            <th className="px-4 py-2 text-left font-semibold">Precio Individual</th>
            <th className="px-4 py-2 text-center font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {productos.map((producto) => (
            <React.Fragment key={producto.id}>
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-2">{producto.clave}</td>
                <td className="px-4 py-2">{producto.descripcion}</td>
                <td className="px-4 py-2">${Number(producto.costo).toFixed(2)}</td>
                <td className="px-4 py-2">${Number(producto.precio).toFixed(2)}</td>
                <td className="px-4 py-2">${Number(producto.precio_individual).toFixed(2)}</td>
                <td className="px-4 py-2 text-center">
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => onEditar(producto)}
                      className="bg-gray-300 text-blue-600 hover:text-blue-800"
                      title="Editar"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => onEliminar(producto.id)}
                      className="bg-gray-300 text-red-500 hover:text-red-700"
                      title="Eliminar"
                    >
                      <Trash size={18} />
                    </button>
                    <button
                      onClick={() => toggleDetalles(producto.id)}
                      className="bg-gray-300 text-gray-500 hover:text-gray-700"
                      title="Ver más detalles"
                    >
                      {detallesAbiertos === producto.id ? (
                        <ChevronUp size={18} />
                      ) : (
                        <ChevronDown size={18} />
                      )}
                    </button>
                  </div>
                </td>
              </tr>

              {detallesAbiertos === producto.id && (
                <tr className="bg-gray-50">
                  <td colSpan={7} className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-700">
                      <p><strong>Código de Barras:</strong> {producto.codigo_barras || "N/A"}</p>
                      <p><strong>Existencia:</strong> {producto.existencia}</p>
                      <p><strong>Existencia Mínima:</strong> {producto.existencia_min}</p>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InventarioTable;
