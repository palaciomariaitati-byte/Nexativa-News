export interface LocationReference {
  name: string;
  lat: number;
  lng: number;
  description: string;
}

export const ITUZAINGO_LOCATIONS: LocationReference[] = [
  {
    name: "Plaza San Martín (Centro de Ituzaingó)",
    lat: -27.5973,
    lng: -56.6874,
    description: "Plaza principal San Martín, zona céntrica de Ituzaingó, Corrientes"
  },
  {
    name: "Puerto de Ituzaingó",
    lat: -27.5815,
    lng: -56.6890,
    description: "Zona portuaria a orillas del Río Paraná, Ituzaingó, Corrientes"
  },
  {
    name: "Terminal de Ómnibus de Ituzaingó",
    lat: -27.6041,
    lng: -56.6803,
    description: "Terminal de colectivos de Ituzaingó, acceso por Av. Centenario"
  },
  {
    name: "Cruce de Ruta Nacional 12 y Av. Centenario",
    lat: -27.6166,
    lng: -56.6711,
    description: "Cruce estratégico de la Ruta Nacional 12 y Av. Centenario, acceso este de Ituzaingó"
  },
  {
    name: "Represa Hidroeléctrica Yacyretá",
    lat: -27.4795,
    lng: -56.7352,
    description: "Complejo de la Represa Hidroeléctrica Yacyretá, cercanías de Ituzaingó"
  },
  {
    name: "Playa Paranaguá / Costanera",
    lat: -27.5855,
    lng: -56.7025,
    description: "Zona costera y de balnearios de la playa Paranaguá, Ituzaingó"
  },
  {
    name: "Barrio General San Martín (Mil Viviendas)",
    lat: -27.6095,
    lng: -56.6960,
    description: "Barrio Mil Viviendas, zona residencial sur de Ituzaingó"
  },
  {
    name: "Acceso Principal por Ruta Nacional 12",
    lat: -27.6250,
    lng: -56.6830,
    description: "Ingreso principal terrestre a la ciudad de Ituzaingó desde la Ruta Nacional 12"
  }
];

/**
 * Parses a coordinate string in the format "lat,lng" or similar.
 */
export function parseCoordinates(coordStr: string): { lat: number; lng: number } {
  if (!coordStr) return { lat: 0, lng: 0 };
  const parts = coordStr.split(',').map(p => parseFloat(p.trim()));
  return {
    lat: parts[0] || 0,
    lng: parts[1] || 0
  };
}

/**
 * Finds the closest location reference in Corrientes/Ituzaingó database.
 */
export function getClosestLocation(lat: number, lng: number): LocationReference | null {
  if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return null;
  let closest: LocationReference | null = null;
  let minDistance = Infinity;

  // Simple Euclidean distance (fine for local points)
  for (const loc of ITUZAINGO_LOCATIONS) {
    const dLat = loc.lat - lat;
    const dLng = loc.lng - lng;
    const dist = Math.sqrt(dLat * dLat + dLng * dLng);
    if (dist < minDistance) {
      minDistance = dist;
      closest = loc;
    }
  }

  // 1 degree latitude is approx 111 km. 0.1 degree is approx 11 km.
  // If the closest location is more than ~11 km away, return a generic location reference instead.
  if (minDistance > 0.1) {
    return {
      name: "Ituzaingó / Corrientes",
      lat,
      lng,
      description: `Coordenadas del operador: ${lat}, ${lng}, Provincia de Corrientes`
    };
  }

  return closest;
}
