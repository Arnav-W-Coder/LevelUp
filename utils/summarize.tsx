// summarizeWithFlask.ts
export async function summarizeWithFlask(reflection: string) {
  const res = await fetch("https://YOUR_BACKEND_DOMAIN/summarize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reflection }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Summarize failed: ${res.status} ${t}`);
  }
  // { summary, emotion, polarity, subjectivity, keywords }
  return await res.json();
}
