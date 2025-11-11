import React, { forwardRef } from "react";
import { Search, X } from "lucide-react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

const SearchBar = forwardRef<HTMLInputElement, Props>(
  ({ value, onChange, onKeyDown }, ref) => {
    return (
      <div className="flex items-center gap-2 w-full max-w-md">
        <div className="relative flex-1">
          {/* Icono de búsqueda dentro del input */}
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />

          <input
            ref={ref}
            type="text"
            placeholder="Buscar..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 placeholder-gray-400"
          />
        </div>

        {/* Botón limpiar (afuera del input, se alinea bonito) */}
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="px-2.5 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 text-gray-600 flex items-center justify-center"
            title="Borrar búsqueda"
          >
            <X size={16} />
          </button>
        )}
      </div>
    );
  }
);

export default SearchBar;
