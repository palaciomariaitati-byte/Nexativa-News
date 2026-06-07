"use client";
import React from 'react';

export default function WhatsAppWidget() {
  const waLink = 'https://wa.me/5493786611250?text=Hola%20Nexativa%20News%2C%20quiero%20realizar%20una%20consulta%20comercial%20o%20de%20suscripci%C3%B3n.';
  return (
    <a
      href={waLink}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 left-4 z-40 bg-brand-green text-white rounded-full p-3 shadow-lg hover:opacity-90 transition-opacity"
      aria-label="Contactar por WhatsApp"
    >
      {/* WhatsApp icon (simple SVG) */}
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M20.52 3.48A11.94 11.94 0 0012 0c-6.62 0-12 5.38-12 12 0 2.12.56 4.14 1.56 5.9L0 24l6.33-1.65a11.86 11.86 0 005.66 1.44h.01c6.62 0 12-5.38 12-12 0-3.2-1.24-6.13-3.48-8.31zM12 22a9.86 9.86 0 01-5.2-1.44l-.37-.22-3.76 1 1-3.66-.24-.38A9.86 9.86 0 012 12c0-5.51 4.49-10 10-10s10 4.49 10 10-4.49 10-10 10z"/>
        <path d="M17.37 14.54c-.24-.12-1.43-.71-1.65-.79-.22-.08-.38-.12-.54.12-.16.24-.61.79-.75.95-.14.16-.28.18-.52.06-.24-.12-1.02-.37-1.94-1.18-.72-.64-1.21-1.43-1.35-1.66-.14-.24-.02-.37.1-.49.1-.1.24-.27.36-.4.12-.12.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.48-.4-.41-.54-.42-.14-.01-.3-.01-.46-.01-.16 0-.42.06-.64.3-.22.24-.86.84-.86 2.05s.88 2.38 1 2.54c.12.16 1.74 2.66 4.22 3.73.59.26 1.05.41 1.41.53.59.19 1.13.16 1.55.1.47-.07 1.43-.58 1.63-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28z"/>
      </svg>
    </a>
  );
}
