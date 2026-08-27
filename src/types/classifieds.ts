export type ClassifiedCategory =
  | "vehiculos"
  | "herramientas"
  | "tecnologia"
  | "hogar"
  | "electrodomesticos"
  | "inmuebles"
  | "indumentaria"
  | "otros";

export type ClassifiedCondition =
  | "nuevo"
  | "como_nuevo"
  | "muy_bueno"
  | "buen_estado"
  | "con_detalles"
  | "a_reparar";

export interface ClassifiedItem {
  id: string;
  title: string;
  slug?: string;
  category: ClassifiedCategory;
  condition: ClassifiedCondition;
  price: number;
  currency: "ARS" | "USD";
  is_negotiable: boolean;
  accepts_trade: boolean;
  location: string;
  description: string;
  images: string[];
  seller_name: string;
  seller_phone: string;
  seller_whatsapp: string;
  seller_email?: string;
  is_featured: boolean;
  is_active: boolean;
  status: "active" | "paused" | "sold" | "deleted";
  views_count: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ClassifiedFormData {
  title: string;
  category: ClassifiedCategory;
  condition: ClassifiedCondition;
  price: number | string;
  currency: "ARS" | "USD";
  is_negotiable: boolean;
  accepts_trade: boolean;
  location: string;
  description: string;
  images: string[];
  seller_name: string;
  seller_phone: string;
  seller_whatsapp: string;
  seller_email?: string;
  metadata?: Record<string, any>;
}

export const CATEGORIES_MAP: Record<ClassifiedCategory, { label: string; icon: string; description: string }> = {
  vehiculos: {
    label: "Vehículos",
    icon: "🚗",
    description: "Autos, camionetas, motos, lanchas y repuestos"
  },
  herramientas: {
    label: "Herramientas y Maquinaria",
    icon: "🔧",
    description: "Herramientas eléctricas, manuales, taller y construcción"
  },
  tecnologia: {
    label: "Tecnología y Celulares",
    icon: "📱",
    description: "Smartphones, notebooks, PCs, audio y consolas"
  },
  electrodomesticos: {
    label: "Electrodomésticos",
    icon: "🔌",
    description: "Heladeras, lavarropas, microondas y climatización"
  },
  hogar: {
    label: "Hogar y Muebles",
    icon: "🛋️",
    description: "Muebles, decoración, iluminación y bazar"
  },
  inmuebles: {
    label: "Inmuebles y Terrenos",
    icon: "🏠",
    description: "Venta y alquiler de casas, departamentos y terrenos"
  },
  indumentaria: {
    label: "Indumentaria y Calzado",
    icon: "👗",
    description: "Ropa, calzado, camperas y accesorios"
  },
  otros: {
    label: "Varios y Oportunidades",
    icon: "📦",
    description: "Artículos en desuso, colecciones y todo lo demás"
  }
};

export const CONDITIONS_MAP: Record<ClassifiedCondition, string> = {
  nuevo: "Nuevo (Sin uso)",
  como_nuevo: "Como nuevo (Impecable)",
  muy_bueno: "Muy buen estado",
  buen_estado: "Buen estado (Uso normal)",
  con_detalles: "Con detalles visibles",
  a_reparar: "Para reparar o repuestos"
};

export const POPULAR_LOCATIONS = [
  "Ituzaingó, Corrientes",
  "Villa Olivari, Corrientes",
  "Isla Apipé Grande, Corrientes",
  "Posadas, Misiones",
  "San Miguel, Corrientes",
  "Loreto, Corrientes",
  "Virasoro, Corrientes",
  "Ayolas, Paraguay",
  "Otra localidad"
];
