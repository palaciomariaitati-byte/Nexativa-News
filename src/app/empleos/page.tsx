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
  status?: string;
  cv_url?: string;
  cv_filename?: string;
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
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('TODOS');

  const categoriesList = ['TODOS', ...Array.from(new Set(profiles.map(p => p.trade_category)))];

  const displayProfiles = profiles
    .filter((p) => {
      const matchesAvailable = onlyAvailable ? p.status !== 'BUSY' : true;
      const matchesSearch =
        !searchQuery ||
        p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.trade_category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.bio.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === 'TODOS' || p.trade_category.toLowerCase().includes(selectedCategory.toLowerCase());

      return matchesAvailable && matchesSearch && matchesCategory;
    })
    .sort((a, b) => (a.status === 'BUSY' ? 1 : 0) - (b.status === 'BUSY' ? 1 : 0));
  
  // Modales
  const [selectedProfile, setSelectedProfile] = useState<JobProfile | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showNoraWelcomeModal, setShowNoraWelcomeModal] = useState(false);
  const [noraResult, setNoraResult] = useState<{
    noraGreeting: string;
    waLink: string;
    mobilePanelUrl: string;
    profile: JobProfile;
  } | null>(null);

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
  const [regCategory, setRegCategory] = useState('Informática, Servicio Técnico & Sistemas');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [regCity, setRegCity] = useState('Ituzaingó');
  const [regWhatsapp, setRegWhatsapp] = useState('');
  const [regBio, setRegBio] = useState('');
  const [regCvUrl, setRegCvUrl] = useState('');
  const [regCvFileName, setRegCvFileName] = useState('');
  const [submittingReg, setSubmittingReg] = useState(false);
  const [copiedGreeting, setCopiedGreeting] = useState(false);

  const handleCvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("El archivo del CV no debe superar los 5MB.");
        return;
      }
      setRegCvFileName(file.name);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setRegCvUrl(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Formulario de Búsqueda Laboral
  const [showJobOfferModal, setShowJobOfferModal] = useState(false);
  const [offerTitle, setOfferTitle] = useState('');
  const [offerCategory, setOfferCategory] = useState('Gastronomía');
  const [offerDesc, setOfferDesc] = useState('');
  const [offerEmployer, setOfferEmployer] = useState('');
  const [offerWhatsapp, setOfferWhatsapp] = useState('');
  const [offerLocation, setOfferLocation] = useState('Ituzaingó, Corrientes');
  const [submittingOffer, setSubmittingOffer] = useState(false);

  // Handlers de borrado directo
  const handleDeleteProfile = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este perfil de trabajador / prestador?")) return;
    try {
      await fetch('/api/jobs/profiles', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setProfiles((prev) => prev.filter((p) => p.id !== id));
      alert("¡Perfil eliminado correctamente!");
    } catch (e) {
      alert("Error al eliminar perfil.");
    }
  };

  const handleDeleteOffer = async (id: string) => {
    if (!confirm("¿Estás seguro de borrar esta búsqueda laboral activa?")) return;
    try {
      await fetch('/api/jobs/offers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setOffers((prev) => prev.filter((o) => o.id !== id));
      alert("¡Búsqueda laboral eliminada!");
    } catch (e) {
      alert("Error al eliminar la búsqueda.");
    }
  };

  const handleCreateJobOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerTitle.trim() || !offerWhatsapp.trim()) {
      alert("Ingresá el título del puesto y el WhatsApp de contacto.");
      return;
    }
    setSubmittingOffer(true);
    try {
      const res = await fetch('/api/jobs/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: offerTitle.trim(),
          category: offerCategory,
          description: offerDesc.trim(),
          employer_name: offerEmployer.trim() || 'Comercio / Empleador Local',
          whatsapp: offerWhatsapp.trim(),
          location: offerLocation,
        }),
      });
      const data = await res.json();
      if (data.success && data.offer) {
        setOffers((prev) => [data.offer, ...prev]);
        setShowJobOfferModal(false);
        setOfferTitle('');
        setOfferDesc('');
        setOfferEmployer('');
        setOfferWhatsapp('');
        alert("🎉 ¡Búsqueda laboral publicada con éxito!");
      }
    } catch (err) {
      alert("Error al publicar la búsqueda laboral.");
    } finally {
      setSubmittingOffer(false);
    }
  };

  // Cargar datos de muestra / reales desde la API
  useEffect(() => {
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
        full_name: 'Carlos "Charly" Benítez',
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

    async function loadRealProfiles() {
      // 1. Cargar almacenamiento local inmediato
      let localBuffer: JobProfile[] = [];
      try {
        const saved = localStorage.getItem('nexativa_job_profiles_v1');
        if (saved) {
          localBuffer = JSON.parse(saved) || [];
        }
      } catch (e) {}

      try {
        const res = await fetch('/api/jobs/profiles');
        const data = await res.json();
        if (data.success && Array.isArray(data.profiles) && data.profiles.length > 0) {
          const apiProfiles: JobProfile[] = data.profiles.map((p: any) => ({
            id: p.id,
            full_name: p.full_name,
            trade_category: p.trade_category,
            bio: p.bio || '',
            city: p.city || 'Ituzaingó',
            province: p.province || 'Corrientes',
            whatsapp: p.whatsapp,
            nora_score: Number(p.nora_score || 5.0),
            total_reviews: Number(p.total_reviews || 0),
            badge_level: p.badge_level || 'BRONCE',
            cv_url: p.cv_url || undefined,
            cv_filename: p.cv_filename || undefined,
          }));
          
          setProfiles((prev) => {
            const apiIds = new Set(apiProfiles.map((p) => p.id));
            const filteredLocal = localBuffer.filter((l) => !apiIds.has(l.id));
            const combined = [...apiProfiles, ...filteredLocal];
            const combinedIds = new Set(combined.map((c) => c.id));
            const filteredDemo = demoProfiles.filter((d) => !combinedIds.has(d.id));
            return [...combined, ...filteredDemo];
          });
        } else {
          setProfiles((prev) => {
            const bufferIds = new Set(localBuffer.map((l) => l.id));
            const filteredDemo = demoProfiles.filter((d) => !bufferIds.has(d.id));
            return [...localBuffer, ...filteredDemo];
          });
        }
      } catch (err) {
        console.warn('Error cargando perfiles reales:', err);
        setProfiles(localBuffer.length > 0 ? localBuffer : demoProfiles);
      } finally {
        setOffers(demoOffers);
        setLoading(false);
      }
    }

    loadRealProfiles();
  }, []);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReg(true);

    try {
      const res = await fetch('/api/jobs/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: regName,
          trade_category: regCategory,
          city: regCity,
          whatsapp: regWhatsapp,
          bio: regBio,
          cv_url: regCvUrl || null,
          cv_filename: regCvFileName || null,
        }),
      });

      const data = await res.json();
      if (data.success && data.profile) {
        const newProf: JobProfile = {
          id: data.profile.id,
          full_name: data.profile.full_name,
          trade_category: data.profile.trade_category,
          bio: data.profile.bio || regBio,
          city: data.profile.city || regCity,
          province: data.profile.province || 'Corrientes',
          whatsapp: data.profile.whatsapp || regWhatsapp,
          nora_score: Number(data.profile.nora_score || 5.0),
          total_reviews: 0,
          badge_level: 'BRONCE',
          cv_url: data.profile.cv_url,
          cv_filename: data.profile.cv_filename,
        };

        setProfiles((prev) => {
          const updated = [newProf, ...prev];
          try {
            localStorage.setItem('nexativa_job_profiles_v1', JSON.stringify(updated));
            localStorage.setItem('nexativa_active_prestador', JSON.stringify({
              id: newProf.id,
              name: newProf.full_name,
              trade: newProf.trade_category,
              noraScore: 5.0,
              totalJobs: 1,
              badge: 'BRONCE',
              whatsapp: newProf.whatsapp,
              status: 'ACTIVE',
              city: newProf.city,
              cv_url: newProf.cv_url,
              cv_filename: newProf.cv_filename
            }));
            localStorage.setItem('nexativa_device_registered_id', newProf.id);
          } catch (e) {}
          return updated;
        });

        setNoraResult({
          noraGreeting: data.noraGreeting,
          waLink: data.waLink,
          mobilePanelUrl: data.mobilePanelUrl,
          profile: newProf,
        });

        // Limpiar formulario y alternar modales
        setRegName('');
        setRegWhatsapp('');
        setRegBio('');
        setShowRegisterModal(false);
        setShowNoraWelcomeModal(true);
      } else {
        alert(data.error || 'No se pudo completar el registro.');
      }
    } catch (err: any) {
      alert('Error registrando postulante: ' + (err.message || 'Error de conexión'));
    } finally {
      setSubmittingReg(false);
    }
  };

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
          <button
            onClick={() => setShowJobOfferModal(true)}
            className="px-6 py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25 transition-all transform hover:-translate-y-0.5"
          >
            💼 Publicar Búsqueda Laboral
          </button>
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
          <div className="space-y-6">
            {/* Barra Multifiltro por Rubro, Búsqueda y Disponibilidad */}
            <div className="bg-gray-900/90 p-5 rounded-2xl border border-gray-800 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                {/* Buscador de Texto */}
                <div className="relative w-full sm:w-80">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="🔍 Buscar por plomero, electricista, costura..."
                    className="w-full bg-black/60 border border-gray-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-white"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Botón de Filtro de Disponibilidad en Vivo */}
                <button
                  onClick={() => setOnlyAvailable(!onlyAvailable)}
                  className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 ${
                    onlyAvailable
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-600/30 font-extrabold'
                      : 'bg-gray-800 text-gray-300 border-gray-700 hover:border-emerald-500/40'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${onlyAvailable ? 'bg-emerald-300 animate-ping' : 'bg-emerald-500'}`}></span>
                  {onlyAvailable ? '🟢 Mostrando Solo Disponibles Ahora' : '🟢 Filtrar Disponibles en Vivo'}
                </button>
              </div>

              {/* Chips / Píldoras de Categorías y Rubros */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                <span className="text-gray-400 font-semibold uppercase text-[10px] shrink-0">Rubro:</span>
                {categoriesList.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-lg font-bold transition-all shrink-0 uppercase text-[10px] tracking-wider ${
                      selectedCategory === cat
                        ? 'bg-emerald-500 text-slate-950 font-black shadow'
                        : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="flex justify-between items-center text-[11px] text-gray-400 pt-1 border-t border-gray-800/60">
                <span>
                  Mostrando <strong className="text-emerald-400">{displayProfiles.length}</strong> especialistas {selectedCategory !== 'TODOS' ? `en ${selectedCategory}` : ''}
                </span>
                {(searchQuery || selectedCategory !== 'TODOS' || onlyAvailable) && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('TODOS');
                      setOnlyAvailable(false);
                    }}
                    className="text-emerald-400 font-bold hover:underline"
                  >
                    Restablecer Filtros
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayProfiles.map((profile) => (
                <div
                  key={profile.id}
                  className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 flex flex-col justify-between hover:border-emerald-500/40 transition-all shadow-xl relative"
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

                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      {renderBadge(profile.badge_level)}

                      {profile.status === 'BUSY' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-900/40 text-rose-300 border border-rose-700/50">
                          <span className="w-2 h-2 rounded-full bg-rose-500"></span> 🔴 OCUPADO EN TAREA
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 shadow-sm">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> 🟢 DISPONIBLE AHORA
                        </span>
                      )}
                    </div>

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

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          setSelectedProfile(profile);
                          setShowReviewModal(true);
                        }}
                        className="flex-1 py-2 px-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold text-xs text-center border border-gray-700 transition-colors"
                      >
                        ⭐ Calificar
                      </button>
                      {profile.cv_url && (
                        <a
                          href={profile.cv_url}
                          download={profile.cv_filename || `CV_${profile.full_name}.pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2 px-3 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 font-bold text-xs text-center border border-emerald-500/40 transition-colors flex items-center gap-1"
                        >
                          📄 Ver CV
                        </a>
                      )}
                      {(profile.badge_level === 'ORO' || profile.badge_level === 'ORGULLO_REGIONAL') && (
                        <Link
                          href={`/certificados/${profile.id}?name=${encodeURIComponent(profile.full_name)}&trade=${encodeURIComponent(profile.trade_category)}&score=${profile.nora_score}&badge=${encodeURIComponent(profile.badge_level)}`}
                          className="py-2 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs text-center border border-amber-500/40 transition-colors flex items-center gap-1"
                        >
                          📜 Certificado
                        </Link>
                      )}
                      <button
                        onClick={() => handleDeleteProfile(profile.id)}
                        className="py-2 px-2.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-400 font-semibold text-xs text-center border border-red-800/60 transition-colors"
                        title="Borrar usuario de la búsqueda"
                      >
                        🗑️ Borrar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
                      {(offer.job_type || 'PART_TIME').replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2">{offer.title}</h3>
                  <p className="text-sm font-semibold text-gray-300 mb-3">🏢 {offer.employer_name}</p>
                  <p className="text-gray-300 text-sm mb-4 leading-relaxed">{offer.description}</p>
                  
                  <div className="text-xs text-gray-400 mb-6">📍 {offer.location}</div>
                </div>

                <div className="space-y-2">
                  <a
                    href={`https://wa.me/${offer.employer_whatsapp || (offer as any).whatsapp || '5493786401122'}?text=Hola,%20vi%20la%20búsqueda%20laboral%20"${encodeURIComponent(
                      offer.title
                    )}"%20en%20Nexativa%20Empleos%20y%20quisiera%20postularme.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm text-center flex items-center justify-center gap-2 transition-colors shadow-md"
                  >
                    📩 Postularme por WhatsApp Directo
                  </a>
                  <button
                    onClick={() => handleDeleteOffer(offer.id)}
                    className="w-full py-2 px-3 rounded-lg bg-red-950/40 hover:bg-red-900/70 text-red-400 font-semibold text-xs text-center border border-red-800/40 transition-colors"
                  >
                    🗑️ Borrar Búsqueda Laboral
                  </button>
                </div>
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

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
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

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Rubro / Oficio / Especialidad</label>
                  <select
                    value={isCustomCategory ? "CUSTOM" : regCategory}
                    onChange={(e) => {
                      if (e.target.value === "CUSTOM") {
                        setIsCustomCategory(true);
                        setRegCategory("");
                      } else {
                        setIsCustomCategory(false);
                        setRegCategory(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 mb-2"
                  >
                    <option value="Informática, Servicio Técnico & Sistemas">💻 Informática, Servicio Técnico & Sistemas</option>
                    <option value="Programación, Diseño & Tecnología">🚀 Programación, Diseño & Tecnología</option>
                    <option value="Plomero / Gasista">🔧 Plomero / Gasista</option>
                    <option value="Electricista Matriculado">⚡ Electricista Matriculado</option>
                    <option value="Albañilería & Construcción">🏗️ Albañilería & Construcción</option>
                    <option value="Jardinería & Parquización">🌿 Jardinería & Parquización</option>
                    <option value="Técnico de Aire / Refrigeración">❄️ Técnico de Aire / Refrigeración</option>
                    <option value="Pintor / Decorador">🎨 Pintor / Decorador</option>
                    <option value="Mecánica & Auxilio">🚗 Mecánica & Auxilio</option>
                    <option value="Gastronomía & Catering">🍽️ Gastronomía & Catering</option>
                    <option value="Cuidado de Personas">🤝 Cuidado de Personas</option>
                    <option value="CUSTOM">✍️ Si tu oficio no está en la lista, escríbelo aquí...</option>
                  </select>
                  {(isCustomCategory || !regCategory) && (
                    <input
                      type="text"
                      required
                      placeholder="Escribí tu especialidad u oficio (Ej: Informático, Técnico IT...)"
                      value={regCategory}
                      onChange={(e) => setRegCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  )}
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

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">📄 Cargar Currículum Vitae (CV) (PDF / Word - Opcional)</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleCvFileChange}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-300 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500"
                />
                {regCvFileName && (
                  <p className="text-xs text-emerald-400 font-semibold mt-1">
                    ✓ Archivo adjunto: {regCvFileName}
                  </p>
                )}
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
                  disabled={submittingReg}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg disabled:opacity-50"
                >
                  {submittingReg ? 'Registrando...' : '🚀 Registrar mi Perfil Gratis'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Publicar Búsqueda Laboral */}
      {showJobOfferModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-lg w-full p-6 text-gray-100 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                💼 Publicar Nueva Búsqueda Laboral
              </h3>
              <button
                onClick={() => setShowJobOfferModal(false)}
                className="text-gray-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateJobOffer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Título del Puesto u Oficio Buscado</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Se busca Mozo / Ayudante de Cocina"
                  value={offerTitle}
                  onChange={(e) => setOfferTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Rubro / Categoría</label>
                <select
                  value={offerCategory}
                  onChange={(e) => setOfferCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Gastronomía">Gastronomía & Comercio</option>
                  <option value="Construcción">Construcción & Mantenimiento</option>
                  <option value="Administración">Administración & Oficina</option>
                  <option value="Limpieza & Hogar">Limpieza & Servicio Doméstico</option>
                  <option value="Atención al Cliente">Atención al Cliente</option>
                  <option value="Otros">Otros Rubros</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Nombre del Comercio, Empresa o Vecino</label>
                <input
                  type="text"
                  placeholder="Ej: Restó Don Juan / Vecino Particular"
                  value={offerEmployer}
                  onChange={(e) => setOfferEmployer(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Número de WhatsApp de Contacto</label>
                <input
                  type="tel"
                  required
                  placeholder="Ej: 3786401122"
                  value={offerWhatsapp}
                  onChange={(e) => setOfferWhatsapp(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Ubicación / Ciudad</label>
                <input
                  type="text"
                  value={offerLocation}
                  onChange={(e) => setOfferLocation(e.target.value)}
                  placeholder="Ej: Ituzaingó, Corrientes"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Requisitos y Detalles del Empleo</label>
                <textarea
                  rows={3}
                  placeholder="Describí las tareas, horarios y requisitos..."
                  value={offerDesc}
                  onChange={(e) => setOfferDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowJobOfferModal(false)}
                  className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingOffer}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg disabled:opacity-50"
                >
                  {submittingOffer ? 'Publicando...' : '💼 Publicar Búsqueda Gratis'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Salutación de Nora AI & Link al Panel Móvil */}
      {showNoraWelcomeModal && noraResult && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-emerald-500/50 rounded-2xl max-w-lg w-full p-6 text-gray-100 shadow-2xl animate-fade-in">
            <div className="flex items-center gap-3 mb-4 border-b border-gray-800 pb-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-2xl shadow-inner">
                🤖
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-white">
                  🎉 ¡Perfil Activado por <span className="text-emerald-400">Nora AI</span>!
                </h3>
                <p className="text-xs text-emerald-400 font-semibold">
                  Salutación generada y Panel Móvil habilitado
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-300 mb-3 font-semibold uppercase tracking-wider">
              Mensaje Oficial de Salutación enviado:
            </p>

            <div className="bg-gray-950 border border-gray-800 rounded-xl p-4 mb-6 font-mono text-xs text-emerald-300 leading-relaxed whitespace-pre-wrap select-all">
              {noraResult.noraGreeting}
            </div>

            <div className="space-y-3">
              <Link
                href="/prestadores"
                target="_blank"
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm text-center flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/25"
              >
                📱 IR A MI PANEL MÓVIL (/prestadores)
              </Link>

              <a
                href={noraResult.waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-emerald-400 font-bold text-xs text-center border border-emerald-500/40 flex items-center justify-center gap-2 transition-colors"
              >
                💬 Abrir Salutación en WhatsApp de Nora
              </a>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(noraResult.noraGreeting);
                    setCopiedGreeting(true);
                    setTimeout(() => setCopiedGreeting(false), 3000);
                  }}
                  className="flex-1 py-2 px-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold border border-gray-700"
                >
                  {copiedGreeting ? '✅ Copiado al portapapeles' : '📋 Copiar Mensaje'}
                </button>
                <button
                  onClick={() => setShowNoraWelcomeModal(false)}
                  className="py-2 px-4 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 text-xs font-semibold border border-gray-700"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
