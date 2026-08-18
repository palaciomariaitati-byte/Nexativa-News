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

async function testStreaming() {
  const groqKey = env.GROQ_API_KEY;
  console.log("Testing Groq streaming parser...");
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${groqKey.trim()}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: "Arma una planificación sobre el agua en Corrientes" }],
      stream: true,
      max_tokens: 500
    })
  });

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("data: ")) {
        const dataContent = trimmed.slice(6).trim();
        if (dataContent === "[DONE]") break;
        try {
          const parsed = JSON.parse(dataContent);
          const deltaText = parsed.choices?.[0]?.delta?.content;
          if (deltaText) {
            fullText += deltaText;
            process.stdout.write(deltaText);
          }
        } catch (e) {}
      }
    }
  }

  console.log("\n\n✓ Streaming test successful! Total chars received:", fullText.length);
}

testStreaming();
