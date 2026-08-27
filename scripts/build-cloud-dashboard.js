const fs = require('fs');

// 1. Create app/dashboard/page.tsx in D:/BARES 2026/Nexora_Store
const dashboardPageCode = `'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  QrCode, 
  Copy, 
  ExternalLink, 
  Download, 
  Check, 
  Share2, 
  Plus, 
  Sparkles, 
  ShieldCheck, 
  Store, 
  ArrowLeft,
  Search,
  MessageSquare,
  Smartphone
} from 'lucide-react';

interface SoftwareItem {
  id: string;
  nombre: string;
  subtitulo: string;
  descripcion: string;
  categoria: string;
  icono: string;
  version: string;
  precioUsd?: number;
  tipoEntrega?: 'web' | 'descarga';
  urlAcceso?: string;
  visible?: boolean;
}

const FULL_CATALOG: SoftwareItem[] = [
  {
    id: 'autentico_tributo',
    nombre: 'Auténtico Tributo (Portal & Sistema Oficial)',
    subtitulo: '🎯 Sistema Integral para Bandas, Conciertos & Shows en Vivo',
    descripcion: 'Plataforma oficial desarrollada para la banda Auténtico Tributo. Incluye portal interactivo para fans, pantalla gigante para shows en vivo y pedidos de canciones.',
    categoria: '🎵 Música & Eventos',
    icono: '🎸',
    version: '2.0.0',
    precioUsd: 0,
    tipoEntrega: 'web',
    urlAcceso: 'https://nexora-store-xi.vercel.app',
    visible: true
  },
  {
    id: 'restobar',
    nombre: 'Restobar 2026 (Suite Gastronómica)',
    subtitulo: 'Sistema de Gestión Gastronómica & Bares',
    descripcion: 'Plataforma integral para restaurantes, bares y pubs: Control de mesas, comandas digitales, stock de insumos y facturación rápida.',
    categoria: 'Gastronomía & Bares',
    icono: '🍹',
    version: '4.8.2 PRO',
    precioUsd: 65,
    tipoEntrega: 'descarga',
    urlAcceso: 'https://nexora-store-xi.vercel.app',
    visible: true
  },
  {
    id: 'nexora_clasificados',
    nombre: 'Nexora Clasificados Móvil',
    subtitulo: '🎯 Compra-Venta Directa de Autos, Motos y Segunda Mano',
    descripcion: 'App ciudadana gratuita para comprar y vender autos, motos, herramientas y artículos de segunda mano con hasta 10 fotos WebP y WhatsApp.',
    categoria: '🚗 Clasificados & Autos',
    icono: '🚗',
    version: '1.0 Oficial',
    precioUsd: 0,
    tipoEntrega: 'web',
    urlAcceso: 'https://www.nexativanews.com.ar/clasificados',
    visible: true
  },
  {
    id: 'inmuebles_verificados',
    nombre: 'Inmuebles Verificados',
    subtitulo: '🏠 Alquileres Temporarios y Venta de Propiedades',
    descripcion: 'Portal de alquileres temporarios, anuales y venta de propiedades verificadas en Ituzaingó y la región.',
    categoria: '🏠 Inmuebles & Vivienda',
    icono: '🏠',
    version: '2.4 Oficial',
    precioUsd: 0,
    tipoEntrega: 'web',
    urlAcceso: 'https://www.nexativanews.com.ar/guia/inmuebles',
    visible: true
  },
  {
    id: 'empleos_oficios',
    nombre: 'Empleos & Oficios Regionales',
    subtitulo: '💼 Bolsa de Trabajo y Catálogo de Oficios de Confianza',
    descripcion: 'Bolsa de trabajo regional y catálogo de prestadores de oficios de confianza sin comisiones ni intermediarios.',
    categoria: '💼 Empleos & Trabajo',
    icono: '💼',
    version: '2.1 Oficial',
    precioUsd: 0,
    tipoEntrega: 'web',
    urlAcceso: 'https://www.nexativanews.com.ar/empleos',
    visible: true
  },
  {
    id: 'nora_itu_soberano',
    nombre: 'NORA ITU — Asistente de Voz y Accesibilidad DUA',
    subtitulo: '🎙️ Inteligencia Artificial Soberana y Educativa',
    descripcion: 'Asistente de voz accesible DUA con síntesis continua de audio y compatibilidad con TalkBack y VoiceOver a costo $0.',
    categoria: '🎙️ Nora IA & Accesibilidad',
    icono: '🎙️',
    version: '5.0 Soberano',
    precioUsd: 0,
    tipoEntrega: 'web',
    urlAcceso: 'https://www.nexativanews.com.ar/noraitu',
    visible: true
  },
  {
    id: 'nexativa_news',
    nombre: 'NexativaNews (Panel Principal)',
    subtitulo: 'Portal de Noticias, Streaming & Comercio',
    descripcion: 'Portal central de prensa digital, Marketplace PyME, transmisión de streaming, cultura y servicios comunitarios.',
    categoria: 'Prensa & Medios',
    icono: '📰',
    version: '4.0 Live',
    precioUsd: 0,
    tipoEntrega: 'web',
    urlAcceso: 'https://www.nexativanews.com.ar',
    visible: true
  },
  {
    id: 'nora_ciudadano_free',
    nombre: 'NORA AI (Reportero Ciudadano)',
    subtitulo: 'Prensa Ciudadana & Redacción Autónoma',
    descripcion: 'Permite a los vecinos enviar denuncias y sucesos de su barrio para que Nora redacte y valide la noticia.',
    categoria: 'Prensa Ciudadana',
    icono: '📢',
    version: '2.0 Beta',
    precioUsd: 0,
    tipoEntrega: 'web',
    urlAcceso: 'https://www.nexativanews.com.ar',
    visible: true
  },
  {
    id: 'nora_periodista_exterior',
    nombre: 'NORA AI (Periodismo Profesional)',
    subtitulo: 'Suite de Redacción Periodística & Exteriores',
    descripcion: 'Herramienta móvil de reportería con transcripción de notas de voz en tiempo real y asistencia editorial.',
    categoria: 'Prensa Profesional',
    icono: '🎙️',
    version: '3.0 Enterprise',
    precioUsd: 0,
    tipoEntrega: 'web',
    urlAcceso: 'https://www.nexativanews.com.ar/admin',
    visible: true
  },
  {
    id: 'nexora_store_app',
    nombre: 'Nexora Store (App Oficial PWA)',
    subtitulo: 'Shopping Digital & Centro de Licencias',
    descripcion: 'Shopping digital de software y catálogo centralizado para instalar y ejecutar aplicaciones de gestión en un clic.',
    categoria: 'App Store SaaS',
    icono: '🛍️',
    version: '1.2 PWA',
    precioUsd: 0,
    tipoEntrega: 'web',
    urlAcceso: 'https://nexora-store-xi.vercel.app',
    visible: true
  },
  {
    id: 'nexora_ads',
    nombre: 'Nexora Ads & Marketing',
    subtitulo: 'Plataforma de Difusión y Banners Regionales',
    descripcion: 'Sistema de distribución de anuncios y banners geolocalizados en el ecosistema Nexativa News para comercios.',
    categoria: 'Publicidad & Ads',
    icono: '📈',
    version: '1.5 PRO',
    precioUsd: 0,
    tipoEntrega: 'web',
    urlAcceso: 'https://www.nexativanews.com.ar/store',
    visible: true
  }
];

export default function CloudDashboardPage() {
  const [items, setItems] = useState<SoftwareItem[]>(FULL_CATALOG);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQrItem, setSelectedQrItem] = useState<SoftwareItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (text: string) => {
    setToastMsg(text);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    showToast('¡Enlace copiado al portapapeles! 📋');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredItems = items.filter(item => 
    item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#08121a] text-slate-100 pb-24">
      
      {/* Header Dashboard */}
      <div className="border-b border-[#1b4353]/50 bg-black/60 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Link 
              href="/"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
              title="Volver a la Tienda"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <span>📋 Dashboard de Control & QR</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#e4a834]/20 text-[#e4a834] border border-[#e4a834]/40">
                  Cloud Live
                </span>
              </h1>
              <p className="text-xs text-gray-400">Gestión de enlaces, códigos QR y accesos directos para clientes y personal.</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link 
              href="/"
              className="px-4 py-2 rounded-xl bg-[#e4a834] hover:bg-[#cf9323] text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#e4a834]/20"
            >
              🛍️ Ver Tienda Pública
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Métricas en vivo */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#0e2430]/80 border border-[#1b4353]/40 rounded-2xl p-5">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Sistemas</div>
            <div className="text-3xl font-black text-white mt-1">{items.length}</div>
          </div>
          <div className="bg-[#0e2430]/80 border border-[#1b4353]/40 rounded-2xl p-5">
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Apps Gratuitas</div>
            <div className="text-3xl font-black text-emerald-400 mt-1">
              {items.filter(i => i.precioUsd === 0).length}
            </div>
          </div>
          <div className="bg-[#0e2430]/80 border border-[#1b4353]/40 rounded-2xl p-5">
            <div className="text-xs font-bold text-[#e4a834] uppercase tracking-wider">SaaS Comerciales</div>
            <div className="text-3xl font-black text-[#e4a834] mt-1">
              {items.filter(i => (i.precioUsd || 0) > 0).length}
            </div>
          </div>
          <div className="bg-[#0e2430]/80 border border-[#1b4353]/40 rounded-2xl p-5">
            <div className="text-xs font-bold text-purple-400 uppercase tracking-wider">Módulos Nora IA</div>
            <div className="text-3xl font-black text-purple-400 mt-1">
              {items.filter(i => i.categoria.toLowerCase().includes('nora')).length}
            </div>
          </div>
        </div>

        {/* Buscador */}
        <div className="relative mb-6">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar aplicación por nombre, función o categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0e2430]/80 border border-[#1b4353]/50 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#e4a834] transition-all"
          />
        </div>

        {/* Tabla / Lista de Sistemas */}
        <div className="bg-[#0e2430]/90 border border-[#1b4353]/40 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-black/40 text-gray-400 uppercase text-[11px] font-black tracking-wider border-b border-[#1b4353]/40">
                <tr>
                  <th className="py-4 px-6">Software / App</th>
                  <th className="py-4 px-6">Categoría</th>
                  <th className="py-4 px-6">Versión</th>
                  <th className="py-4 px-6">Precio</th>
                  <th className="py-4 px-6 text-right">Difusión & Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1b4353]/30 text-gray-200">
                {filteredItems.map(item => {
                  const targetUrl = item.urlAcceso || 'https://nexora-store-xi.vercel.app';
                  const isFree = item.precioUsd === 0;

                  return (
                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl shrink-0">{item.icono || '📦'}</span>
                          <div>
                            <div className="font-bold text-white text-base">{item.nombre}</div>
                            <div className="text-xs text-gray-400 max-w-md line-clamp-1">{item.subtitulo}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#1b4353]/60 text-cyan-300 border border-cyan-500/20">
                          {item.categoria}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-mono text-xs text-gray-400">
                        {item.version}
                      </td>
                      <td className="py-4 px-6 font-bold">
                        <span className={isFree ? 'text-emerald-400' : 'text-[#e4a834]'}>
                          {isFree ? 'Gratis ($0)' : \`USD $\${item.precioUsd}\`}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => setSelectedQrItem(item)}
                            className="p-2.5 rounded-xl bg-[#e4a834]/15 hover:bg-[#e4a834]/30 text-[#e4a834] border border-[#e4a834]/30 transition-all"
                            title="Generar Código QR y Difundir"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => handleCopy(targetUrl, item.id)}
                            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-all"
                            title="Copiar Enlace Directo"
                          >
                            {copiedId === item.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>

                          <a
                            href={targetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/30 transition-all"
                            title="Abrir / Ejecutar Sistema"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Modal de Código QR & Difusión */}
      {selectedQrItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-[#e4a834]/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>📲 Código QR & Compartir</span>
              </h3>
              <button 
                onClick={() => setSelectedQrItem(null)}
                className="text-gray-400 hover:text-white text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-300 mb-4">
              Escaneá el código con tu celular para abrir directamente <strong className="text-white">{selectedQrItem.nombre}</strong> o compartí el enlace por WhatsApp.
            </p>

            {/* Caja de Imagen QR */}
            <div className="bg-white p-5 rounded-2xl flex flex-col items-center justify-center mb-5 shadow-inner">
              <img 
                src={\`https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=10&data=\${encodeURIComponent(selectedQrItem.urlAcceso || 'https://nexora-store-xi.vercel.app')}\`}
                alt="Código QR"
                className="w-52 h-52 object-contain rounded-lg"
              />
              <div className="text-slate-900 font-extrabold text-sm mt-3 text-center">
                {selectedQrItem.icono} {selectedQrItem.nombre}
              </div>
              <div className="text-slate-500 text-[11px] font-medium">Apunta con la cámara de tu celular</div>
            </div>

            {/* Enlace con botón de copia */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-2.5 flex items-center justify-between gap-2 mb-5">
              <span className="font-mono text-xs text-cyan-300 truncate pl-2">
                {selectedQrItem.urlAcceso || 'https://nexora-store-xi.vercel.app'}
              </span>
              <button
                onClick={() => handleCopy(selectedQrItem.urlAcceso || 'https://nexora-store-xi.vercel.app', 'modal')}
                className="px-3 py-1.5 rounded-lg bg-[#e4a834]/20 hover:bg-[#e4a834] text-[#e4a834] hover:text-black font-bold text-xs transition-all shrink-0"
              >
                Copiar
              </button>
            </div>

            {/* Acciones WhatsApp y Descarga */}
            <div className="grid grid-cols-2 gap-3">
              <a
                href={\`https://api.whatsapp.com/send?text=\${encodeURIComponent(\`¡Hola! Te comparto el acceso directo a \${selectedQrItem.nombre} de Nexora:\\n\\n\${selectedQrItem.urlAcceso || 'https://nexora-store-xi.vercel.app'}\\n\\n¡Podés ingresar o descargarlo desde ahí!\`)}\`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-black font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg"
              >
                <MessageSquare className="w-4 h-4" /> WhatsApp
              </a>

              <a
                href={\`https://api.qrserver.com/v1/create-qr-code/?size=500x500&margin=15&data=\${encodeURIComponent(selectedQrItem.urlAcceso || 'https://nexora-store-xi.vercel.app')}\`}
                target="_blank"
                download={\`QR_\${selectedQrItem.id}.png\`}
                className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all border border-white/10"
              >
                <Download className="w-4 h-4" /> Guardar PNG
              </a>
            </div>

          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0f172a] border border-[#e4a834] text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold animate-in slide-in-from-bottom duration-200">
          {toastMsg}
        </div>
      )}

    </div>
  );
}
`;

