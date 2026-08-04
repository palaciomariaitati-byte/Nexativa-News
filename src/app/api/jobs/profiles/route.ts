import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import supabaseAdmin from '@/lib/supabase/admin';
import { sendWhatsAppNotification } from '@/lib/services/whatsapp';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

// Archivo local de persistencia fallback en caso de que la tabla de Supabase no exista aún
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
    // Evitar duplicados por id o whatsapp+full_name
    const filtered = existing.filter((p: any) => p.id !== profile.id && p.whatsapp !== profile.whatsapp);
    const updated = [profile, ...filtered];
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    console.log('[Jobs Profiles API] ✅ Perfil guardado exitosamente en archivo local fallback.');
  } catch (err) {
    console.error('[Jobs Profiles API] Error escribiendo fallback local:', err);
  }
}

// 1. GET: Obtener la lista completa de postulantes / trabajadores (BD + Fallback Local)
export async function GET() {
  try {
    let dbProfiles: any[] = [];
    const supabase = createServerSupabaseClient();
    
    try {
      const { data, error } = await supabase
        .from('job_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        dbProfiles = data;
      }
    } catch (dbErr: any) {
      console.warn('[Jobs Profiles API GET] Consulta a Supabase no disponible:', dbErr.message);
    }

    const localProfiles = readLocalProfiles();
    
    // Combinar sin duplicados
    const dbIds = new Set(dbProfiles.map((p) => p.id));
    const uniqueLocal = localProfiles.filter((lp) => !dbIds.has(lp.id));
    const combined = [...dbProfiles, ...uniqueLocal];

    return NextResponse.json({
      success: true,
      profiles: combined,
      source: dbProfiles.length > 0 ? 'supabase_and_local' : 'local_fallback',
    });
  } catch (err: any) {
    console.error('[Jobs Profiles API GET] Error crítico:', err);
    return NextResponse.json({ success: true, profiles: readLocalProfiles() });
  }
}

// 2. POST: Registrar un nuevo postulante u oficio
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

    const newProfileData = {
      id: `job-prof-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      full_name: full_name.trim(),
      trade_category: trade_category.trim(),
      city: city.trim(),
      province: province.trim(),
      whatsapp: cleanWhatsapp,
      email: email ? email.trim() : null,
      bio: bio ? bio.trim() : '',
      nora_score: 5.00,
      total_reviews: 0,
      badge_level: 'BRONCE',
      is_verified: true,
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // A. Guardar en persisencia local fallback de inmediato
    saveLocalProfile(newProfileData);

    // B. Intentar inserción en Supabase (si la tabla existe)
    let dbSuccess = false;
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
          nora_score: newProfileData.nora_score,
          total_reviews: newProfileData.total_reviews,
          badge_level: newProfileData.badge_level,
          is_verified: newProfileData.is_verified,
          status: newProfileData.status,
        }])
        .select()
        .single();

      if (!dbError && inserted) {
        newProfileData.id = inserted.id;
        dbSuccess = true;
        saveLocalProfile(newProfileData); // actualizar con ID real de Supabase
      } else if (dbError) {
        console.warn('[Jobs Profiles API POST] Supabase advierte (usando copia persistente local):', dbError.message);
      }
    } catch (supaErr: any) {
      console.warn('[Jobs Profiles API POST] Error al conectar con Supabase:', supaErr.message);
    }

    // C. Generar e Invocación Automática del Servicio de WhatsApp
    const noraGreetingMessage = `¡Hola, ${full_name}! 👋 Soy Nora, tu asistente inteligente de Nexativa Empleos & Oficios.

Te doy la bienvenida a nuestra red en ${city}, ${province}. Tu perfil en el rubro *${trade_category}* ha sido registrado y activado exitosamente.

📱 *Tu Panel Móvil de Prestador está disponible:*
Ingresá al siguiente enlace para gestionar tu disponibilidad en vivo y mostrar tu Código QR de calificación instantánea:
👉 ${mobilePanelUrl}

¡Éxitos en tus próximos trabajos comunitarios! 🚀`;

    const encodedText = encodeURIComponent(noraGreetingMessage);
    const waLink = `https://wa.me/${cleanWhatsapp}?text=${encodedText}`;

    // Disparar envío automático vía servicio de WhatsApp (Webhook / Callmebot / Alerta Interna)
    let waDispatched = false;
    try {
      const waRes = await sendWhatsAppNotification({
        senderName: `Postulante: ${full_name} (${trade_category})`,
        senderType: "corresponsal",
        location: `${city}, ${province}`,
        excerpt: noraGreetingMessage,
      });
      waDispatched = waRes.success;
    } catch (waErr) {
      console.warn('[Jobs Profiles API POST] No se pudo despachar WhatsApp automático:', waErr);
    }

    return NextResponse.json({
      success: true,
      message: '¡Perfil de postulante registrado y guardado correctamente!',
      dbSaved: dbSuccess,
      profile: newProfileData,
      noraGreeting: noraGreetingMessage,
      waLink,
      mobilePanelUrl,
      waDispatched,
    });
  } catch (err: any) {
    console.error('[Jobs Profiles API POST] Error crítico:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Error interno del servidor.' },
      { status: 500 }
    );
  }
}
