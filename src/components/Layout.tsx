import React from "react";
import { Menu, Package } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-100 text-gray-800">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg hidden md:flex flex-col">
        <div className="flex items-center gap-2 px-6 py-4 border-b">
          <Package className="text-blue-600" size={24} />
          <h1 className="text-lg font-semibold text-blue-600">Tlapalería Leo</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <a className="block py-2 px-3 rounded-lg hover:bg-blue-50 font-medium cursor-pointer">
            Ventas
          </a>
          <a className="block py-2 px-3 rounded-lg hover:bg-blue-50 font-medium cursor-pointer">
            Pedidos
          </a>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between bg-white shadow px-4 py-3 border-b sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <button className="md:hidden p-2 rounded hover:bg-gray-100">
              <Menu size={20} />
            </button>
            <h2 className="font-semibold text-lg">Almacen</h2>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
