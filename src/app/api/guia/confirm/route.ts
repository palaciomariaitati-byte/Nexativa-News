import { NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabase/admin';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const FALLBACK_DIRECTORY_FILE = path.join(process.cwd(), 'data', 'directory_businesses_local.json');

function ensureDir(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readLocalDirectory(): any[] {
  try {
    ensureDir(FALLBACK_DIRECTORY_FILE);
    if (fs.existsSync(FALLBACK_DIRECTORY_FILE)) {
      const content = fs.readFileSync(FALLBACK_DIRECTORY_FILE, 'utf-8');
      return JSON.parse(content) || [];
    }
  } catch (err) {}
  return [];
}

function saveLocalBusiness(business: any) {
  try {
    ensureDir(FALLBACK_DIRECTORY_FILE);
    const list = readLocalDirectory();
    const filtered = list.filter((b) => b.id !== business.id);
    const updated = [business, ...filtered];
    fs.writeFileSync(FALLBACK_DIRECTORY_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (err) {}
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID de comercio requerido.' }, { status: 400 });
    }

    try {
      const { data, error } = await supabaseAdmin
        .from('directory_businesses')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        return NextResponse.json({ success: true, business: data });
      }
    } catch (dbErr) {}

    const localList = readLocalDirectory();
    const foundLocal = localList.find((b) => b.id === id);
    if (foundLocal) {
      return NextResponse.json({ success: true, business: foundLocal });
    }

    return NextResponse.json({ success: false, error: 'Comercio no encontrado.' }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      id,
      name,
      category,
      description,
      featured_offer, // Plato del día / Promo de la semana agregada por el cliente
      address,
      whatsapp,
      phone,
      email,
      website,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID de comercio requerido.' }, { status: 400 });
    }

    const updateFields: any = {
      status: 'ACTIVE',
      stealth_status: 'SUBSCRIBED',
      updated_at: new Date().toISOString(),
    };

    if (name) updateFields.name = name.trim();
    if (category) updateFields.category = category.trim();
    if (description) updateFields.description = description.trim();
    if (featured_offer) updateFields.featured_offer = featured_offer.trim();
    if (address) updateFields.address = address.trim();
    if (whatsapp) updateFields.whatsapp = whatsapp.trim();
    if (phone) updateFields.phone = phone.trim();
    if (email) updateFields.email = email.trim();
    if (website) updateFields.website = website.trim();

    let finalBusiness = { id, ...updateFields };

    try {
      const { data, error } = await supabaseAdmin
        .from('directory_businesses')
        .update(updateFields)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        finalBusiness = data;
      }
    } catch (supaErr) {}

    // Guardar en fallback local y actualizar la lista de socios CRM local
    saveLocalBusiness(finalBusiness);

    return NextResponse.json({
      success: true,
      message: '🎉 ¡Ficha comercial y ofertas actualizadas exitosamente!',
      business: finalBusiness,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
