import React from "react";
import PressClient from "@/components/Admin/PressClient";

export const metadata = {
  title: "Prensa & Páginas Amarillas | Panel de Administración Nexativa",
  description: "Orquestador de Pitching periodístico, importador masivo B2B y campañas NORA Stealth Growth.",
};

export default function AdminPressPage() {
  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <PressClient />
    </div>
  );
}
