import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
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

function updateLocalStatus(id: string, status: string) {
  try {
    ensureDirectoryExists(FALLBACK_FILE);
    if (fs.existsSync(FALLBACK_FILE)) {
      const content = fs.readFileSync(FALLBACK_FILE, 'utf-8');
      const existing = JSON.parse(content) || [];
      const updated = existing.map((p: any) => {
        if (p.id === id) {
          return { ...p, status, updated_at: new Date().toISOString() };
        }
        return p;
      });
      fs.writeFileSync(FALLBACK_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('[Jobs Status API] Error en status local:', err);
  }
}

export async function POST(req: Request) {
  try {
    const { id, status } = await req.json();
    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'ID y status son requeridos' }, { status: 400 });
    }

    const cleanStatus = status === 'BUSY' ? 'BUSY' : 'ACTIVE';
    updateLocalStatus(id, cleanStatus);

    try {
      const supabase = createServerSupabaseClient();
      await supabase.from('job_profiles').update({ status: cleanStatus }).eq('id', id);
    } catch (e) {}

    return NextResponse.json({
      success: true,
      message: `¡Estado de disponibilidad actualizado a ${cleanStatus}!`,
      id,
      status: cleanStatus,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
