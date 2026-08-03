"use client";

import React, { useState, use } from 'react';
import Link from 'next/link';

interface CalificarProps {
  params: Promise<{ job_id: string }>;
}

export default function CalificarInstantaneoPage({ params }: CalificarProps) {
  const { job_id } = use(params);

  const [rating, setRating] = useState(5);
  const [tags, setTags] = useState<string[]>(['Puntual', 'Prolijo']);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter((t) => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: '1',
          reviewer_name: 'Vecino Verificado QR',
          reviewer_whatsapp: '5493786400000',
          rating,
          comment: `${tags.join(', ')}. ${comment}`,
        }),
      });
    } catch {
      // Ignorar error simulado
    } finally {
      setSubmitting(false);
      setSubmitted(true);
    }
  };

  const availableTags = [
    '⏱️ Puntual',
    '🛠️ Prolijo y Limpio',
    '💰 Precio Justo',
    '💬 Excelente Trato',
    '⚡ Respuesta Rápida',
  ];

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 p-4 sm:p-6 font-sans flex flex-col justify-between items-center">
      <div className="max-w-md w-full my-auto">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block mb-1">
            Nexativa Empleos & Oficios
          </span>
          <h1 className="text-2xl font-extrabold text-white">Calificación Instantánea</h1>
          <p className="text-xs font-mono text-gray-400 mt-1">Sesión: {job_id}</p>
        </div>

        {submitted ? (
          <div className="bg-gray-900 border border-emerald-500/40 rounded-3xl p-8 text-center shadow-2xl animate-fade-in">
            <span className="text-5xl block mb-4">🎉</span>
            <h2 className="text-2xl font-bold text-white mb-2">¡Muchas Gracias!</h2>
            <p className="text-sm text-gray-300 mb-6">
              Tu valoración de <strong className="text-emerald-400">⭐ {rating} Estrellas</strong> ha sido computada en el acto en el puntaje <strong className="text-emerald-400">NoraScore™</strong> del prestador.
            </p>

            <Link
              href="/empleos"
              className="inline-block w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-colors"
            >
              🌐 Ver Portal Nexativa Empleos
            </Link>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-2xl">
            {/* Perfil del Prestador a Calificar */}
            <div className="flex items-center gap-3 p-3 bg-gray-800/60 rounded-2xl mb-6 border border-gray-700/50">
              <div className="w-12 h-12 rounded-full bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center font-bold text-emerald-400 text-lg">
                👨‍🔧
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Don Pedro González</h3>
                <p className="text-xs text-emerald-400 font-semibold">Plomero / Gasista Matriculado</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Selector de Estrellas */}
              <div className="text-center">
                <label className="block text-xs font-semibold text-gray-300 mb-2">
                  ¿Cómo fue tu experiencia general?
                </label>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`text-3xl transition-transform transform active:scale-125 ${
                        star <= rating ? 'opacity-100 scale-110' : 'opacity-30 grayscale'
                      }`}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>

              {/* Chips de Reconocimiento Rápido */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-2">
                  Destacados del Trabajo (Opcional):
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => {
                    const isSelected = tags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`py-1.5 px-3 rounded-full text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-emerald-600 text-white border border-emerald-400'
                            : 'bg-gray-800 text-gray-400 border border-gray-700 hover:text-gray-200'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Comentario Adicional */}
              <div>
                <textarea
                  rows={2}
                  placeholder="Agregar algún detalle o comentario opcional..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Botón de Confirmación */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 px-6 rounded-xl font-extrabold bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-base shadow-xl shadow-emerald-500/25 transition-all transform active:scale-95"
              >
                {submitting ? 'Procesando...' : '⭐ CONFIRMAR MI CALIFICACIÓN'}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Legal Shield Disclaimer Footer */}
      <div className="max-w-md w-full text-center mt-6 pt-4 border-t border-gray-800/60">
        <p className="text-[10px] text-gray-500 leading-tight">
          ⚖️ <strong>Aviso Legal y Deslinde de Responsabilidad:</strong> Nexativa News e IA Nora actúan únicamente como soporte tecnológico y nexo comunitario gratuito de intermediación entre vecinos y prestadores independientes. Nexativa News no asume responsabilidad civil, laboral ni comercial por la ejecución de los trabajos.
        </p>
      </div>
    </div>
  );
}
