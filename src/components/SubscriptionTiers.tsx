"use client";
import React from 'react';

const tiers = [
  {
    name: 'Bronce',
    features: [
      'Acceso ilimitado a noticias',
      'Alertas en tiempo real',
    ],
    buttonText: 'Suscribirse',
    link: 'https://wa.me/5493786611250?text=Hola%20Nexativa%20News%2C%20quiero%20suscribirme%20al%20Plan%20Bronce',
    badge: null,
    borderClass: 'border-gray-300',
  },
  {
    name: 'Plata',
    features: [
      'Socio Pro',
      'Acceso a Tienda con descuento',
      'Boletín semanal',
    ],
    buttonText: 'Suscribirse',
    link: 'https://wa.me/5493786611250?text=Hola%20Nexativa%20News%2C%20quiero%20suscribirme%20al%20Plan%20Plata',
    badge: null,
    borderClass: 'border-gray-300',
  },
  {
    name: 'Oro',
    features: [
      'Acceso total',
      'Soporte prioritario',
      'Sorteos y participación en encuestas',
    ],
    buttonText: 'Suscribirse',
    link: 'https://wa.me/5493786611250?text=Hola%20Nexativa%20News%2C%20quiero%20suscribirme%20al%20Plan%20Oro',
    badge: 'Popular',
    borderClass: 'border-brand-gold',
  },
];

export default function SubscriptionTiers() {
  return (
    <section className="py-12 mt-12 border-t border-white/5 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[var(--color-brand-accent)]/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-extrabold text-center mb-8">Planes de Suscripción</h2>
        <div className="flex overflow-x-auto pb-6 gap-4 snap-x snap-mandatory hide-scrollbar md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:pb-0">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`glass-panel p-6 sm:p-8 flex flex-col items-center hover:-translate-y-2 transition-all duration-300 relative min-w-[260px] sm:min-w-0 snap-center flex-shrink-0 ${tier.name === 'Oro' ? 'border-[var(--color-brand-accent)] shadow-[0_0_30px_rgba(212,175,55,0.15)]' : 'border-white/10'}`}
            >
              {tier.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[var(--color-brand-accent)] to-yellow-600 text-black text-xs font-bold px-4 py-1.5 rounded-full shadow-lg uppercase tracking-wider">
                  {tier.badge}
                </div>
              )}
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-6">{tier.name}</h3>
              <ul className="space-y-4 mb-8 text-sm text-gray-300 text-center w-full">
                {tier.features.map((f, i) => (
                  <li key={i} className="flex items-center justify-center gap-2">
                    <span className="text-[var(--color-brand-accent)]">✓</span> {f}
                  </li>
                ))}
              </ul>
              <a
                href={tier.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto w-full text-center bg-white/5 hover:bg-[var(--color-brand-accent)] hover:text-black text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 border border-white/10 hover:border-transparent text-sm sm:text-base"
              >
                {tier.buttonText}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
