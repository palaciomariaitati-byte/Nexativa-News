import React from "react";
import SponsorForm from "../SponsorForm";

export default function NewSponsorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nuevo Patrocinador</h1>
        <p className="text-gray-400 mt-2">Agrega un nuevo cliente, sube sus imágenes y configura sus enlaces.</p>
      </div>
      
      <SponsorForm />
    </div>
  );
}
