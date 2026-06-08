/**
 * Shared Article type matching the `public.articles` table schema.
 */
export interface Article {
  id: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  image_url: string | null;
  category: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  author_id: string | null;
}

/** Valid news categories for the tab filter. */
export type NewsCategory = 'nacional' | 'internacional' | 'local';

/** Map from display label to database category value. */
export const NEWS_TAB_LABELS: Record<string, NewsCategory> = {
  Nacional: 'nacional',
  Internacional: 'internacional',
  Local: 'local',
} as const;

export interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  stock: number;
  image_url: string | null;
  buy_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Sponsor {
  id: string;
  name: string;
  logo_url: string;
  banner_url: string | null;
  category: string;
  website_url: string | null;
  instagram_url: string | null;
  is_pro: boolean;
  created_at: string;
}

export interface VideoQueueItem {
  id: string;
  title: string;
  video_url: string;
  type: 'youtube' | 'twitch' | 'custom';
  status: 'playing' | 'queued' | 'finished';
  position: number;
  created_at: string;
}

// Deprecated (kept for backwards compatibility until refactored)
export interface StreamVideo {
  id: string;
  title: string;
  youtube_url?: string;
  video_url?: string;
  is_live: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  payment_method: string;
  total_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface AccountingMovement {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  reference_id: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  role: 'admin' | 'operator' | 'redactor';
  updated_at: string;
}
