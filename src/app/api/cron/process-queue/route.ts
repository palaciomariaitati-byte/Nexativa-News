import { NextRequest, NextResponse } from 'next/server';
import { popBroadcastTasks, markTaskCompleted, markTaskFailed } from '@/lib/broadcast/queue';
import { broadcastToTelegram } from '@/lib/broadcast/providers/telegram';
import { broadcastToTwitter } from '@/lib/broadcast/providers/twitter';

export const maxDuration = 30; // Vercel hobby limits
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Proteger el endpoint con un token secreto (Basic Auth o Header)
  const authHeader = req.headers.get('authorization');
  const CRON_SECRET = process.env.CRON_SECRET;

  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // 1. Extraer 5 tareas bloqueándolas
    const tasks = await popBroadcastTasks(5);

    if (tasks.length === 0) {
      return NextResponse.json({ message: 'No pending tasks in queue' });
    }

    const results = [];

    // 2. Procesarlas en paralelo (o secuencial si hay límites de rate de APIs muy estrictos)
    for (const task of tasks) {
      try {
        if (task.platform === 'telegram') {
          await broadcastToTelegram(task);
        } else if (task.platform === 'twitter') {
          await broadcastToTwitter(task);
        }

        // Si todo sale bien
        await markTaskCompleted(task.id);
        results.push({ id: task.id, status: 'completed' });
      } catch (error: any) {
        // En caso de fallo
        const errorMessage = error.message || 'Unknown error';
        await markTaskFailed(task.id, task.attempts, task.max_attempts, errorMessage);
        results.push({ id: task.id, status: 'failed', error: errorMessage });
      }
    }

    return NextResponse.json({ 
      message: `Processed ${tasks.length} tasks`,
      results 
    });
  } catch (err: any) {
    console.error('Fatal error in queue processor:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
