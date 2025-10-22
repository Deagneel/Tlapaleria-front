import React from 'react';
import type { Producto } from '../types/Producto';

interface Props {
  productos: Producto[];
  onEditar: (producto: Producto) => void;
  onEliminar: (id: number) => void;
}

const ProductoList: React.FC<Props> = ({ productos, onEditar, onEliminar }) => {
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {productos.map((producto) => (
        <div key={producto.id} className="bg-white shadow-md rounded-lg p-4 flex flex-col justify-between">
          <div className="mb-2">
            <h3 className="font-bold text-lg">{producto.clave} - {producto.descripcion}</h3>
            <p className="text-sm text-gray-600">Unidad: {producto.unidad}</p>
          </div>
          <div className="text-sm space-y-1">
            <p>Costo: ${ Number(producto.costo ?? 0).toFixed(2) }</p>
            <p>Precio Caja: ${ Number(producto.precio ?? 0).toFixed(2) }</p>
            <p>Precio Individual: ${ Number(producto.precio_individual ?? 0).toFixed(2) }</p>
            <p>Existencia: {producto.existencia}</p>
            <p>Existencia Mínima: {producto.existencia_min}</p>
          </div>
          <div className="mt-4 flex justify-between">
            <button
              className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
              onClick={() => onEditar(producto)}
            >
              Editar
            </button>
            <button
              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              onClick={() => onEliminar(producto.id)}
            >
              Eliminar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductoList;
