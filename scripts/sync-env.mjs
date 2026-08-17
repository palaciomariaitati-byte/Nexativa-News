import fs from 'fs';
import { execSync } from 'child_process';

async function main() {
  const envFile = fs.existsSync('.env.production') ? '.env.production' : '.env.local';
  console.log(`Reading variables from ${envFile}...`);
  const content = fs.readFileSync(envFile, 'utf-8');
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;

    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();

    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }

    if (key && val) {
      console.log(`Adding ${key} to production,preview...`);
      try {
        // Escaping for command line execution
        execSync(`npx vercel env add ${key} production,preview --value "${val.replace(/"/g, '\\"')}" --force --yes`, {
          stdio: 'inherit',
          shell: true
        });
        console.log(`✓ ${key} added successfully.`);
      } catch (err) {
        console.warn(`! Warning on ${key}: ${err.message}`);
      }
    }
  }

  // Also check if .env.local has additional keys like GROQ_API_KEY if not in .env.production
  if (fs.existsSync('.env.local')) {
    const localContent = fs.readFileSync('.env.local', 'utf-8');
    const localLines = localContent.split('\n');
    for (const line of localLines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;

      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();

      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }

      if (key && val && (key.includes('GROQ') || key.includes('SUPABASE') || key.includes('GEMINI'))) {
        try {
          execSync(`npx vercel env add ${key} production,preview --value "${val.replace(/"/g, '\\"')}" --force --yes`, {
            stdio: 'inherit',
            shell: true
          });
        } catch (e) {}
      }
    }
  }

  console.log('Finished syncing environment variables!');
}

main();
