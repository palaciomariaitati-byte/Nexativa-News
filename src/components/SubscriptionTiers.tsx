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
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-extrabold text-center mb-8">Planes de Suscripción</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`border rounded-lg p-6 flex flex-col items-center ${tier.borderClass}`}
            >
              {tier.badge && (
                <span className="bg-brand-gold text-white text-xs font-semibold px-2 py-1 rounded-full -mt-4 mb-2">
                  {tier.badge}
                </span>
              )}
              <h3 className="text-xl font-bold mb-4">{tier.name}</h3>
              <ul className="space-y-2 mb-6 text-sm text-center">
                {tier.features.map((f, i) => (
                  <li key={i}>• {f}</li>
                ))}
              </ul>
              <a
                href={tier.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto bg-brand-green hover:bg-brand-gold text-white font-medium py-2 px-4 rounded transition-colors duration-300"
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
