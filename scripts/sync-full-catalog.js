const fs = require('fs');

const full11Catalog = [
  {
    id: 'autentico_tributo',
    title: 'Auténtico Tributo (Portal & Sistema Oficial)',
    category: 'saas',
    tag: '🎵 MÚSICA & EVENTOS',
    icon: '🎸',
    price: '$0 / Prueba',
    version: 'v2.0.0 (Web Oficial)',
    size: 'Web PWA',
    description: 'Plataforma oficial para shows en vivo: Pantalla gigante interactiva para el público, administración de repertorio, canciones y pedidos en vivo.',
    download_url: 'https://nexora-store-xi.vercel.app',
    active: true
  },
  {
    id: 'restobar',
    title: 'Restobar 2026 (Suite Gastronómica)',
    category: 'saas',
    tag: 'GASTRONOMÍA & BARES',
    icon: '🍹',
    price: 'USD $65 / Licencia',
    version: 'v4.8.2 PRO',
    size: '2.2 MB (ZIP)',
    description: 'Plataforma integral para restaurantes, bares y pubs: Control en tiempo real de mesas, comandas digitales, stock de insumos y facturación rápida.',
    download_url: 'downloads/saas-comerciales/nexora-bares/MyJNexoraVisual_SuiteComercial.zip',
    active: true
  },
  {
    id: 'nexora_clasificados',
    title: 'Nexora Clasificados Móvil',
    category: 'gratis',
    tag: '🚗 CLASIFICADOS & AUTOS',
    icon: '🚗',
    price: '$0 / Gratis',
    version: 'v1.0 (Oficial)',
    size: 'Web PWA',
    description: 'App ciudadana gratuita para comprar y vender autos, motos, herramientas y artículos de segunda mano con hasta 10 fotos WebP y WhatsApp.',
    download_url: 'https://www.nexativanews.com.ar/clasificados',
    active: true
  },
  {
    id: 'inmuebles_verificados',
    title: 'Inmuebles Verificados',
    category: 'gratis',
    tag: '🏠 INMUEBLES & VIVIENDA',
    icon: '🏠',
    price: '$0 / Gratis',
    version: 'v2.4 (Oficial)',
    size: 'Web PWA',
    description: 'Portal de alquileres temporarios, anuales y venta de propiedades verificadas en Ituzaingó y la región.',
    download_url: 'https://www.nexativanews.com.ar/guia/inmuebles',
    active: true
  },
  {
    id: 'empleos_oficios',
    title: 'Empleos & Oficios Regionales',
    category: 'gratis',
    tag: '💼 EMPLEOS & TRABAJO',
    icon: '💼',
    price: '$0 / Gratis',
    version: 'v2.1 (Oficial)',
    size: 'Web PWA',
    description: 'Bolsa de trabajo regional y catálogo de prestadores de oficios de confianza sin comisiones ni intermediarios.',
    download_url: 'https://www.nexativanews.com.ar/empleos',
    active: true
  },
  {
    id: 'nora_itu_soberano',
    title: 'NORA ITU — Asistente de Voz y Accesibilidad DUA',
    category: 'nora',
    tag: '🎙️ NORA IA & ACCESIBILIDAD',
    icon: '🎙️',
    price: '$0 / Gratuito',
    version: 'v5.0 Soberano',
    size: 'Web Audio API',
    description: 'Inteligencia artificial soberana, educativa y accesible con lectura de voz continua y soporte nativo TalkBack/VoiceOver.',
    download_url: 'https://www.nexativanews.com.ar/noraitu',
    active: true
  },
  {
    id: 'nexativa_news',
    title: 'NexativaNews (Panel Principal)',
    category: 'saas',
    tag: 'PRENSA & MEDIOS',
    icon: '📰',
    price: 'Acceso Oficial',
    version: 'v4.0 Live',
    size: 'Web PWA',
    description: 'Portal principal de noticias, Marketplace PyME, transmisión de streaming, cultura y servicios comunitarios regionales.',
    download_url: 'https://www.nexativanews.com.ar',
    active: true
  },
  {
    id: 'nora_ciudadano_free',
    title: 'NORA AI (Reportero Ciudadano)',
    category: 'nora',
    tag: 'PRENSA CIUDADANA',
    icon: '📢',
    price: '$0 / Gratis',
    version: 'v2.0 Beta',
    size: 'Web PWA',
    description: 'Permite a los ciudadanos reportar eventos, baches o novedades de su barrio. Nora IA redacta y valida la noticia automáticamente.',
    download_url: 'https://www.nexativanews.com.ar',
    active: true
  },
  {
    id: 'nora_periodista_exterior',
    title: 'NORA AI (Periodismo Profesional & Exteriores)',
    category: 'nora',
    tag: 'PRENSA PROFESIONAL',
    icon: '🎙️',
    price: 'Licencia Editorial',
    version: 'v3.0 Enterprise',
    size: 'Web & Móvil',
    description: 'Herramienta de reportería móvil avanzada con transcripción en vivo, generación de resúmenes de audio y redacción periodística.',
    download_url: 'https://www.nexativanews.com.ar/admin',
    active: true
  },
  {
    id: 'nexora_store_app',
    title: 'Nexora Store (App Oficial PWA)',
    category: 'saas',
    tag: 'APP STORE & HUB SAAS',
    icon: '🛍️',
    price: '$0 / Gratis',
    version: 'v1.2 PWA',
    size: 'Web PWA',
    description: 'Shopping digital de software y catálogo centralizado para instalar y ejecutar aplicaciones de gestión y servicios en un clic.',
    download_url: 'https://nexora-store-xi.vercel.app',
    active: true
  },
  {
    id: 'nexora_ads',
    title: 'Nexora Ads & Marketing',
    category: 'saas',
    tag: 'PUBLICIDAD & ADS',
    icon: '📈',
    price: 'Consultar Planes',
    version: 'v1.5 PRO',
    size: 'Plataforma Web',
    description: 'Sistema de distribución de anuncios y banners geolocalizados en el ecosistema Nexativa News para comercios y empresas.',
    download_url: 'https://www.nexativanews.com.ar/store',
    active: true
  }
];

// 1. Guardar en store_catalog.json
fs.writeFileSync('D:/NEXORA STORE/catalog/store_catalog.json', JSON.stringify(full11Catalog, null, 2), 'utf-8');

// 2. Reemplazar initialCatalog en D:/NEXORA STORE/index.html
let indexHtml = fs.readFileSync('D:/NEXORA STORE/index.html', 'utf-8');
const catRegex = /const initialCatalog = \[[\s\S]*?\];/;
const newCatCode = 'const initialCatalog = ' + JSON.stringify(full11Catalog, null, 2) + ';';
indexHtml = indexHtml.replace(catRegex, newCatCode);

// Forzar actualización de storage key para que refresque en los navegadores existentes
indexHtml = indexHtml.replace(/const STORAGE_KEY = '[^']+';/, "const STORAGE_KEY = 'nexora_store_catalog_v4';");

fs.writeFileSync('D:/NEXORA STORE/index.html', indexHtml, 'utf-8');
console.log('Successfully synced all 11 apps into D:/NEXORA STORE/index.html & store_catalog.json!');
