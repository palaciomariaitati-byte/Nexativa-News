const url = "https://xeheuscrttrbfnojwwqt.supabase.co/rest/v1/settings?id=eq.1";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlaGV1c2NydHRyYmZub2p3d3F0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDcxNjU3MiwiZXhwIjoyMDk2MjkyNTcyfQ.55UUU1WmZp18AzaCmn2pjKP27u52zzzpt9an0TB3AjI";

async function run() {
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ make_webhook_url: "https://hook.eu1.make.com/21h60fjqkaric241h5u3ebk1pu37ybu7" })
  });

  if (res.ok) {
    console.log("Exito!");
  } else {
    console.error("Error:", await res.text());
  }
}
run();
