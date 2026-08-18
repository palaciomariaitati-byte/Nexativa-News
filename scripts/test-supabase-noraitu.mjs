import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

function loadEnv(file) {
  if (!fs.existsSync(file)) return {};
  const content = fs.readFileSync(file, 'utf-8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const k = trimmed.slice(0, eq).trim();
    let v = trimmed.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[k] = v;
  }
  return env;
}

const env = { ...loadEnv('.env.local'), ...loadEnv('.env.production'), ...process.env };

async function testSupabaseMutations() {
  console.log("=== 1. VERIFICANDO CONEXIÓN Y MUTACIONES EN SUPABASE ===");
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log("Supabase URL:", url);
  console.log("Service/Anon Key Present:", !!serviceKey);

  const supabase = createClient(url, serviceKey);

  // Test 1: noraitu_sessions insert
  const testUserId = "test_user_" + Date.now();
  console.log("\nProbando INSERT en 'noraitu_sessions'...");
  const { data: sessionData, error: sessErr } = await supabase
    .from("noraitu_sessions")
    .insert([{ user_id: testUserId, title: "Test Diag Session" }])
    .select("id, user_id, title")
    .single();

  if (sessErr) {
    console.error("❌ ERROR INSERT noraitu_sessions:", sessErr);
  } else {
    console.log("✓ SUCCESS INSERT noraitu_sessions, Session ID:", sessionData.id);
  }

  // Test 2: noraitu_messages insert
  if (sessionData?.id) {
    console.log("\nProbando INSERT en 'noraitu_messages'...");
    const { data: msgData, error: msgErr } = await supabase
      .from("noraitu_messages")
      .insert([
        { session_id: sessionData.id, role: "user", content: "Mensaje de prueba diagnóstico", metadata: { test: true } },
        { session_id: sessionData.id, role: "assistant", content: "Respuesta de prueba diagnóstico", metadata: { generated_by: "DiagScript" } }
      ])
      .select("id, role, content");

    if (msgErr) {
      console.error("❌ ERROR INSERT noraitu_messages:", msgErr);
    } else {
      console.log("✓ SUCCESS INSERT noraitu_messages:", msgData?.length, "mensajes insertados.");
    }

    // Cleanup test data
    await supabase.from("noraitu_messages").delete().eq("session_id", sessionData.id);
    await supabase.from("noraitu_sessions").delete().eq("id", sessionData.id);
    console.log("✓ Limpieza de datos de prueba completada.");
  }
}

testSupabaseMutations();
