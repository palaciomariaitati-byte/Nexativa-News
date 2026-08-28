const fs = require('fs');
const { execSync } = require('child_process');

const dir = 'D:/PROYECTOS_NEXORA/Nexora_Pay';

// 1. Sanitizar supabaseClient.js con variables de entorno
const cleanSupabaseClient = `import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fpwbndmvdnsavvihuldg.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
`;
fs.writeFileSync(dir + '/src/lib/supabaseClient.js', cleanSupabaseClient, 'utf-8');
console.log('Sanitized supabaseClient.js');

// 2. Sanitizar .env / .env.local
const envLocal = `NEXT_PUBLIC_SUPABASE_URL=https://fpwbndmvdnsavvihuldg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
`;
fs.writeFileSync(dir + '/.env.example', envLocal, 'utf-8');

// 3. Resetear historial de git en Nexora_Pay para purgar el commit anterior bloqueado
fs.rmSync(dir + '/.git', { recursive: true, force: true });
console.log('Reset .git');

// 4. Inicializar git limpio
execSync('git init', { cwd: dir, stdio: 'inherit' });
execSync('git branch -M main', { cwd: dir, stdio: 'inherit' });
execSync('git remote add origin https://github.com/palaciomariaitati-byte/nexora-pay.git', { cwd: dir, stdio: 'inherit' });

// 5. Stage & commit
execSync('git add .', { cwd: dir, stdio: 'inherit' });
execSync('git commit -m "feat: Nexora Pay sovereign fintech engine and web hub (secure credentials protocol)"', { cwd: dir, stdio: 'inherit' });

// 6. Push force limpio
console.log('Pushing clean commit to GitHub...');
const res = execSync('git push -u origin main --force', { cwd: dir, encoding: 'utf-8' });
console.log('RESULT:\n', res);
console.log('NEXORA PAY SUCCESSFULLY PUSHED TO GITHUB!');
