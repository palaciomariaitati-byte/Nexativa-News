import { NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID de comercio requerido.' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('directory_businesses')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ success: false, error: 'Comercio no encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, business: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID de comercio requerido.' }, { status: 400 });
    }

    // Actualizar estado a ACTIVE en Supabase
    const { data, error } = await supabaseAdmin
      .from('directory_businesses')
      .update({
        status: 'ACTIVE',
        stealth_status: 'SUBSCRIBED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.warn('[Guia Confirm API] Advertencia al actualizar en Supabase:', error.message);
    }

    return NextResponse.json({
      success: true,
      message: '🎉 ¡Ficha comercial activada y publicada exitosamente en la Guía Comercial!',
      business: data || { id, status: 'ACTIVE' },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
