import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Pedidos from "./pages/Pedidos";
import Inventario from "./pages/Inventario";
import VentasPage from "./pages/Ventas";
import VentasHistorial from "./components/VentasHistorial";
import AnalisisVentas from "./pages/AnalisisVentas";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Inventario />} />
        <Route path="/pedidos" element={<Pedidos />} />
        <Route path="/inventario" element={<Inventario />} />
        <Route path="/ventas" element={<VentasPage />} />
        <Route path="/ventas-historial" element={<VentasHistorial />} />
        <Route path="/analisis-ventas" element={<AnalisisVentas />} />
      </Routes>
    </Router>
  );
};

export default App;
