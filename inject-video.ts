import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Limpiando cola de videos actual...");
  // Limpiar para asegurar que el nuestro quede de primero y evitemos URLs rotas
  await supabaseAdmin.from('video_queue').delete().neq('position', -1);

  console.log("Inyectando video de prueba...");
  const { error } = await supabaseAdmin.from('video_queue').insert([
    {
      title: '🔴 Transmisión Oficial - Nexativa News',
      video_url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk', // Lofi Girl 24/7 stream (siempre en vivo)
      status: 'playing',
      position: 0,
      type: 'youtube'
    }
  ]);

  if (error) {
    console.error("Error inyectando el video:", error);
  } else {
    console.log("✅ Video inyectado exitosamente! El reproductor debería captarlo inmediatamente gracias al WebSocket (Realtime).");
  }
}

run();
