import fs from 'fs';

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

async function testGroqWhisper() {
  console.log("Checking Groq Audio transcription API...");
  const groqKey = env.GROQ_API_KEY;
  if (!groqKey) {
    console.error("No GROQ_API_KEY found");
    return;
  }

  // Create a minimal 1-second dummy WAV audio buffer in memory to test the endpoint
  const wavHeader = Buffer.from([
    0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45,
    0x66, 0x6d, 0x74, 0x20, 0x10, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
    0x44, 0xac, 0x00, 0x00, 0x88, 0x58, 0x01, 0x00, 0x02, 0x00, 0x10, 0x00,
    0x64, 0x61, 0x74, 0x61, 0x00, 0x00, 0x00, 0x00
  ]);

  const formData = new FormData();
  const blob = new Blob([wavHeader], { type: "audio/wav" });
  formData.append("file", blob, "audio.wav");
  formData.append("model", "whisper-large-v3-turbo");
  formData.append("language", "es");

  try {
    const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqKey.trim()}`
      },
      body: formData
    });

    const data = await res.json();
    console.log("Whisper status:", res.status, data);
  } catch (err) {
    console.error("Whisper error:", err);
  }
}

testGroqWhisper();
