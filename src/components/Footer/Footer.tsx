/* src/components/Footer/Footer.tsx */
export default function Footer() {
  return (
    <footer className="bg-white text-black py-6 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm">
        <p className="mb-2">© 2026 Nexativa News</p>
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
