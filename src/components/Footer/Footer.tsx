/* src/components/Footer/Footer.tsx */
export default function Footer() {
  return (
    <footer className="glass-panel text-gray-400 py-6 border-t border-white/10 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm">
        <p className="mb-2">© 2026 Nexativa News. Desarrollado por MyJNexoraVisual, arquitectura de Javilo29.</p>
        <nav className="flex justify-center space-x-4">
          <a href="/politica-privacidad" className="hover:underline">
            Política de Privacidad
          </a>
          <a href="/terminos" className="hover:underline">
            Términos de Servicio
          </a>
          <a href="/contacto" className="hover:underline">
            Contacto
          </a>
        </nav>
      </div>
    </footer>
  );
}
