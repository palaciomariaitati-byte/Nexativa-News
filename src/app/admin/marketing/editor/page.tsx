"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import NoraAssistant from "@/components/NoraAssistant";
import MediaUploader from "@/components/MediaUploader";
import { Sparkles, Film, Share2 } from "lucide-react";
import VideoSpotCreator from "@/components/VideoSpotCreator";
import { optimizeImagePrompt } from "@/app/admin/actions/nora";

export const maxDuration = 60; // Allow long LLM calls

export default function MarketingEditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!id);
  const [operatorRole, setOperatorRole] = useState("Staff");
  const [imagePrompt, setImagePrompt] = useState("");
  const [generatingImage, setGeneratingImage] = useState(false);
  const [customImagePrompt, setCustomImagePrompt] = useState("");
  const [showVideoSpotCreator, setShowVideoSpotCreator] = useState(false);
  
  const [formData, setFormData] = useState({
    client_name: "",
    campaign_name: "",
    content: "",
    image_url: "",
    target_audience: "",
    status: "draft"
  });

  const [sponsors, setSponsors] = useState<any[]>([]);
  const [selectedSponsorId, setSelectedSponsorId] = useState("");
  const [clientLogoUrl, setClientLogoUrl] = useState("");

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

    async function loadData() {
      // 1. Fetch all sponsors
      const { data: sponsorData } = await supabase.from("sponsors").select("id, name, logo_url, slogan, category").order("name");
      const loadedSponsors = sponsorData || [];
      setSponsors(loadedSponsors);

      // 2. Fetch campaign if editing
      if (id) {
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

          // Match sponsor by name
          const matched = loadedSponsors.find(s => s.name.toLowerCase() === data.client_name.toLowerCase());
          if (matched) {
            setSelectedSponsorId(matched.id);
            setClientLogoUrl(matched.logo_url || "");
          }
        }
        setFetching(false);
      }
    }
    loadData();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSponsorChange = (sponsorId: string) => {
    setSelectedSponsorId(sponsorId);
    if (sponsorId === "") {
      setClientLogoUrl("");
      return;
    }

    const sp = sponsors.find(s => s.id === sponsorId);
    if (sp) {
      setFormData(prev => ({
        ...prev,
        client_name: sp.name,
        target_audience: sp.slogan ? `Clientes interesados en ${sp.name}: ${sp.slogan}` : prev.target_audience
      }));
      setClientLogoUrl(sp.logo_url || "");
    }
  };

  const getBriefForNora = () => {
    const selectedSponsor = sponsors.find(s => s.id === selectedSponsorId);
    if (selectedSponsor) {
      return `[Cliente Registrado: ${selectedSponsor.name}, Rubro/Categoría: ${selectedSponsor.category}, Eslogan: ${selectedSponsor.slogan || "No especificado"}]. Idea base de la campaña del usuario: ${formData.content}`;
    }
    return formData.content;
  };

  const handleApplyNoraChanges = (newTitle: string, newContent: string, prompt?: string) => {
    setFormData(prev => ({
      ...prev,
      campaign_name: newTitle || prev.campaign_name,
      content: newContent || prev.content
    }));
    if (prompt) {
      setImagePrompt(prompt);
      setCustomImagePrompt(prompt); // Pre-fill input
    }
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

  const handleGenerateImage = async () => {
    const prompt = customImagePrompt.trim() || imagePrompt.trim();
    if (!prompt) {
      alert("Por favor escribe una descripción en español o pídele a Nora que te sugiera una estrategia primero.");
      return;
    }

    setGeneratingImage(true);
    try {
      // 1. Optimize user description with Gemini (turns Spanish slang or queries into professional English prompts)
      const optimizedPrompt = await optimizeImagePrompt(prompt);
      
      // 2. Build Pollinations URL (encoded)
      const encodedPrompt = encodeURIComponent(optimizedPrompt);
      const imageUrl = `https://image.pollinations.ai/p/${encodedPrompt}?width=1024&height=768&nologo=true&seed=${Math.floor(Math.random() * 100000)}`;

      // 3. Fetch the image as a Blob to store it in Supabase
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error("Fallo al descargar la imagen generada.");
      const blob = await response.blob();

      // 3. Upload to Supabase storage 'media' bucket
      const fileName = `campaigns/ai_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.jpg`;
      const { data, error: uploadError } = await supabase.storage
        .from("media")
        .upload(fileName, blob, { contentType: "image/jpeg", cacheControl: "3600" });

      if (uploadError) throw uploadError;

      // 4. Get public URL and set it in form
      const { data: publicUrlData } = supabase.storage.from("media").getPublicUrl(fileName);
      setFormData(prev => ({ ...prev, image_url: publicUrlData.publicUrl }));
      alert("¡Imagen de campaña generada y guardada con éxito! 🎨");
    } catch (err: any) {
      console.error(err);
      alert("Error al generar imagen: " + err.message);
    } finally {
      setGeneratingImage(false);
    }
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
              <label className="block text-sm font-bold text-[var(--color-brand-accent)] mb-2 uppercase">Cliente / Marca</label>
              
              <select
                value={selectedSponsorId}
                onChange={(e) => handleSponsorChange(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)] mb-2 text-xs cursor-pointer"
              >
                <option value="">-- Seleccionar Cliente Registrado --</option>
                {sponsors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.category})
                  </option>
                ))}
              </select>

              <input
                type="text"
                name="client_name"
                required
                value={formData.client_name}
                onChange={handleChange}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-accent)] text-xs"
                placeholder="O escribe un nombre de cliente personalizado"
              />

              {/* Prospect Logo Uploader if custom client is chosen */}
              {selectedSponsorId === "" && (
                <div className="mt-3 space-y-2 border-t border-white/5 pt-3 animate-fade-in">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide">Logo de Prospecto (Opcional)</label>
                  <div className="flex flex-col sm:flex-row gap-3 items-start">
                    <input
                      type="url"
                      value={clientLogoUrl}
                      onChange={(e) => setClientLogoUrl(e.target.value)}
                      className="flex-grow w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-xs text-white focus:outline-none focus:border-[var(--color-brand-accent)]"
                      placeholder="Pega la URL del logo de la empresa"
                    />
                    <MediaUploader 
                      label="Subir Logo"
                      onUploadSuccess={(url) => {
                        setClientLogoUrl(url);
                        alert("¡Logo del prospecto subido con éxito!");
                      }}
                    />
                  </div>
                  {clientLogoUrl && (
                    <div className="flex items-center gap-2 mt-2 bg-white/5 p-2 rounded-lg border border-white/5 max-w-xs">
                      <img src={clientLogoUrl} alt="Logo Prospecto" className="h-8 object-contain rounded" />
                      <span className="text-[10px] text-gray-400 truncate flex-grow">Logo cargado</span>
                      <button 
                        type="button" 
                        onClick={() => setClientLogoUrl("")} 
                        className="text-red-400 hover:text-red-300 text-xs font-bold font-sans cursor-pointer"
                      >
                        Quitar
                      </button>
                    </div>
                  )}
                </div>
              )}
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

            {/* Generación de Imagen IA */}
            <div className="bg-purple-950/20 border border-purple-500/25 rounded-xl p-4 space-y-3 mt-4">
              <span className="text-xs uppercase font-extrabold tracking-wider text-purple-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Herramientas Creativas de Agencia
              </span>
              
              <div className="space-y-2">
                <label className="text-xs text-gray-400 font-sans block">
                  Descripción para Generar Imagen:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customImagePrompt}
                    onChange={(e) => setCustomImagePrompt(e.target.value)}
                    placeholder="Ej: Un café humeante sobre una mesa rústica, foto comercial..."
                    className="flex-grow bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
                  />
                  <button
                    type="button"
                    disabled={generatingImage}
                    onClick={handleGenerateImage}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    {generatingImage ? "Generando..." : "Generar Imagen 🎨"}
                  </button>
                </div>
                {imagePrompt && (
                  <p className="text-[10px] text-purple-300 font-sans italic">
                    ✨ Prompt sugerido por Nora cargado: "{imagePrompt.substring(0, 80)}..."
                  </p>
                )}
              </div>

              {/* Botón para crear Spot de Video */}
              {formData.image_url && (
                <div className="pt-2 border-t border-white/5 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowVideoSpotCreator(true)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-lg transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Film className="w-3.5 h-3.5" />
                    Crear Spot de Video 🎥
                  </button>
                </div>
              )}
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
            content={getBriefForNora()}
            operatorName={operatorRole}
            onApplyChanges={handleApplyNoraChanges}
            onPublishDirectly={handlePublishDirectly}
          />
          
          {/* Manual Share Assistant */}
          {(formData.content || formData.image_url) && (
            <div className="mt-6 bg-black/40 border border-white/10 rounded-xl p-5 space-y-4">
              <h4 className="text-xs uppercase text-purple-300 font-extrabold tracking-wider flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5" /> Publicación Manual en Redes
              </h4>
              <p className="text-[10px] text-white/40 leading-relaxed font-sans">
                ¿Problemas de conexión con Make? Copia el copy y descarga el spot para publicarlo manualmente en tus perfiles:
              </p>
              
              <div className="space-y-3 text-xs">
                {/* 1. Copy text */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase text-white/45 font-bold block">Copia el Texto:</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(formData.content);
                      alert("¡Copy de Nora copiado con éxito!");
                    }}
                    className="w-full text-left bg-black/50 border border-white/10 rounded px-2.5 py-1.5 text-white text-[11px] truncate flex items-center justify-between hover:border-purple-500/40 transition-colors cursor-pointer"
                  >
                    <span className="truncate mr-2">{formData.content || "Copiar texto del anuncio"}</span>
                    <span className="text-[9px] uppercase font-bold text-purple-400 shrink-0">Copiar</span>
                  </button>
                </div>

                {/* 2. Download media */}
                {formData.image_url && (
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase text-white/45 font-bold block">Descarga el Spot / Imagen:</span>
                    <a
                      href={formData.image_url}
                      download={`spot_${formData.campaign_name || "campania"}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-purple-600/20 hover:bg-purple-600/35 border border-purple-500/45 rounded px-3 py-2 text-white font-bold flex items-center justify-center gap-1.5 transition-colors uppercase tracking-wider text-[10px] cursor-pointer"
                    >
                      Descargar Spot / Archivo 📥
                    </a>
                  </div>
                )}

                {/* 3. Direct links to social networks */}
                <div className="pt-2 border-t border-white/5 space-y-2">
                  <span className="text-[10px] uppercase text-white/45 font-bold block">Abrir Redes del Medio:</span>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-bold uppercase tracking-wider">
                    <a
                      href="https://instagram.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 rounded text-center hover:scale-105 transition-transform"
                    >
                      Instagram
                    </a>
                    <a
                      href="https://facebook.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-600 text-white py-2 rounded text-center hover:scale-105 transition-transform"
                    >
                      Facebook
                    </a>
                    <a
                      href="https://web.whatsapp.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-green-600 text-white py-2 rounded text-center hover:scale-105 transition-transform col-span-2"
                    >
                      WhatsApp Web / Business
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          <p className="text-xs text-white/50 mt-4 px-2">
            <strong>Tip:</strong> Escribe tu idea en "Copy" y pídele a Nora (Estratega) que diseñe la campaña. Ella cargará un prompt de imagen y creará el copy profesional para vos en español.
          </p>
        </div>
      </div>

      {showVideoSpotCreator && (
        <VideoSpotCreator
          imageUrl={formData.image_url}
          title={formData.campaign_name}
          copyText={formData.content}
          clientName={formData.client_name}
          clientLogoUrl={clientLogoUrl}
          onUploadFinished={(url) => {
            setFormData(prev => ({ ...prev, image_url: url }));
          }}
          onClose={() => setShowVideoSpotCreator(false)}
        />
      )}
    </div>
  );
}
