import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      profile_id,
      reviewer_name,
      reviewer_whatsapp,
      rating,
      punctuality_score,
      quality_score,
      price_score,
      comment,
    } = body;

    if (!profile_id || !reviewer_whatsapp || !rating) {
      return NextResponse.json(
        { error: 'Campos obligatorios faltantes (profile_id, whatsapp, rating)' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // 1. Insertar la reseña en provider_reviews
    const { data: reviewData, error: reviewError } = await supabase
      .from('provider_reviews')
      .insert([
        {
          profile_id,
          reviewer_name: reviewer_name || 'Vecino Verificado',
          reviewer_whatsapp,
          rating: Number(rating),
          punctuality_score: Number(punctuality_score || rating),
          quality_score: Number(quality_score || rating),
          price_score: Number(price_score || rating),
          comment: comment || '',
          is_verified_interaction: true,
        },
      ])
      .select()
      .single();

    if (reviewError) {
      console.error('Error insertando reseña:', reviewError);
      return NextResponse.json({ error: reviewError.message }, { status: 500 });
    }

    // 2. Obtener todas las reseñas para recalcular el NoraScore™ del perfil
    const { data: allReviews } = await supabase
      .from('provider_reviews')
      .select('rating')
      .eq('profile_id', profile_id);

    if (allReviews && allReviews.length > 0) {
      const totalCount = allReviews.length;
      const sum = allReviews.reduce((acc, r) => acc + (r.rating || 5), 0);
      const newNoraScore = Number((sum / totalCount).toFixed(2));

      // Determinar medalla según reglas NoraScore™
      let newBadgeLevel = 'BRONCE';
      if (totalCount >= 5 && newNoraScore >= 4.2) {
        newBadgeLevel = 'PLATA';
      }
      if (totalCount >= 10 && newNoraScore >= 4.8) {
        newBadgeLevel = 'ORO';
      }
      if (totalCount >= 25 && newNoraScore >= 4.9) {
        newBadgeLevel = 'ORGULLO_REGIONAL';
      }

      // Actualizar perfil
      await supabase
        .from('job_profiles')
        .update({
          nora_score: newNoraScore,
          total_reviews: totalCount,
          badge_level: newBadgeLevel,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile_id);

      // 3. Emitir certificado si alcanzó medalla ORO u ORGULLO_REGIONAL y no tiene uno activo
      if (newBadgeLevel === 'ORO' || newBadgeLevel === 'ORGULLO_REGIONAL') {
        const { data: existingCert } = await supabase
          .from('provider_certificates')
          .select('id')
          .eq('profile_id', profile_id)
          .maybeSingle();

        if (!existingCert) {
          const certCode = `NEX-${newBadgeLevel}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
          await supabase.from('provider_certificates').insert([
            {
              profile_id,
              certificate_code: certCode,
              badge_title: newBadgeLevel === 'ORGULLO_REGIONAL' 
                ? 'Certificado Orgullo Regional Nexativa' 
                : 'Certificado de Excelencia Comunitaria Nexativa',
              reviews_count: totalCount,
              final_score: newNoraScore,
            },
          ]);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Reseña registrada con éxito en NoraScore™',
      review: reviewData,
    });
  } catch (err: any) {
    console.error('Error en POST /api/reviews:', err);
    return NextResponse.json(
      { error: err.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
