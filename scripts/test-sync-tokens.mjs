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

async function testSyncTokensTable() {
  console.log("=== TEST SUPABASE noraitu_sync_tokens TABLE ===");
  const url = env.NEXT_PUBLIC_SUPABASE_URL || 'https://xeheuscrttrbfnojwwqt.supabase.co';
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = createClient(url, key);

  const testPin = "998877";
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  // Test insert
  console.log("1. Insertando token de prueba...");
  const { data: insertData, error: insertErr } = await supabase
    .from("noraitu_sync_tokens")
    .insert([{
      desktop_socket_id: `desktop_test_PIN_${testPin}`,
      status: "PENDING",
      expires_at: expiresAt
    }])
    .select("token_id, expires_at, desktop_socket_id")
    .single();

  if (insertErr) {
    console.error("❌ ERROR INSERT noraitu_sync_tokens:", insertErr);
    return;
  }
  console.log("✓ INSERT exitoso, Token ID:", insertData.token_id);

  // Test lookup by PIN
  console.log("2. Buscando token por PIN:", testPin);
  const { data: lookupData, error: lookupErr } = await supabase
    .from("noraitu_sync_tokens")
    .select("token_id, desktop_socket_id, status")
    .ilike("desktop_socket_id", `%PIN_${testPin}%`)
    .single();

  if (lookupErr) {
    console.error("❌ ERROR LOOKUP por PIN:", lookupErr);
  } else {
    console.log("✓ LOOKUP exitoso:", lookupData);
  }

  // Test update (authorization)
  console.log("3. Probando UPDATE (autorización desde móvil)...");
  const { data: updateData, error: updateErr } = await supabase
    .from("noraitu_sync_tokens")
    .update({ user_id: "user_mobile_test", status: "AUTHORIZED" })
    .eq("token_id", insertData.token_id)
    .select("token_id, status, user_id");

  if (updateErr) {
    console.error("❌ ERROR UPDATE:", updateErr);
  } else {
    console.log("✓ UPDATE exitoso:", updateData);
  }

  // Cleanup
  await supabase.from("noraitu_sync_tokens").delete().eq("token_id", insertData.token_id);
  console.log("✓ Limpieza completada.");
}

testSyncTokensTable();
