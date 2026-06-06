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
