import React from "react";

interface Props {
  week?: string;
  day?: string;
  ventaId?: number;
  onBack: () => void;
  onShowToday: () => void;
}

const BreadCrumbs: React.FC<Props> = ({ week, day, ventaId, onBack, onShowToday }) => {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Botón Regresar */}
      <button 
        onClick={onBack}
        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Regresar
      </button>

      {/* Botón Ventas de Hoy */}
      <button
        onClick={onShowToday}
        className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md font-medium flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Ventas de Hoy
      </button>

      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm">
        {week && (
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg font-medium">
              Semana {week}
            </span>
            <span className="text-gray-400">/</span>
          </div>
        )}
        {day && (
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 bg-green-100 text-green-800 rounded-lg font-medium">
              {day}
            </span>
            <span className="text-gray-400">/</span>
          </div>
        )}
        {ventaId && (
          <span className="px-3 py-1.5 bg-purple-100 text-purple-800 rounded-lg font-medium">
            Venta #{ventaId}
          </span>
        )}
      </div>
    </div>
  );
};

export default BreadCrumbs;