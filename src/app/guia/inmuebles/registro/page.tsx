"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import PropertyMultiGalleryUploader, { GalleryPhoto } from "@/components/Inmuebles/PropertyMultiGalleryUploader";
import {
  ShieldAlert,
  ShieldCheck,
  Calendar,
  Home,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Info,
  UserCheck,
  DollarSign,
  Sparkles,
  Lock,
  MapPin,
  Navigation,
  Compass,
  Check,
  Loader2,
} from "lucide-react";

export default function RegistroInmueblePage() {
  // Datos del Propietario / Responsable
  const [ownerName, setOwnerName] = useState("");
  const [ownerDni, setOwnerDni] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");

  // Datos del Inmueble
  const [title, setTitle] = useState("");
  const [propertyType, setPropertyType] = useState("CABAÑA");
  const [capacityGuests, setCapacityGuests] = useState(2);
  const [pricePerNight, setPricePerNight] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [galleryPhotos, setGalleryPhotos] = useState<GalleryPhoto[]>([]);

  // Geolocalización GPS Exacta
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [mapsUrl, setMapsUrl] = useState<string>("");
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoMsg, setGeoMsg] = useState<string>("");

  // Calendario de Disponibilidad Anti-Estafas
  const todayStr = new Date().toISOString().split("T")[0];
  const defaultToDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  
  const [availableFrom, setAvailableFrom] = useState(todayStr);
  const [availableTo, setAvailableTo] = useState(defaultToDate);

  // Cláusula Jurídica
  const [antiFraudAgreed, setAntiFraudAgreed] = useState(false);

  // Estados de interfaz
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [registeredProperty, setRegisteredProperty] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Cálculo en tiempo real de días declarados y validación
  const dateValidation = useMemo(() => {
    if (!availableFrom || !availableTo) {
      return { valid: false, error: "Seleccioná ambas fechas en el calendario.", days: 0 };
    }
    const from = new Date(availableFrom);
    const to = new Date(availableTo);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (from < now) {
      return { valid: false, error: "La fecha inicial no puede ser una fecha pasada.", days: 0 };
    }
    if (to < from) {
      return { valid: false, error: "La fecha final debe ser igual o posterior a la fecha inicial.", days: 0 };
    }

    const diffTime = Math.abs(to.getTime() - from.getTime());
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return { valid: true, error: "", days };
  }, [availableFrom, availableTo]);

  // Detección automática por GPS del dispositivo
  const handleGetCoordinates = () => {
    if (!navigator.geolocation) {
      alert("Tu navegador no soporta geolocalización GPS.");
      return;
    }

    setGeoLoading(true);
    setGeoMsg("Obteniendo coordenadas satelitales...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);
        const googleUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        setMapsUrl(googleUrl);
        setGeoLoading(false);
        setGeoMsg(`📍 Coordenadas GPS fijadas con éxito: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      },
      (error) => {
        console.warn("Error obteniendo GPS:", error.message);
        setGeoLoading(false);
        setGeoMsg("No se pudo obtener la ubicación automáticamente. Podés pegar el enlace de Google Maps.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!dateValidation.valid) {
      alert(dateValidation.error);
      return;
    }

    if (!antiFraudAgreed) {
      alert("Debes aceptar explícitamente la Cláusula Jurídica y Términos de Penalización Anti-Estafas para continuar.");
      return;
    }

    if (galleryPhotos.length < 5) {
      if (!confirm(`Has subido ${galleryPhotos.length} fotos. Se recomienda un mínimo de 5 fotos para que el cliente pueda explorar todos los ambientes. ¿Deseas continuar de todos modos?`)) {
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/inmuebles/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          property_type: propertyType,
          address,
          capacity_guests: capacityGuests,
          price_per_night: pricePerNight,
          description,
          owner_name: ownerName,
          owner_dni: ownerDni,
          owner_phone: ownerPhone,
          owner_email: ownerEmail,
          available_from: availableFrom,
          available_to: availableTo,
          anti_fraud_accepted: antiFraudAgreed,
          image_url: galleryPhotos.length > 0 ? galleryPhotos[0].url : imageUrl,
          gallery_images: galleryPhotos,
          latitude,
          longitude,
          maps_url: mapsUrl || (latitude && longitude ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}` : null),
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setErrorMessage(data.error || "No se pudo registrar el inmueble.");
      } else {
        setSuccess(true);
        setRegisteredProperty(data.property);
      }
    } catch (err: any) {
      setErrorMessage("Error de conexión al servidor. Intentá nuevamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-rose-500 selection:text-white py-10 px-4 sm:px-6 flex flex-col justify-center items-center">
      <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8">
        
        {/* Encabezado Principal */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-extrabold">
            <ShieldCheck className="w-4 h-4 text-rose-400" />
            <span>SISTEMA ANTI-ESTAFAS & ALQUILERES VERIFICADOS</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Alta de Inmueble & Calendario de Disponibilidad
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed max-w-lg mx-auto">
            Registrá tu alquiler garantizando fechas transparentes. El estricto control de fechas protege a inquilinos y propietarios ante errores o sobre-reservas.
          </p>
        </div>

        {/* Estado de Éxito al Registrar */}
        {success && registeredProperty ? (
          <div className="bg-emerald-950/80 border border-emerald-500/50 rounded-2xl p-6 sm:p-8 text-center text-emerald-200 space-y-5 animate-in fade-in duration-300">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">¡Inmueble Registrado y Blindado!</h2>
              <p className="text-sm text-emerald-300">
                Tu propiedad <strong>{registeredProperty.title}</strong> ha sido verificada y activada con disponibilidad del{" "}
                <span className="font-bold underline">{registeredProperty.available_from}</span> al{" "}
                <span className="font-bold underline">{registeredProperty.available_to}</span>.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/30 text-left text-xs font-mono space-y-1.5 text-slate-300">
              <p>🔑 <strong className="text-emerald-400">ID Ficha:</strong> {registeredProperty.id}</p>
              <p>👤 <strong className="text-emerald-400">Titular Verificado:</strong> {registeredProperty.owner_name} (DNI: {registeredProperty.owner_dni})</p>
              <p>🛡️ <strong className="text-emerald-400">Estado de Protección:</strong> ACTIVO • BLINDAJE JURÍDICO ACEPTADO</p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/guia/inmuebles"
                className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-6 py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20"
              >
                <span>🌐 Ver Portal de Alquileres Verificados</span>
                <ExternalLink className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={() => {
                  setSuccess(false);
                  setRegisteredProperty(null);
                }}
                className="px-5 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors"
              >
                ➕ Registrar Otro Inmueble
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {errorMessage && (
              <div className="p-4 bg-rose-950/80 border border-rose-500/50 rounded-xl text-rose-200 text-xs font-bold flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* SECCIÓN 1: IDENTIFICACIÓN DEL PROPIETARIO */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-rose-400 font-extrabold text-sm border-b border-slate-800 pb-2">
                <UserCheck className="w-4 h-4" />
                <span>1. Identidad Verificada del Propietario / Responsable (Anti-Estafas)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Nombre y Apellido Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Roberto Carlos Gómez"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-sm focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    DNI o CUIT del Titular *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 28455912 o 20-28455912-8"
                    value={ownerDni}
                    onChange={(e) => setOwnerDni(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-rose-300 font-mono font-bold text-sm focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    WhatsApp de Contacto Directo *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Ej: 3786401122"
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-emerald-400 font-mono font-bold text-sm focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Email de Confirmación (Opcional)
                  </label>
                  <input
                    type="email"
                    placeholder="propietario@ejemplo.com"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: DATOS DEL INMUEBLE */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-cyan-400 font-extrabold text-sm border-b border-slate-800 pb-2">
                <Home className="w-4 h-4" />
                <span>2. Detalles de la Propiedad en Alquiler</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Título del Anuncio *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Cabaña Familiar frente al Río con bajada de lanchas"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Tipo de Inmueble *
                  </label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-cyan-300 font-bold text-sm focus:outline-none focus:border-cyan-500"
                  >
                    <option value="CABAÑA">Cabaña</option>
                    <option value="DEPARTAMENTO">Departamento</option>
                    <option value="CASA">Casa Familiar</option>
                    <option value="QUINTA">Quinta / Casa de Campo</option>
                    <option value="LOCAL">Local / Eventos</option>
                    <option value="OTRO">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Capacidad (Huéspedes) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={capacityGuests}
                    onChange={(e) => setCapacityGuests(parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Precio por Noche (ARS) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="Ej: 45000"
                    value={pricePerNight}
                    onChange={(e) => setPricePerNight(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-amber-400 font-mono font-bold text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Dirección / Barrio (Ituzaingó, Corrientes) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Barrio San Jorge, Calle 5 s/n, Ituzaingó"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Descripción Corta & Servicios
                </label>
                <textarea
                  rows={2}
                  placeholder="Describí las comodidades (WiFi, parrilla, piscina, aire acondicionado, garage)..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Geolocalización GPS Exacta */}
              <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <label className="text-xs font-extrabold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-cyan-400" />
                      Geolocalización GPS Exacta del Inmueble (Para el Turista)
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Permite que el inquilino abra el botón "Cómo Llegar" en Google Maps o Waze y llegue directo a la puerta.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleGetCoordinates}
                    disabled={geoLoading}
                    className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-md cursor-pointer shrink-0"
                  >
                    {geoLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
                    <span>{latitude ? "Actualizar mi GPS 📍" : "📍 Obtener mi GPS Actual"}</span>
                  </button>
                </div>

                {geoMsg && (
                  <div className="text-xs text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-mono">
                    <Compass className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>{geoMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Coordenadas GPS (Latitud, Longitud)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="any"
                        placeholder="Latitud (ej: -27.481)"
                        value={latitude ?? ""}
                        onChange={(e) => setLatitude(parseFloat(e.target.value) || null)}
                        className="w-1/2 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-cyan-400"
                      />
                      <input
                        type="number"
                        step="any"
                        placeholder="Longitud (ej: -56.685)"
                        value={longitude ?? ""}
                        onChange={(e) => setLongitude(parseFloat(e.target.value) || null)}
                        className="w-1/2 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Enlace de Google Maps / Compartir Ubicación
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="https://maps.app.goo.gl/... o https://google.com/maps?q=..."
                        value={mapsUrl}
                        onChange={(e) => setMapsUrl(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-cyan-400"
                      />
                      {mapsUrl && (
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-slate-800 hover:bg-slate-700 text-cyan-300 p-2 rounded-lg text-xs font-bold shrink-0 flex items-center justify-center"
                          title="Probar en Google Maps"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Galería Múltiple de Fotos (5 a 10 fotos con pie descriptivo) */}
              <PropertyMultiGalleryUploader
                photos={galleryPhotos}
                onChange={(updated) => {
                  setGalleryPhotos(updated);
                  if (updated.length > 0) setImageUrl(updated[0].url);
                }}
                minPhotos={5}
                maxPhotos={10}
              />
            </div>

            {/* SECCIÓN 3: CALENDARIO DE DISPONIBILIDAD OBLIGATORIO */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-amber-500/40 space-y-4 shadow-lg shadow-amber-500/5">
              <div className="flex items-center gap-2 text-amber-400 font-extrabold text-sm border-b border-slate-800 pb-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                <span>3. Calendario Obligatorio de Disponibilidad Reales (Motor Anti-Estafas)</span>
              </div>
              <p className="text-xs text-slate-400">
                Especificá con precisión el período en el cual el inmueble está libre y garantizado para alquilar. El sistema bloqueará reservas fuera de este rango.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-amber-300 uppercase tracking-wider mb-1">
                    📅 Disponible Desde *
                  </label>
                  <input
                    type="date"
                    required
                    min={todayStr}
                    value={availableFrom}
                    onChange={(e) => setAvailableFrom(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-amber-500/50 text-white font-mono font-bold text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-amber-300 uppercase tracking-wider mb-1">
                    📅 Disponible Hasta *
                  </label>
                  <input
                    type="date"
                    required
                    min={availableFrom || todayStr}
                    value={availableTo}
                    onChange={(e) => setAvailableTo(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-amber-500/50 text-white font-mono font-bold text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Banner de Validación del Calendario */}
              {dateValidation.valid ? (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>
                    🗓️ <strong>Período Declarado:</strong> {dateValidation.days} días consecutivos de alquiler garantizado ({availableFrom} al {availableTo}).
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-rose-950 border border-rose-500/50 rounded-xl text-rose-300 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{dateValidation.error}</span>
                </div>
              )}
            </div>

            {/* SECCIÓN 4: BLINDAJE JURÍDICO & TÉRMINOS ANTI-ESTAFAS POR NEGLIGENCIA */}
            <div className="bg-rose-950/60 border border-rose-500/60 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2.5 text-rose-300 font-extrabold text-sm border-b border-rose-500/30 pb-2">
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                <span>DECLARACIÓN JURADA & CLÁUSULA DE SANCIÓN POR NEGLIGENCIA</span>
              </div>

              <div className="space-y-2 text-xs text-rose-100 leading-relaxed font-sans">
                <p>
                  Para proteger la reputación de la comunidad y evitar fraudes o falsos alquileres, al publicar este inmueble asumís la <strong>responsabilidad civil y legal total</strong> por la exactitud del calendario.
                </p>
                <div className="p-3 bg-slate-950/80 rounded-xl border border-rose-500/40 text-slate-300 space-y-1.5 font-mono text-[11px]">
                  <p className="text-rose-400 font-bold">⚠️ RÉGIMEN DE SANCIONES Y DISCIPLINA POR INCONSISTENCIA:</p>
                  <p>1. <strong>Negligencia o Sobre-Reserva:</strong> Si un inquilino reserva en las fechas declaradas como disponibles y la propiedad no está habitable o fue alquilada por fuera, el propietario incurrirá en falta grave.</p>
                  <p>2. <strong>Multa Económica:</strong> Cobertura obligatoria de gastos de relocalización o multa administrativa equivalente.</p>
                  <p>3. <strong>Eliminación y Baneo Permanente:</strong> Inhabilitación inmediata del propietario y baneo (`BAN_PERMANENT`) en Nexativa News.</p>
                </div>
              </div>

              {/* Checkbox Obligatorio */}
              <label className="flex items-start gap-3 p-3.5 bg-slate-950 border border-rose-500/50 rounded-xl cursor-pointer hover:border-rose-400 transition-colors">
                <input
                  type="checkbox"
                  required
                  checked={antiFraudAgreed}
                  onChange={(e) => setAntiFraudAgreed(e.target.checked)}
                  className="w-5 h-5 mt-0.5 rounded border-slate-700 text-rose-500 focus:ring-rose-500 accent-rose-500 shrink-0"
                />
                <span className="text-xs text-white font-bold leading-snug">
                  Declaro bajo juramento que el calendario de fechas es 100% verídico. Acepto libremente la cláusula de multas económicas y la eliminación permanente de la plataforma por negligencia o inconsistencia de fechas.
                </span>
              </label>
            </div>

            {/* BOTÓN DE ENVÍO */}
            <button
              type="submit"
              disabled={submitting || !dateValidation.valid || !antiFraudAgreed}
              className="w-full py-4 rounded-xl font-black bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 text-base shadow-xl shadow-rose-500/25 transition-all transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Lock className="w-5 h-5 text-slate-950" />
              <span>{submitting ? "Verificando y Publicando..." : "🛡️ REGISTRAR Y PUBLICAR INMUEBLE BLINDADO"}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
