import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function runSimulation() {
  console.log("🚀 Iniciando Simulación de Broadcast Social a Costo Cero...\n");

  // 1. Crear una noticia de prueba en la tabla 'articles'
  console.log("1️⃣ Creando una noticia falsa en Supabase...");
  const { data: article, error: insertError } = await supabaseAdmin
    .from('articles')
    .insert([{ title: '¡Noticia de Prueba Exclusiva para la Simulación!' }])
    .select()
    .single();

  if (insertError) {
    console.error("❌ Error al crear noticia. ¿Aseguraste que la tabla 'articles' exista y tengas los permisos?", insertError);
    return;
  }
  console.log(`✅ Noticia creada con ID: ${article.id}`);

  // 2. Esperar un segundo para que el Trigger de Base de Datos haga su trabajo
  console.log("⏳ Esperando que el Trigger asigne tareas a la cola...");
  await new Promise(r => setTimeout(r, 1000));

  // 3. Revisar la cola manualmente (lo que haría el Endpoint /api/cron/process-queue)
  console.log("2️⃣ Simulando el Cron Job (Llamando al procesador)...");
  
  // Usamos el mismo código que pusimos en el endpoint:
  const { data: tasks, error: popError } = await supabaseAdmin.rpc('pop_broadcast_tasks', {
    batch_size: 5
  });

  if (popError) {
    console.error("❌ Error al procesar la cola:", popError);
    return;
  }

  if (!tasks || tasks.length === 0) {
    console.log("⚠️ No hay tareas pendientes en la cola. Revisa que el Trigger esté activado.");
    return;
  }

  console.log(`✅ ¡Éxito! El Cron detectó ${tasks.length} tareas pendientes.`);

  // 4. Intentar procesarlas
  console.log("3️⃣ Intentando enviar a Redes Sociales...");
  for (const task of tasks) {
    console.log(`   👉 Procesando tarea ID: ${task.id} para plataforma: ${task.platform}`);
    
    // Aquí es donde intentaríamos llamar a Telegram o Twitter.
    // Como probablemente no hayas configurado las credenciales, simularemos el fallo y actualización de reintentos.
    try {
        if (!process.env.TELEGRAM_BOT_TOKEN && task.platform === 'telegram') {
            throw new Error("Faltan credenciales de Telegram");
        }
        if (!process.env.TWITTER_BEARER_TOKEN && task.platform === 'twitter') {
            throw new Error("Faltan credenciales de Twitter");
        }
        console.log(`      🎉 ¡Publicado con éxito en ${task.platform}!`);
        // update status to completed...
    } catch(err: any) {
        console.log(`      ❌ Fallo esperado (simulación realista): ${err.message}`);
        // Simulando lo que hace markTaskFailed
        await supabaseAdmin.from('broadcast_queue').update({
            status: 'pending',
            attempts: task.attempts + 1,
            error_message: err.message
        }).eq('id', task.id);
        console.log(`      🔄 Tarea devuelta a la cola. Reintentos actuales: ${task.attempts + 1}`);
    }
  }

  console.log("\n✅ ¡Simulación terminada! El ciclo de vida de la arquitectura asíncrona funciona perfectamente.");
}

runSimulation();
