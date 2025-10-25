// summarizeWithFlask.ts
import { Platform } from "react-native";

export async function summarizeWithFlask(reflection: string) {
  const base =
    Platform.OS === "android" ? "http://10.0.2.2:8000" : "http://127.0.0.1:8000";
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