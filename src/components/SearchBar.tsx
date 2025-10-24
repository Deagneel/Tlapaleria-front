import React, { forwardRef } from "react";
import { Search } from "lucide-react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

const SearchBar = forwardRef<HTMLInputElement, Props>(
  ({ value, onChange, onKeyDown }, ref) => {
    return (
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        <input
          ref={ref} // <-- el ref se pasa aquí
          type="text"
          placeholder="Buscar producto por clave o descripción..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 placeholder-gray-400"
        />
      </div>
    );
  }
);

export default SearchBar;
