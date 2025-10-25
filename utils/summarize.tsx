// summarizeWithFlask.ts

export async function summarizeWithFlask(reflection: string) {
  const base = 'https://levelup-1-yvv6.onrender.com'
  const res = await fetch(`${base}/summarize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reflection }),
  });
  if (!res.ok) throw new Error(`Summarize failed: ${res.status}`);
  return (await res.json()) as {
    summary: string; emotion: string; polarity: number; subjectivity: number; keywords: string[];
  };
}