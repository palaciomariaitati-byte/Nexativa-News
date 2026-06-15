"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import NoraAssistant from "@/components/NoraAssistant";
import MediaUploader from "@/components/MediaUploader";

export default function MarketingEditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!id);
  const [operatorRole, setOperatorRole] = useState("Staff");
  
  const [formData, setFormData] = useState({
    client_name: "",
    campaign_name: "",
    content: "",
    image_url: "",
    target_audience: "",
    status: "draft"
  });

  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    async function checkRole() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const { data: staff } = await supabase.from("staff_profiles").select("role").eq("id", session.user.id).single();
        if (staff?.role) setOperatorRole(staff.role);
      }
    }
    checkRole();

    if (id) {
      async function fetchCampaign() {
        const { data, error } = await supabase.from("marketing_campaigns").select("*").eq("id", id).single();
        if (data && !error) {
          setFormData({
            client_name: data.client_name,
            campaign_name: data.campaign_name,
            content: data.content,
            image_url: data.image_url || "",
            target_audience: data.target_audience || "",
            status: data.status
          });
        }
        setFetching(false);
      }
      fetchCampaign();
    }
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleApplyNoraChanges = (newTitle: string, newContent: string) => {
    setFormData(prev => ({
      ...prev,
      campaign_name: newTitle || prev.campaign_name,
      content: newContent || prev.content
    }));
  };

  const handlePublishDirectly = async (newTitle: string, newContent: string) => {
    // Primero aplicamos los cambios
    setFormData(prev => ({
      ...prev,
      campaign_name: newTitle || prev.campaign_name,
      content: newContent || prev.content,
      status: "active"
    }));
    
    // Y guardamos forzando la publicación
    await handleSave(null, true, newTitle, newContent);
  };

  const handleSave = async (e: React.FormEvent | null, publishNow = false, overrideTitle?: string, overrideContent?: string) => {
    if (e) e.preventDefault();
    setLoading(true);

    const finalTitle = overrideTitle || formData.campaign_name;
    const finalContent = overrideContent || formData.content;
    const finalStatus = publishNow ? "active" : formData.status;

    if (!finalTitle || !formData.client_name) {
      alert("El nombre del cliente y la campaña son obligatorios.");
      setLoading(false);
      return;
    }

    const payload = {
      client_name: formData.client_name,
      campaign_name: finalTitle,
      content: finalContent,
      image_url: formData.image_url,
      target_audience: formData.target_audience,
      status: finalStatus
    };

    let savedId = id;

    if (id) {
      const { error } = await supabase.from("marketing_campaigns").update(payload).eq("id", id);
      if (error) {
        alert("Error al actualizar la campaña.");
        setLoading(false);
        return;
      }
    } else {
      const { data, error } = await supabase.from("marketing_campaigns").insert([payload]).select("id").single();
      if (error) {
        alert("Error al crear la campaña.");
        setLoading(false);
        return;
      }
      if (data) savedId = data.id;
    }

    // Trigger Social Media Publish si el status es active y apretaron el boton
    if (finalStatus === "active" || publishNow) {
      const wantToPublish = confirm("¿Deseas enviar esta campaña a Make.com para publicarla en todas las Redes Sociales ahora mismo?");
      if (wantToPublish && savedId) {
        try {
          const res = await fetch("/api/social-publish", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: savedId, type: "marketing" })
          });
          const result = await res.json();
          if (result.success) {
            alert("¡Campaña enviada a Redes Sociales con éxito!");
          } else {
            alert("Error al enviar a redes: " + result.error);
          }
        } catch (err) {
          alert("Fallo de conexión al disparar el webhook de redes.");
        }
      }
    }

    router.push("/admin/marketing");
    router.refresh();
  };

  if (fetching) return <div className="p-8 text-white/50">Cargando datos de la campaña...</div>;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 space-y-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-serif text-[var(--color-brand-accent)] tracking-widest uppercase">
            {id ? "Editar Campaña" : "Nueva Campaña"}
          </h1>
          <button 
            onClick={() => router.push("/admin/marketing")}
            className="text-white/50 hover:text-white transition-colors uppercase tracking-widest text-xs font-bold"
          >
            Volver
          </button>
        </div>

        <form id="marketing-form" onSubmit={(e) => handleSave(e, false)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-[var(--color-brand-accent)] mb-2 uppercase">Nombre del Cliente / Marca</label>
              <input
                type="text"
                name="client_name"
                required
                value={formData.client_name}
                onChange={handleChange}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)]"
                placeholder="Ej: Zapatería El Sol"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--color-brand-accent)] mb-2 uppercase">Nombre de la Campaña</label>
              <input
                type="text"
                name="campaign_name"
                required
                value={formData.campaign_name}
                onChange={handleChange}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)]"
                placeholder="Ej: Liquidación de Invierno 2026"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-[var(--color-brand-accent)] mb-2 uppercase">Público Objetivo (Target Audience)</label>
            <input
              type="text"
              name="target_audience"
              value={formData.target_audience}
              onChange={handleChange}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)]"
              placeholder="Ej: Mujeres de 25-45 años interesadas en moda en la ciudad"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[var(--color-brand-accent)] mb-2 uppercase">Media (Imagen o Video URL)</label>
            <div className="flex flex-col gap-4">
              <input
                type="url"
                name="image_url"
                value={formData.image_url}
                onChange={handleChange}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)]"
                placeholder="https://ejemplo.com/media.mp4 o pega un enlace aquí"
              />
              <MediaUploader 
                label="O sube tu archivo directamente a Supabase"
                onUploadSuccess={(url) => setFormData({ ...formData, image_url: url })}
              />
            </div>
            {formData.image_url && (
              <div className="mt-4 aspect-video rounded-lg overflow-hidden border border-white/10 relative h-48 w-full max-w-sm">
                {formData.image_url.match(/\.(mp4|webm|ogg)$/i) ? (
                  <video src={formData.image_url} controls className="object-cover w-full h-full" />
                ) : (
                  <img src={formData.image_url} alt="Preview" className="object-cover w-full h-full" />
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-[var(--color-brand-accent)] mb-2 uppercase">Copy / Contenido Base</label>
            <textarea
              name="content"
              required
              rows={8}
              value={formData.content}
              onChange={handleChange}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)]"
              placeholder="Escribe la idea principal del anuncio aquí..."
            />
          </div>

          <div className="flex gap-4 border-t border-white/10 pt-6">
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)]"
            >
              <option value="draft">Borrador</option>
              <option value="active">Activo (Publicado)</option>
              <option value="paused">Pausado</option>
              <option value="finished">Finalizado</option>
            </select>
            
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[var(--color-brand-accent)] text-black font-bold uppercase tracking-widest py-3 px-8 rounded-lg hover:scale-[1.02] transition-transform disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Guardar Campaña"}
            </button>
          </div>
        </form>
      </div>

      <div className="lg:w-96 flex-shrink-0">
        <div className="sticky top-8">
          <NoraAssistant 
            title={formData.campaign_name}
            content={formData.content}
            operatorName={operatorRole}
            onApplyChanges={handleApplyNoraChanges}
            onPublishDirectly={handlePublishDirectly}
          />
          <p className="text-xs text-white/50 mt-4 px-2">
            <strong>Tip:</strong> Puedes escribir una idea básica en el campo de "Copy" y pedirle a Nora (Ing. de Marketing) que redacte un Copy Viral profesional con emojis y hashtags. Luego puedes guardarlo directamente.
          </p>
        </div>
      </div>
    </div>
  );
}
