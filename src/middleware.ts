import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  // Ignorar peticiones internas de Next.js, API, assets e iconos
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 🌐 Si el dominio es de NoraItu (ej. noraitu.com.ar, noraitu.vercel.app, o cualquier host con noraitu)
  const isNoraItuDomain = host.toLowerCase().includes('noraitu');

  if (isNoraItuDomain) {
    // Si entra a la raíz '/', servir internamente '/noraitu' de forma 100% transparente
    if (pathname === '/') {
      url.pathname = '/noraitu';
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Coincidir con todas las rutas excepto archivos estáticos
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
