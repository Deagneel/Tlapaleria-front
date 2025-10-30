import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Pedidos from "./pages/Pedidos";
import Inventario from "./pages/Inventario";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Pedidos />} />
        <Route path="/pedidos" element={<Pedidos />} />
        <Route path="/inventario" element={<Inventario />} />
      </Routes>
    </Router>
  );
};

export default App;
