import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const OFFERS_FILE = path.join(process.cwd(), 'data', 'job_offers_local.json');

function ensureDirectoryExists(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readLocalOffers(): any[] {
  try {
    ensureDirectoryExists(OFFERS_FILE);
    if (fs.existsSync(OFFERS_FILE)) {
      const content = fs.readFileSync(OFFERS_FILE, 'utf-8');
      return JSON.parse(content) || [];
    }
  } catch (err) {}
  return [];
}

function saveLocalOffer(offer: any) {
  try {
    ensureDirectoryExists(OFFERS_FILE);
    const existing = readLocalOffers();
    const filtered = existing.filter((o: any) => o.id !== offer.id);
    const updated = [offer, ...filtered];
    fs.writeFileSync(OFFERS_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (err) {}
}

function deleteLocalOffer(id: string) {
  try {
    ensureDirectoryExists(OFFERS_FILE);
    const existing = readLocalOffers();
    const filtered = existing.filter((o: any) => o.id !== id);
    fs.writeFileSync(OFFERS_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
  } catch (err) {}
}

export async function GET() {
  try {
    let dbOffers: any[] = [];
    try {
      const supabase = createServerSupabaseClient();
      const { data, error } = await supabase
        .from('job_offers')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        dbOffers = data;
      }
    } catch (e) {}

    const localOffers = readLocalOffers();
    const dbIds = new Set(dbOffers.map(o => o.id));
    const uniqueLocal = localOffers.filter(lo => !dbIds.has(lo.id));
    const combined = [...dbOffers, ...uniqueLocal];

    return NextResponse.json({
      success: true,
      offers: combined,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, category, description, employer_name, whatsapp, location } = body;

    if (!title || !whatsapp) {
      return NextResponse.json({ success: false, error: 'Título y WhatsApp son requeridos' }, { status: 400 });
    }

    const newOffer = {
      id: `OFFER-${Date.now()}`,
      title: title.trim(),
      category: category || 'General',
      description: description || 'Búsqueda laboral activa en Ituzaingó.',
      employer_name: employer_name || 'Comercio / Empleador Local',
      whatsapp: whatsapp.trim(),
      location: location || 'Ituzaingó, Corrientes',
      status: 'OPEN',
      created_at: new Date().toISOString(),
    };

    saveLocalOffer(newOffer);

    try {
      const supabase = createServerSupabaseClient();
      await supabase.from('job_offers').insert([newOffer]);
    } catch (e) {}

    return NextResponse.json({
      success: true,
      message: '¡Búsqueda laboral publicada exitosamente!',
      offer: newOffer,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ success: false, error: 'ID es requerido' }, { status: 400 });

    deleteLocalOffer(id);

    try {
      const supabase = createServerSupabaseClient();
      await supabase.from('job_offers').delete().eq('id', id);
    } catch (e) {}

    return NextResponse.json({ success: true, message: 'Búsqueda laboral eliminada' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
