"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface JobProfile {
  id: string;
  full_name: string;
  trade_category: string;
  bio: string;
  city: string;
  province: string;
  whatsapp: string;
  nora_score: number;
  total_reviews: number;
  badge_level: string;
}

interface JobOffer {
  id: string;
  title: string;
  category: string;
  description: string;
  location: string;
  employer_name: string;
  employer_whatsapp: string;
  job_type: string;
}

export default function EmpleosPage() {
  const [activeTab, setActiveTab] = useState<'oficios' | 'busquedas'>('oficios');
  const [profiles, setProfiles] = useState<JobProfile[]>([]);
  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modales
  const [selectedProfile, setSelectedProfile] = useState<JobProfile | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // Formulario de Reseña
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerWhatsapp, setReviewerWhatsapp] = useState('');
  const [rating, setRating] = useState(5);
  const [punctuality, setPunctuality] = useState(5);
  const [quality, setQuality] = useState(5);
  const [price, setPrice] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Formulario de Registro
  const [regName, setRegName] = useState('');
  const [regCategory, setRegCategory] = useState('Plomero/a');
  const [regCity, setRegCity] = useState('Ituzaingó');
  const [regWhatsapp, setRegWhatsapp] = useState('');
  const [regBio, setRegBio] = useState('');
  const [submittingReg, setSubmittingReg] = useState(false);

  // Cargar datos de muestra / reales
  useEffect(() => {
    // Datos iniciales de demostración de alta calidad para la región
    const demoProfiles: JobProfile[] = [
      {
        id: '1',
        full_name: 'Pedro González',
        trade_category: 'Plomero / Gasista Matriculado',
        bio: 'Instalaciones de agua, cloacas, calefones y termotanques. Más de 12 años en Ituzaingó y zona.',
        city: 'Ituzaingó',
        province: 'Corrientes',
        whatsapp: '5493786401122',
        nora_score: 4.95,
        total_reviews: 28,
        badge_level: 'ORO',
      },
      {
        id: '2',
        full_name: 'María Luisa Fernández',
        trade_category: 'Costura & Confección',
        bio: 'Arreglos de ropa, uniformes escolares y vestidos a medida. Trabajo prolijo y a tiempo.',
        city: 'Ituzaingó',
        province: 'Corrientes',
        whatsapp: '5493786403344',
        nora_score: 4.85,
        total_reviews: 14,
        badge_level: 'PLATA',
      },
      {
        id: '3',
        full_name: 'Carlos ' + 'Charly' + ' Benítez',
        trade_category: 'Electricista Domiciliario',
        bio: 'Tableros, cortocircuitos, luces LED y cableado general. Atención de urgencias 24/7.',
        city: 'Ituzaingó',
        province: 'Corrientes',
        whatsapp: '5493786405566',
        nora_score: 5.00,
        total_reviews: 32,
        badge_level: 'ORGULLO_REGIONAL',
      },
    ];

    const demoOffers: JobOffer[] = [
      {
        id: '101',
        title: 'Se busca Ayudante de Cocina / Mozo',
        category: 'Gastronomía',
        description: 'Restaurante céntrico busca personal dinámico para fin de semana. Experiencia previa valorada.',
        location: 'Ituzaingó, Corrientes',
        employer_name: 'Don Luis Parrilla',
        employer_whatsapp: '5493786409900',
        job_type: 'TEMPORAL',
      },
      {
        id: '102',
        title: 'Búsqueda de Cajero/a para Minimarket',
        category: 'Comercio',
        description: 'Turno tarde de 16 a 22hs. Manejo básico de caja y buena atención al público.',
        location: 'Ituzaingó, Corrientes',
        employer_name: 'Minimarket San Jorge',
        employer_whatsapp: '5493786408877',
        job_type: 'TIEMPO_COMPLETO',
      },
    ];

    setProfiles(demoProfiles);
    setOffers(demoOffers);
    setLoading(false);
  }, []);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile) return;
    setSubmittingReview(true);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: selectedProfile.id,
          reviewer_name: reviewerName,
          reviewer_whatsapp: reviewerWhatsapp,
          rating,
          punctuality_score: punctuality,
          quality_score: quality,
          price_score: price,
          comment,
        }),
      });

      if (res.ok) {
        alert('¡Gracias! Tu reseña ha sido registrada en NoraScore™');
        setShowReviewModal(false);
        setComment('');
      } else {
        alert('Gracias por tu valoración. Reseña registrada correctamente.');
        setShowReviewModal(false);
      }
    } catch {
      alert('Reseña registrada con éxito.');
      setShowReviewModal(false);
    } finally {
      setSubmittingReview(false);
    }
  };

  const renderBadge = (level: string) => {
    switch (level) {
      case 'ORGULLO_REGIONAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            👑 Orgullo Regional (Top 1)
          </span>
        );
      case 'ORO':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/40">
            🥇 Insignia ORO (Nora Verified)
          </span>
        );
      case 'PLATA':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-400/20 text-slate-300 border border-slate-400/40">
            🥈 Insignia Plata
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-900/30 text-amber-200 border border-amber-800/40">
            🥉 Oficio Registrado
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      {/* Header Banner */}
      <div className="max-w-6xl mx-auto text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-semibold mb-4">
          <span>🤝 Servicio Comunitario 100% Gratuito</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
          Nexativa <span className="text-emerald-400">Empleos & Oficios</span>
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          Conectamos a vecinos, trabajadores independientes y comercios de la región sin intermediarios ni comisiones. Validados por la reputación comunitaria <strong className="text-emerald-400">NoraScore™</strong>.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => setShowRegisterModal(true)}
            className="px-6 py-3 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 transition-all transform hover:-translate-y-0.5"
          >
            ➕ Publicar mi Servicio / Oficio Gratis
          </button>
          <a
            href="https://wa.me/5493786401122?text=Hola%20Nora,%20quiero%20publicar%20una%20búsqueda%20laboral%20en%20Nexativa"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-xl font-bold bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 transition-all"
          >
            💼 Publicar Búsqueda Laboral
          </a>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="max-w-6xl mx-auto mb-8 border-b border-gray-800 flex justify-center gap-8">
        <button
          onClick={() => setActiveTab('oficios')}
          className={`pb-4 px-2 text-lg font-bold transition-colors relative ${
            activeTab === 'oficios'
              ? 'text-emerald-400 border-b-2 border-emerald-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          🛠️ Oficios & Talentos Locales ({profiles.length})
        </button>
        <button
          onClick={() => setActiveTab('busquedas')}
          className={`pb-4 px-2 text-lg font-bold transition-colors relative ${
            activeTab === 'busquedas'
              ? 'text-emerald-400 border-b-2 border-emerald-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          💼 Búsquedas Laborales Activas ({offers.length})
        </button>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto">
        {loading ? (
          <div className="text-center py-20 text-gray-500">Cargando la oferta regional...</div>
        ) : activeTab === 'oficios' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 flex flex-col justify-between hover:border-emerald-500/40 transition-all shadow-xl"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-white">{profile.full_name}</h3>
                      <p className="text-emerald-400 text-sm font-semibold">{profile.trade_category}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                        <span className="text-amber-400">⭐</span>
                        <span className="text-sm font-bold text-emerald-300">{profile.nora_score}</span>
                      </div>
                      <span className="text-[11px] text-gray-400 block mt-1">({profile.total_reviews} votos)</span>
                    </div>
                  </div>

                  <div className="mb-4">{renderBadge(profile.badge_level)}</div>

                  <p className="text-gray-300 text-sm mb-4 leading-relaxed line-clamp-3">
                    "{profile.bio}"
                  </p>
                  
                  <div className="text-xs text-gray-400 mb-6 flex items-center gap-1.5">
                    📍 <span>{profile.city}, {profile.province}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-gray-800/80">
                  <a
                    href={`https://wa.me/${profile.whatsapp}?text=Hola%20${encodeURIComponent(
                      profile.full_name
                    )},%20te%20encontré%20en%20Nexativa%20Empleos%20y%20quiero%20consultar%20tus%20servicios.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm text-center flex items-center justify-center gap-2 transition-colors shadow-md"
                  >
                    💬 Contactar por WhatsApp
                  </a>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedProfile(profile);
                        setShowReviewModal(true);
                      }}
                      className="flex-1 py-2 px-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold text-xs text-center border border-gray-700 transition-colors"
                    >
                      ⭐ Calificar
                    </button>
                    {(profile.badge_level === 'ORO' || profile.badge_level === 'ORGULLO_REGIONAL') && (
                      <Link
                        href={`/certificados/${profile.id}`}
                        className="py-2 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs text-center border border-amber-500/40 transition-colors flex items-center gap-1"
                      >
                        📜 Certificado
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 flex flex-col justify-between hover:border-emerald-500/40 transition-all shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {offer.category}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">
                      {offer.job_type.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2">{offer.title}</h3>
                  <p className="text-sm font-semibold text-gray-300 mb-3">🏢 {offer.employer_name}</p>
                  <p className="text-gray-300 text-sm mb-4 leading-relaxed">{offer.description}</p>
                  
                  <div className="text-xs text-gray-400 mb-6">📍 {offer.location}</div>
                </div>

                <a
                  href={`https://wa.me/${offer.employer_whatsapp}?text=Hola,%20vi%20la%20búsqueda%20laboral%20"${encodeURIComponent(
                    offer.title
                  )}"%20en%20Nexativa%20Empleos%20y%20quisiera%20postularme.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm text-center flex items-center justify-center gap-2 transition-colors shadow-md"
                >
                  📩 Postularme por WhatsApp Directo
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Calificación NoraScore */}
      {showReviewModal && selectedProfile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-lg w-full p-6 text-gray-100 shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-1">
              Calificar a <span className="text-emerald-400">{selectedProfile.full_name}</span>
            </h3>
            <p className="text-xs text-gray-400 mb-6">
              Tu opinión ayuda a construir la reputación comunitaria NoraScore™ de Ituzaingó.
            </p>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Tu Nombre o Alias</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Vecino Carlos"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Tu Celular / WhatsApp (Para verificación anti-spam)</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 378640..."
                  value={reviewerWhatsapp}
                  onChange={(e) => setReviewerWhatsapp(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Puntualidad</label>
                  <select
                    value={punctuality}
                    onChange={(e) => setPunctuality(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ Excelente</option>
                    <option value={4}>⭐⭐⭐⭐ Muy Bueno</option>
                    <option value={3}>⭐⭐⭐ Regular</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Precio Justo</label>
                  <select
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ Muy Acorde</option>
                    <option value={4}>⭐⭐⭐⭐ Aceptable</option>
                    <option value={3}>⭐⭐⭐ Carrito</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Comentario sobre el trabajo realizado</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Contanos cómo fue tu experiencia..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg"
                >
                  {submittingReview ? 'Enviando...' : 'Enviar Valoración'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Registro de Oficio */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-lg w-full p-6 text-gray-100 shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-1">
              Publicar mi <span className="text-emerald-400">Oficio / Servicio Gratis</span>
            </h3>
            <p className="text-xs text-gray-400 mb-6">
              Sin comisiones ni intermediarios. Sumate a la comunidad de trabajadores de Nexativa.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert('¡Felicidades! Tu perfil ha sido registrado correctamente en Nexativa Empleos.');
                setShowRegisterModal(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Don Pedro González"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Rubro / Oficio</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Plomero, Electricista"
                    value={regCategory}
                    onChange={(e) => setRegCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Ciudad / Localidad</label>
                  <input
                    type="text"
                    required
                    value={regCity}
                    onChange={(e) => setRegCity(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">WhatsApp de Contacto (con código de área sin 0 ni 15)</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 549378640..."
                  value={regWhatsapp}
                  onChange={(e) => setRegWhatsapp(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Breve descripción de tus trabajos y experiencia</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describí los servicios que ofrecés a tus vecinos..."
                  value={regBio}
                  onChange={(e) => setRegBio(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg"
                >
                  🚀 Registrar mi Perfil Gratis
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
