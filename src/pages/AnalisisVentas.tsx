import React from "react";
import ResumenGeneral from "../components/AnalisisVentas/ResumenGeneral";
import GraficaMensual from "../components/AnalisisVentas/GraficaMensual";
import GraficaSemanal from "../components/AnalisisVentas/GraficaSemanal";
import ComparadorAnios from "../components/AnalisisVentas/ComparadorAnios";
import TablaProductosMasVendidos from "../components/AnalisisVentas/TablaProductosMasVendidos";
import GraficaTotalRegistrado from "../components/AnalisisVentas/GraficaTotalRegistrado";
import Layout from "../components/Layout";

const AnalisisVentas: React.FC = () => {
  return (
    <Layout>
        <div className="p-4 md:p-6 space-y-6">
            <h1 className="text-2xl font-bold">Análisis de Ventas</h1>
            <ResumenGeneral />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GraficaMensual />
                <GraficaSemanal />
            </div>
            <TablaProductosMasVendidos />
            <ComparadorAnios />
            <GraficaTotalRegistrado />
            </div>
    </Layout>
  );
};

export default AnalisisVentas;
