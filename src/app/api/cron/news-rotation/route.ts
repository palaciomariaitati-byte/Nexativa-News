import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NewsGenerator } from '@/modules/nora-pro/news_generator';

export const maxDuration = 60; // 60 seconds max execution time for cron

export async function GET(request: Request) {
  try {
    // Verificación de seguridad de Vercel Cron (opcional pero recomendada)
    const authHeader = request.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      if (process.env.NODE_ENV === "production") {
        return new NextResponse("Unauthorized", { status: 401 });
      }
    }

    console.log("[News Rotation] Iniciando rotación diaria de noticias...");

    const supabase = createServerSupabaseClient();
    
    // 1. Encontrar noticias publicadas con más de 24 horas de antigüedad
    const limitDate = new Date();
    limitDate.setHours(limitDate.getHours() - 24);

    const { data: oldArticles, error: fetchError } = await supabase
      .from('articles')
      .select('id, title')
      .eq('status', 'published')
      .lt('created_at', limitDate.toISOString());

    if (fetchError) {
      throw new Error(`Error fetching old articles: ${fetchError.message}`);
    }

    let archivedCount = 0;

    // 2. Eliminar físicamente las noticias viejas para mantener la base de datos limpia y ordenada
    if (oldArticles && oldArticles.length > 0) {
      const oldIds = oldArticles.map(a => a.id);
      const { error: deleteError } = await supabase
        .from('articles')
        .delete()
        .in('id', oldIds);

      if (deleteError) {
        throw new Error(`Error deleting old articles: ${deleteError.message}`);
      }

      archivedCount = oldIds.length;
      console.log(`[News Rotation] Se eliminaron definitivamente ${archivedCount} noticias antiguas.`);
    } else {
      console.log("[News Rotation] No se encontraron noticias mayores a 24 hs para eliminar.");
    }

    // 3. Generar nuevas noticias si se archivaron noticias, o si hay muy pocas publicadas
    let generatedCount = 0;
    
    // Chequear cuántas publicadas quedan
    const { count: publishedCount, error: countError } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');

    if (archivedCount > 0 || (publishedCount !== null && publishedCount < 5)) {
      console.log("[News Rotation] Invocando a Nora para generar nuevas noticias...");
      
      const nora = new NewsGenerator();
      // Pedir 2 noticias nuevas
      const candidateArticles = await nora.generateNewArticles(2);
      
      const { verifyNewsVeracity } = await import('@/modules/nora-pro/fact_checker');

      const approvedArticles: any[] = [];
      for (const article of candidateArticles) {
        const factCheck = await verifyNewsVeracity(article.title || "", article.content || "", article.source_url);
        console.log(`[Virtual Content Analyst] Fact-Check "${article.title?.substring(0, 30)}...": Score ${factCheck.veracityScore}/100, Level: ${factCheck.credibilityLevel}`);

        if (factCheck.veracityScore >= 50 && factCheck.status !== 'BLOCKED') {
          approvedArticles.push({
            ...article,
            fact_check_score: factCheck.veracityScore,
            fact_check_status: factCheck.credibilityLevel
          });
        } else {
          console.warn(`[ANTI-FAKE NEWS] Noticia bloqueda por baja veracidad (${factCheck.veracityScore}/100): ${article.title}`);
        }
      }

      if (approvedArticles.length > 0) {
        const { error: insertError } = await supabase
          .from('articles')
          .insert(approvedArticles);
          
        if (insertError) {
          console.error("[News Rotation] Error insertando noticias generadas por Nora:", insertError);
        } else {
          generatedCount = approvedArticles.length;
          console.log(`[News Rotation] Nora y el Analista de Contenidos verificaron e insertaron exitosamente ${generatedCount} noticias auténticas.`);
        }
      } else {
        console.log("[News Rotation] El Analista de Contenidos filtró o no se encontraron noticias verídicas suficientes.");
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Rotación completa. Archivadas: ${archivedCount}. Generadas por Nora: ${generatedCount}.`,
      archived: archivedCount,
      generated: generatedCount
    });

  } catch (error: any) {
    console.error("[News Rotation] Error general:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
