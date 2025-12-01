import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { 
  Menu, 
  Package, 
  ShoppingCart, 
  ClipboardList, 
  Boxes, 
  History,
  TrendingUp,
  Home
} from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(true);
  const location = useLocation();

  const handleLinkClick = () => {
    if (!collapsed) setCollapsed(true);
  };

  const navigationItems = [
    { 
      path: "/ventas", 
      icon: ShoppingCart, 
      label: "Ventas",
      description: "Registro de ventas"
    },
    { 
      path: "/pedidos", 
      icon: ClipboardList, 
      label: "Pedidos",
      description: "Gestión de pedidos"
    },
    { 
      path: "/inventario", 
      icon: Boxes, 
      label: "Almacén",
      description: "Control de inventario"
    },
    { 
      path: "/ventas-historial", 
      icon: History, 
      label: "Historial",
      description: "Historial de ventas"
    },
    { 
      path: "/analisis-ventas", 
      icon: TrendingUp, 
      label: "Análisis",
      description: "Análisis de ventas"
    },
  ];

  const isActiveLink = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-100 to-blue-50/100 text-gray-800">
      <aside
        className={`bg-gray-50 backdrop-blur-sm shadow-xl flex flex-col transition-all duration-300 border-r border-gray-200/50 ${
          collapsed ? "w-15" : "w-56"
        }`}
      >
        <div className="flex items-center gap-2 px-3 py-4 border-b border-gray-200/50">
          <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-sm">
            <Package className="text-white" size={20} />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold text-gray-800">Tlapalería Leo</h1>
              <p className="text-xs text-gray-500">Sistema de gestión</p>
            </div>
          )}
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveLink(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleLinkClick}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 py-2 px-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? "bg-blue-500/10 border border-blue-200/50 text-blue-700 shadow-sm" 
                    : "hover:bg-gray-100/50 text-gray-600 hover:text-gray-800"
                }`}
              >
                <div className={`p-1.5 rounded-lg transition-colors ${
                  isActive 
                    ? "bg-blue-500 text-white shadow-sm" 
                    : "bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600"
                }`}>
                  <Icon size={18} />
                </div>
                
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm block">{item.label}</span>
                    <span className="text-xs text-gray-500 block mt-0.5">
                      {item.description}
                    </span>
                  </div>
                )}
                
                {!collapsed && isActive && (
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full ml-auto" />
                )}
              </Link>
            );
          })}
        </nav>

        {!collapsed && (
          <div className="p-3 border-t border-gray-200/50">
            <div className="text-center">
              <p className="text-xs text-gray-500">
                v1.0.0
              </p>
            </div>
          </div>
        )}
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white/90 backdrop-blur-sm shadow-sm border-b border-gray-200/50 sticky top-0 z-10">
          <div className="flex bg-gray-50 items-center justify-between px-6 py-3">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="p-2 bg-gray-200 rounded-xl hover:bg-gray-100/80 transition-colors text-gray-500 hover:text-gray-700"
              >
                <Menu size={20} />
              </button>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Home size={16} />
                <span>/</span>
                <span className="font-medium text-gray-800 capitalize">
                  {location.pathname.split('/')[1] || 'dashboard'}
                </span>
              </div>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;