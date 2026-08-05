import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

function cleanExcerptText(raw: string | null): string {
  if (!raw) return 'Noticia destacada en vivo en Nexativa News.';
  let text = raw
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');

  text = text.replace(/<[^>]+>/g, '').trim();
  text = text.replace(/https?:\/\/\S+/gi, '').trim();
  return text.substring(0, 180);
}

function detectCategoryAndImage(title: string, excerpt: string) {
  const t = (title + ' ' + excerpt).toLowerCase();

  // ⚽ DEPORTES (Fútbol, Maxi Salas, Racing, Boca, River, San Lorenzo, Selección, Tenis, Básquet, Liga, DT, Gol)
  if (
    t.includes('salas') ||
    t.includes('fútbol') ||
    t.includes('futbol') ||
    t.includes('boca') ||
    t.includes('river') ||
    t.includes('racing') ||
    t.includes('san lorenzo') ||
    t.includes('independiente') ||
    t.includes('tenis') ||
    t.includes('básquet') ||
    t.includes('liga profesional') ||
    t.includes('copa') ||
    t.includes('campeón') ||
    t.includes('partido') ||
    t.includes('dt ')
  ) {
    return {
      category: 'deportes',
      image_url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80',
    };
  }

  // 🌿 LOCAL / REGIONAL (Corrientes, Ituzaingó, Iberá, Yacyretá, Gobernador Valdés, Paraná, Litoral)
  if (
    t.includes('corrientes') ||
    t.includes('ituzaingó') ||
    t.includes('ituzaingo') ||
    t.includes('iberá') ||
    t.includes('yacyretá') ||
    t.includes('valdés') ||
    t.includes('paraná') ||
    t.includes('litoral')
  ) {
    return {
      category: 'local',
      image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    };
  }

  // 🏥 SALUD & CIENCIA (Sangre, Crohn, Sarcopenia, Estudio Médico, Cáncer, Vacuna, Virus, Hospital)
  if (
    t.includes('crohn') ||
    t.includes('sangre') ||
    t.includes('sarcopenia') ||
    t.includes('salud') ||
    t.includes('médic') ||
    t.includes('estudio científico') ||
    t.includes('cáncer') ||
    t.includes('vacuna')
  ) {
    return {
      category: 'nacional',
      image_url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
    };
  }

  // 🌍 INTERNACIONAL (Sudáfrica, EEUU, Europa, Cumbre, China, Ucrania, Israel, Cancillería)
  if (
    t.includes('sudáfrica') ||
    t.includes('sudafrica') ||
    t.includes('eeuu') ||
    t.includes('estados unidos') ||
    t.includes('europa') ||
    t.includes('ucrania') ||
    t.includes('china') ||
    t.includes('cumbre')
  ) {
    return {
      category: 'internacional',
      image_url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80',
    };
  }

  // 🎭 CULTURA (Música, Teatro, Libro, Arte, Cine, Concierto)
  if (t.includes('teatro') || t.includes('música') || t.includes('recital') || t.includes('cine') || t.includes('libro')) {
    return {
      category: 'cultural',
      image_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
    };
  }

  // 🇦🇷 NACIONAL (Por defecto)
  return {
    category: 'nacional',
    image_url: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80',
  };
}

export async function GET(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    // 1. Obtener todas las noticias para auto-clasificar
    const { data: articles, error } = await supabase
      .from('articles')
      .select('id, title, excerpt, category, image_url');

    if (error || !articles) {
      return NextResponse.json({ success: false, error: error?.message || 'No se obtuvieron artículos' }, { status: 500 });
    }

    let updatedCount = 0;

    for (const art of articles) {
      const cleanExcerpt = cleanExcerptText(art.excerpt);
      const { category, image_url } = detectCategoryAndImage(art.title, cleanExcerpt);

      // Actualizar en la BD
      const { error: upErr } = await supabase
        .from('articles')
        .update({
          category,
          image_url: art.image_url && !art.image_url.includes('unsplash') ? art.image_url : image_url,
          excerpt: cleanExcerpt,
        })
        .eq('id', art.id);

      if (!upErr) updatedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `🎉 Auto-clasificación masiva completa. Se clasificaron ${updatedCount} noticias correctamente por rubro e imagen.`,
      count: updatedCount,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
