"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Image as ImageIcon, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export default function NoraLiveEditor() {
  const [draft, setDraft] = useState<string>("");
  const [messages, setMessages] = useState<{role: 'user'|'nora', text: string}[]>([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsProcessing(true);

    try {
      const res = await fetch("/api/nora-live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, currentDraft: draft })
      });
      const data = await res.json();
      if (data.newDraft) {
        setDraft(data.newDraft);
        setMessages(prev => [...prev, { role: 'nora', text: "Borrador actualizado." }]);
      } else {
        setMessages(prev => [...prev, { role: 'nora', text: data.reply || "Error al procesar." }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'nora', text: "Hubo un error de conexión." }]);
    }
    setIsProcessing(false);
  };
  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.7));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (file: File) => {
    setPendingImage(file);
    setMessages(prev => [...prev, { role: 'user', text: `[Imagen adjunta: ${file.name}]` }]);
    setIsProcessing(true);

    try {
      const base64Image = await resizeImage(file);
      
      const res = await fetch("/api/nora-live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: input.trim() ? `El periodista adjuntó una imagen. Contexto adicional: ${input.trim()}` : "El periodista adjuntó una imagen desde el lugar de los hechos. Descríbela e intégrala a la noticia.", 
          currentDraft: draft,
          image: base64Image
        })
      });
      
      if (!res.ok) {
        throw new Error("HTTP error " + res.status);
      }
      
      const data = await res.json();
      if (data.newDraft) {
        setDraft(data.newDraft);
        setMessages(prev => [...prev, { role: 'nora', text: "Borrador actualizado con la información de la imagen." }]);
        setInput(""); // Clear input if it was sent with the image
      } else {
        setMessages(prev => [...prev, { role: 'nora', text: data.reply || "Error al procesar la imagen." }]);
      }
    } catch (e: any) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'nora', text: "Hubo un error de conexión al enviar la imagen. (La imagen podría ser muy pesada o hubo un fallo de red)." }]);
    }
    setIsProcessing(false);
  };
  const handlePublish = async () => {
    if (!draft.trim()) return;
    setIsPublishing(true);
    try {
      let imageUrl = null;
      if (pendingImage) {
        const fileExt = pendingImage.name.split('.').pop();
        const filePath = `articles/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('uploads').upload(filePath, pendingImage);
        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage.from('uploads').getPublicUrl(filePath);
          imageUrl = publicUrlData.publicUrl;
        }
      }

      const { error } = await supabase.from("articles").insert({
        title: "🔴 Noticia en Desarrollo",
        excerpt: draft.substring(0, 150) + "...",
        content: draft + "<br><br><strong>🔴 Noticia en Desarrollo - Actualizada hace instantes</strong>",
        status: "published",
        type: "news",
        image_url: imageUrl,
        author_id: (await supabase.auth.getUser()).data.user?.id
      });
      if (!error) {
        setPublished(true);
        setMessages(prev => [...prev, { role: 'nora', text: "¡Noticia publicada con éxito!" }]);
      }
    } catch (e) {
      console.error(e);
    }
    setIsPublishing(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 flex flex-col md:flex-row gap-8 h-[calc(100vh-100px)]">
      
      {/* Columna Izquierda: Chat con Nora */}
      <div className="w-full md:w-1/2 flex flex-col bg-black/40 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-orange-500/20 to-transparent p-4 border-b border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold">N</div>
          <div>
            <h2 className="font-bold text-lg">Nora Live Editor</h2>
            <p className="text-xs text-orange-200">Redactora Jefa (Modo Rápido)</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="bg-white/5 p-3 rounded-lg max-w-[85%] text-sm text-gray-300">
            Hola. Estoy lista para armar la nota en vivo. Envíame los datos sueltos o las fotos, yo redactaré el borrador al instante.
          </div>
          {messages.map((msg, i) => (
            <div key={i} className={`p-3 rounded-lg max-w-[85%] text-sm ${msg.role === 'user' ? 'bg-orange-600/30 ml-auto' : 'bg-white/5 mr-auto'}`}>
              {msg.text}
            </div>
          ))}
          {isProcessing && (
            <div className="bg-white/5 p-3 rounded-lg max-w-[85%] text-sm text-gray-400 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Escribiendo...
            </div>
          )}
          <div ref={endOfMessagesRef} />
        </div>

        <div className="p-4 border-t border-white/10 bg-black/60 flex items-center gap-2">
          <label className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-gray-400 cursor-pointer">
            <ImageIcon className="w-5 h-5" />
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
              }}
            />
          </label>
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Escribe el suceso aquí..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500/50"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
            className="p-3 bg-orange-600 rounded-xl hover:bg-orange-500 transition-colors disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Columna Derecha: Borrador en Vivo */}
      <div className="w-full md:w-1/2 flex flex-col bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/40">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Borrador en Desarrollo
          </h2>
          <button 
            onClick={handlePublish}
            disabled={!draft.trim() || isPublishing || published}
            className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : published ? <CheckCircle className="w-4 h-4" /> : "¡PUBLICAR AHORA!"}
          </button>
        </div>
        
        <div className="flex-1 p-6 overflow-y-auto">
          {draft ? (
            <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: draft }} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 italic text-sm">
              <p>El borrador está vacío.</p>
              <p className="mt-2">Envíale datos a Nora para empezar a redactar.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
