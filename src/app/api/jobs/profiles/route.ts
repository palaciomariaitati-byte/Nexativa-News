import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import supabaseAdmin from '@/lib/supabase/admin';
import { sendWhatsAppNotification } from '@/lib/services/whatsapp';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const FALLBACK_FILE = path.join(process.cwd(), 'data', 'job_profiles_local.json');

function ensureDirectoryExists(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readLocalProfiles(): any[] {
  try {
    ensureDirectoryExists(FALLBACK_FILE);
    if (fs.existsSync(FALLBACK_FILE)) {
      const content = fs.readFileSync(FALLBACK_FILE, 'utf-8');
      return JSON.parse(content) || [];
    }
  } catch (err) {
    console.warn('[Jobs Profiles API] Error leyendo fallback local:', err);
  }
  return [];
}

function saveLocalProfile(profile: any) {
  try {
    ensureDirectoryExists(FALLBACK_FILE);
    const existing = readLocalProfiles();
    const filtered = existing.filter((p: any) => p.id !== profile.id && p.whatsapp !== profile.whatsapp);
    const updated = [profile, ...filtered];
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Jobs Profiles API] Error escribiendo fallback local:', err);
  }
}

function deleteLocalProfile(id: string) {
  try {
    ensureDirectoryExists(FALLBACK_FILE);
    const existing = readLocalProfiles();
    const filtered = existing.filter((p: any) => p.id !== id);
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Jobs Profiles API] Error eliminando fallback local:', err);
  }
}

// 1. GET: Obtener lista completa de trabajadores
export async function GET() {
  try {
    let dbProfiles: any[] = [];
    
    try {
      const { data, error } = await supabaseAdmin
        .from('job_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        dbProfiles = data;
      } else if (error) {
        console.error('[Jobs Profiles API GET] Error cargando perfiles:', error);
      }
    } catch (dbErr: any) {
      console.error('[Jobs Profiles API GET] Catch dbErr:', dbErr);
    }

    const localProfiles = readLocalProfiles();
    const dbIds = new Set(dbProfiles.map((p) => p.id));
    const uniqueLocal = localProfiles.filter((lp) => !dbIds.has(lp.id));
    const combined = [...dbProfiles, ...uniqueLocal];

    return NextResponse.json({
      success: true,
      profiles: combined,
    });
  } catch (err: any) {
    return NextResponse.json({ success: true, profiles: readLocalProfiles() });
  }
}

// 2. POST: Registrar nuevo postulante
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      full_name,
      trade_category,
      city = 'Ituzaingó',
      province = 'Corrientes',
      whatsapp,
      bio,
      email,
      cv_url,
      cv_filename,
    } = body;

    if (!full_name || !trade_category || !whatsapp) {
      return NextResponse.json(
        { success: false, error: 'Nombre completo, rubro/oficio y WhatsApp son campos obligatorios.' },
        { status: 400 }
      );
    }

    const cleanWhatsapp = whatsapp.replace(/\D/g, '');
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.nexativanews.com.ar';
    const mobilePanelUrl = `${baseUrl}/prestadores`;

    const newProfileData: any = {
      id: `temp-${Date.now()}`,
      full_name: full_name.trim(),
      trade_category: trade_category.trim(),
      city: city.trim(),
      province: province.trim(),
      whatsapp: cleanWhatsapp,
      email: email ? email.trim() : null,
      bio: bio ? bio.trim() : '',
      cv_url: cv_url || null,
      cv_filename: cv_filename || null,
      nora_score: 5.00,
      total_reviews: 0,
      badge_level: 'BRONCE',
      is_verified: true,
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    saveLocalProfile(newProfileData);

    try {
      const { data: inserted, error: dbError } = await supabaseAdmin
        .from('job_profiles')
        .insert([{
          full_name: newProfileData.full_name,
          trade_category: newProfileData.trade_category,
          city: newProfileData.city,
          province: newProfileData.province,
          whatsapp: newProfileData.whatsapp,
          email: newProfileData.email,
          bio: newProfileData.bio,
          cv_url: newProfileData.cv_url,
          nora_score: newProfileData.nora_score,
          total_reviews: newProfileData.total_reviews,
          badge_level: newProfileData.badge_level,
          is_verified: newProfileData.is_verified,
          status: newProfileData.status,
        }])
        .select()
        .single();

      if (dbError) {
        console.error('[Jobs Profiles API POST] Error insertando en Supabase:', dbError);
      } else if (inserted) {
        newProfileData.id = inserted.id;
        saveLocalProfile(newProfileData);
      }
    } catch (supaErr: any) {
      console.error('[Jobs Profiles API POST] Supabase catch error:', supaErr);
    }

    const noraGreetingMessage = `¡Hola, ${full_name}! 👋 Te damos la bienvenida a Nexativa Empleos & Oficios en ${city}. Tu perfil en el rubro *${trade_category}* ya se encuentra activo.\n\n📱 Podés gestionar tus servicios y mostrar tu QR de reputación en tu Panel Móvil aquí:\n👉 ${mobilePanelUrl}`;
    const waLink = `https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(noraGreetingMessage)}`;

    try {
      await sendWhatsAppNotification({
        senderName: `Postulante: ${full_name} (${trade_category})`,
        senderType: "corresponsal",
        location: `${city}, ${province}`,
        excerpt: noraGreetingMessage,
      });
    } catch (waErr) {}

    return NextResponse.json({
      success: true,
      message: '¡Perfil registrado y activado correctamente!',
      profile: newProfileData,
      noraGreeting: noraGreetingMessage,
      waLink,
      mobilePanelUrl,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// 3. DELETE: Eliminar postulante u oficio
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ success: false, error: 'ID es requerido' }, { status: 400 });

    deleteLocalProfile(id);

    try {
      const supabase = createServerSupabaseClient();
      await supabase.from('job_profiles').delete().eq('id', id);
    } catch (e) {}

    return NextResponse.json({ success: true, message: '¡Trabajador eliminado exitosamente!' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
