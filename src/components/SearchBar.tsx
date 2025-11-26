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
      <div className="relative w-full max-w-md">
        {/* Icono de búsqueda */}
        <Search 
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors duration-200" 
          size={20} 
        />

        {/* Input principal */}
        <input
          ref={ref}
          type="text"
          placeholder="Buscar..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          className="w-full pl-12 pr-11 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-gray-900 placeholder-gray-500 transition-all duration-200 shadow-sm hover:shadow-md focus:shadow-lg"
        />

        {/* Botón de limpiar integrado */}
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 rounded-lg transition-all duration-200 hover:scale-110"
            title="Limpiar búsqueda"
          >
            <X size={16} />
          </button>
        )}
      </div>
    );
  }
);

export default SearchBar;
