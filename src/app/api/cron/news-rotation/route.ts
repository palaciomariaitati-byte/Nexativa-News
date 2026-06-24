import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NewsGenerator } from '@/modules/nora-pro/news_generator';

export const maxDuration = 60; // 60 seconds max execution time for cron

export async function GET(request: Request) {
  try {
    // Verificación de seguridad de Vercel Cron (opcional pero recomendada)
    const authHeader = request.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== \`Bearer \${process.env.CRON_SECRET}\`) {
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
      throw new Error(\`Error fetching old articles: \${fetchError.message}\`);
    }

    let archivedCount = 0;

    // 2. Archivar las noticias viejas para que no salgan en el panel
    if (oldArticles && oldArticles.length > 0) {
      const oldIds = oldArticles.map(a => a.id);
      const { error: updateError } = await supabase
        .from('articles')
        .update({ status: 'archived' })
        .in('id', oldIds);

      if (updateError) {
        throw new Error(\`Error archiving articles: \${updateError.message}\`);
      }

      archivedCount = oldIds.length;
      console.log(\`[News Rotation] Se archivaron \${archivedCount} noticias antiguas.\`);
    } else {
      console.log("[News Rotation] No se encontraron noticias mayores a 24 hs para archivar.");
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
      const newArticles = await nora.generateNewArticles(2);
      
      if (newArticles.length > 0) {
        const { error: insertError } = await supabase
          .from('articles')
          .insert(newArticles);
          
        if (insertError) {
          console.error("[News Rotation] Error insertando noticias generadas por Nora:", insertError);
        } else {
          generatedCount = newArticles.length;
          console.log(\`[News Rotation] Nora generó e insertó exitosamente \${generatedCount} noticias nuevas.\`);
        }
      } else {
        console.log("[News Rotation] Nora no pudo generar nuevas noticias (quizás no hay nuevas en el RSS).");
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: \`Rotación completa. Archivadas: \${archivedCount}. Generadas por Nora: \${generatedCount}.\`,
      archived: archivedCount,
      generated: generatedCount
    });

  } catch (error: any) {
    console.error("[News Rotation] Error general:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
