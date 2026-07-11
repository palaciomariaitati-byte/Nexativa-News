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
 * Calculates the distance between two coordinates in meters using the Haversine formula.
 */
export function calculateDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // distance in meters
}

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
 * Finds the closest location reference and returns a descriptive name with exact distance.
 */
export function getClosestLocation(lat: number, lng: number): LocationReference | null {
  if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return null;
  let closest: LocationReference | null = null;
  let minDistance = Infinity;

  for (const loc of ITUZAINGO_LOCATIONS) {
    const dist = calculateDistanceInMeters(lat, lng, loc.lat, loc.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closest = loc;
    }
  }

  if (!closest) return null;

  // Format the resolved location name based on the distance in meters
  let resolvedName = closest.name;
  let resolvedDesc = closest.description;

  if (minDistance < 250) {
    resolvedName = `${closest.name}`;
    resolvedDesc = `${closest.description} (en el lugar)`;
  } else if (minDistance < 1500) {
    resolvedName = `Cerca de ${closest.name} (a ${Math.round(minDistance)}m)`;
    resolvedDesc = `Aproximadamente a ${Math.round(minDistance)} metros de ${closest.description}`;
  } else {
    // If it's further than 1.5km, return a generic zone description
    resolvedName = `Ituzaingó (a ${Math.round(minDistance / 100) / 10}km de ${closest.name})`;
    resolvedDesc = `Zona de Ituzaingó, a ${Math.round(minDistance / 100) / 10}km de ${closest.name}`;
  }

  return {
    name: resolvedName,
    lat: closest.lat,
    lng: closest.lng,
    description: resolvedDesc
  };
}
