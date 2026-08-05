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
  if (!text || text.length < 10) return 'Noticia publicada y maquetada en vivo en Nexativa News.';
  return text.substring(0, 180);
}

function isValidArticleImage(url: string | null): boolean {
  if (!url) return false;
  const u = url.toLowerCase();
  if (
    u.includes('googleusercontent') ||
    u.includes('news.google') ||
    u.includes('logo') ||
    u.includes('icon') ||
    u.includes('favicon') ||
    u.includes('placeholder')
  ) {
    return false;
  }
  return u.startsWith('http');
}

function detectCategoryAndImage(title: string, excerpt: string) {
  const t = (title + ' ' + excerpt).toLowerCase();

  // ⚽ DEPORTES (Fútbol, Mastantuono, Real Madrid, Racing, Boca, River, San Lorenzo, Selección, Tenis, Básquet)
  if (
    t.includes('mastantuono') ||
    t.includes('real madrid') ||
    t.includes('salas') ||
    t.includes('fútbol') ||
    t.includes('futbol') ||
    t.includes('boca') ||
    t.includes('river') ||
    t.includes('racing') ||
    t.includes('san lorenzo') ||
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

  // 🏥 SALUD & MEDICINA (Psicólogo, Chaco, Crohn, Sarcopenia, Estudio Médico, Cáncer, Vacuna, Virus, Hospital)
  if (
    t.includes('psicólogo') ||
    t.includes('psicologo') ||
    t.includes('sangre') ||
    t.includes('crohn') ||
    t.includes('sarcopenia') ||
    t.includes('salud') ||
    t.includes('médic') ||
    t.includes('estudio') ||
    t.includes('vacuna') ||
    t.includes('hospital')
  ) {
    return {
      category: 'nacional',
      image_url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
    };
  }

  // ⚖️ POLICIALES & JUSTICIA (Asesinado, Chats, Maltrato, Chaco, Juez, Policiales, Fiscal)
  if (
    t.includes('asesinado') ||
    t.includes('novia') ||
    t.includes('chats') ||
    t.includes('maltrato') ||
    t.includes('crimen') ||
    t.includes('policía') ||
    t.includes('detenido') ||
    t.includes('justicia')
  ) {
    return {
      category: 'nacional',
      image_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80',
    };
  }

  // 🌍 INTERNACIONAL (Sudáfrica, EEUU, Europa, Cumbre, China, Ucrania, Israel)
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

  // 🏛️ POLÍTICA & GOBIERNO (Milei, Brasil, Conflicto, Ley de Tierras, Sesión)
  if (
    t.includes('milei') ||
    t.includes('brasil') ||
    t.includes('ley de tierras') ||
    t.includes('congreso') ||
    t.includes('diputados') ||
    t.includes('senadores') ||
    t.includes('gobierno')
  ) {
    return {
      category: 'nacional',
      image_url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80',
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

      const isInvalidImg = !isValidArticleImage(art.image_url);
      const finalImg = isInvalidImg ? image_url : art.image_url;

      const { error: upErr } = await supabase
        .from('articles')
        .update({
          category,
          image_url: finalImg,
          excerpt: cleanExcerpt,
        })
        .eq('id', art.id);

      if (!upErr) updatedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `🎉 Auto-clasificación HD completa. Se actualizaron ${updatedCount} noticias eliminando logos de Google y fragmentos HTML.`,
      count: updatedCount,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