fs.writeFileSync('D:/BARES 2026/Nexora_Store/app/dashboard/page.tsx', dashboardPageCode, 'utf-8');
console.log('Successfully created D:/BARES 2026/Nexora_Store/app/dashboard/page.tsx');

// 2. Update components/Header.tsx in D:/BARES 2026/Nexora_Store
const headerCode = `'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag, ShieldCheck, Sparkles, QrCode } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-[#1b4353]/40 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo Marca Nexora */}
          <Link href="/" className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#1b4353] via-[#3a6073] to-[#e4a834] p-[2px] shadow-lg shadow-[#1b4353]/50">
              <div className="w-full h-full bg-[#0e2430] rounded-[10px] flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-[#e4a834]" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-black tracking-tight text-white uppercase">
                  NEXORA <span className="bg-gradient-to-r from-[#e4a834] to-[#cf9323] bg-clip-text text-transparent">STORE</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1b4353]/60 text-[#e4a834] border border-[#e4a834]/30 uppercase">
                  App Store SaaS
                </span>
              </div>
              <p className="text-xs text-gray-400 font-medium">Centro Oficial de Software & Licencias Corporativas</p>
            </div>
          </Link>

          {/* Links y Dashboard */}
          <div className="flex items-center space-x-4 sm:space-x-6">
            <Link 
              href="/dashboard"
              className="flex items-center space-x-2 text-xs font-black uppercase text-black bg-[#e4a834] hover:bg-[#cf9323] px-4 py-2.5 rounded-xl shadow-lg shadow-[#e4a834]/20 transition-all"
            >
              <QrCode className="w-4 h-4" />
              <span>📋 Dashboard & QR</span>
            </Link>

            <div className="hidden lg:flex items-center space-x-2 text-xs font-semibold text-gray-300 bg-[#0e2430]/70 px-3.5 py-2 rounded-xl border border-[#1b4353]/30">
              <ShieldCheck className="w-4 h-4 text-[#e4a834]" />
              <span>Garantía Bancaria SaaS</span>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
`;

fs.writeFileSync('D:/BARES 2026/Nexora_Store/components/Header.tsx', headerCode, 'utf-8');
console.log('Successfully updated D:/BARES 2026/Nexora_Store/components/Header.tsx');
