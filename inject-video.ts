import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Limpiando cola de videos actual...");
  await supabaseAdmin.from('video_queue').delete().neq('position', -1);

  console.log("Inyectando video crudo (Big Buck Bunny MP4)...");
  const { error } = await supabaseAdmin.from('video_queue').insert([
    {
      title: 'Transmisión Oficial (Archivo Nativo)',
      video_url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      status: 'playing',
      position: 0,
      type: 'custom'
    }
  ]);

  if (error) {
    console.error("Error inyectando:", error);
  } else {
    console.log("✅ MP4 inyectado exitosamente.");
  }
}

run();
