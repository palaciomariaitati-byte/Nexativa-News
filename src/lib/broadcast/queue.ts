import supabaseAdmin from '../supabase/admin';

export type BroadcastPlatform = 'telegram' | 'twitter';
export type BroadcastStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface BroadcastTask {
  id: string;
  article_id: string;
  platform: BroadcastPlatform;
  status: BroadcastStatus;
  attempts: number;
  max_attempts: number;
  error_message: string | null;
  created_at: string;
}

export interface BroadcastTaskWithArticle extends BroadcastTask {
  article: {
    id: string;
    title: string;
    // Agregaremos más campos según el schema de articles (description, image_url, etc)
  };
}

/**
 * Obtiene las siguientes tareas pendientes usando FOR UPDATE SKIP LOCKED
 * asegurando concurrencia sin condiciones de carrera.
 */
export async function popBroadcastTasks(batchSize: number = 5): Promise<BroadcastTaskWithArticle[]> {
  // 1. Obtener tareas bloqueadas
  const { data: tasks, error } = await supabaseAdmin.rpc('pop_broadcast_tasks', {
    batch_size: batchSize
  });

  if (error || !tasks || tasks.length === 0) {
    if (error) console.error('Error popping broadcast tasks:', error);
    return [];
  }

  // 2. Obtener los artículos relacionados para tener el contenido a publicar
  const articleIds = tasks.map((t: BroadcastTask) => t.article_id);
  const { data: articles, error: articlesError } = await supabaseAdmin
    .from('articles')
    .select('id, title')
    .in('id', articleIds);

  if (articlesError || !articles) {
    console.error('Error fetching articles for broadcast tasks:', articlesError);
    return [];
  }

  // 3. Mapear y devolver
  return tasks.map((task: BroadcastTask) => ({
    ...task,
    article: articles.find(a => a.id === task.article_id)
  })).filter(t => t.article) as BroadcastTaskWithArticle[];
}

export async function markTaskCompleted(taskId: string) {
  await supabaseAdmin
    .from('broadcast_queue')
    .update({ 
      status: 'completed', 
      processed_at: new Date().toISOString() 
    })
    .eq('id', taskId);
}

export async function markTaskFailed(taskId: string, attempts: number, maxAttempts: number, errorMessage: string) {
  const newAttempts = attempts + 1;
  const isFinalFailure = newAttempts >= maxAttempts;
  
  await supabaseAdmin
    .from('broadcast_queue')
    .update({ 
      status: isFinalFailure ? 'failed' : 'pending', 
      attempts: newAttempts,
      error_message: errorMessage
    })
    .eq('id', taskId);
}
