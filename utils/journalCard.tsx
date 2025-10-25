import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

// ---------- Small date helpers (local time, no UTC math) ----------
const localYMD = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// ---------- Storage keys ----------
const JOURNAL_INDEX_KEY = 'levelup_journal_index'; // list of {date}
const JOURNAL_FOR = (ymd: string) => `levelup_journal:${ymd}`; // {entries: [...]}

type JournalEntry = {
  id: string;
  text: string;
  summary: string;
  emotion: string;        // e.g., 'Motivated', 'Calm', 'Stressed', etc.
  createdAt: number;      // ms
};

// ---------- Optional AI: supply your own summarize function via props ----------
type Props = {
  /**
   * Optional: pass your own async summarizer(reflection) => { summary, emotion }
   * If not provided, a local keyword-based summarizer will be used.
   */
  summarize?: (reflection: string) => Promise<{ summary: string; emotion: string }>;
  /**
   * Optional: XP hook — if provided, we’ll call it once per saved entry
   * e.g. () => addXp(2, 0) or changeStreak(1)
   */
  onJournalSaved?: () => void;
  /**
   * Optional: show the latest N entries (default 3)
   */
  showLastN?: number;
};

export default function JournalCard({ summarize, onJournalSaved, showLastN = 3 }: Props) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [todayEntries, setTodayEntries] = useState<JournalEntry[]>([]);
  const [recentDates, setRecentDates] = useState<string[]>([]);

  const today = useMemo(() => localYMD(), []);

  // ---------- Local fallback summarizer ----------
  const localSummarize = async (reflection: string) => {
    // Tiny heuristic sentiment & tagger
    const r = reflection.toLowerCase();
    const positive = ['proud', 'happy', 'glad', 'confident', 'excited', 'motivated', 'focused', 'calm', 'relieved'];
    const negative = ['tired', 'sad', 'stressed', 'anxious', 'angry', 'frustrated', 'overwhelmed', 'worried'];
    const posHits = positive.filter((w) => r.includes(w)).length;
    const negHits = negative.filter((w) => r.includes(w)).length;

    let emotion = 'Neutral';
    if (posHits > negHits) emotion = 'Motivated';
    else if (negHits > posHits) emotion = 'Stressed';

    // Short positive-leaning summary
    const trimmed = reflection.trim().replace(/\s+/g, ' ');
    const base = trimmed.length > 0 ? trimmed : 'No details provided.';
    const summary =
      emotion === 'Motivated'
        ? 'You’re building momentum—keep going.'
        : emotion === 'Stressed'
        ? 'You showed up despite resistance—small wins matter.'
        : 'Noted your state—consistency compounds.';

    // If user wrote a clear sentence, echo a concise version
    const firstClause = base.length > 120 ? base.slice(0, 120) + '…' : base;
    return { summary: `${summary}`, emotion };
  };

  // ---------- Load today + recent index on mount/focus ----------
  useEffect(() => {
    (async () => {
      try {
        const [idxRaw, todayRaw] = await Promise.all([
          AsyncStorage.getItem(JOURNAL_INDEX_KEY),
          AsyncStorage.getItem(JOURNAL_FOR(today)),
        ]);
        if (idxRaw) {
          const idx: string[] = JSON.parse(idxRaw);
          setRecentDates(idx.slice(-7)); // keep last 7 dates around for future UI
        }
        if (todayRaw) {
          const obj = JSON.parse(todayRaw);
          setTodayEntries(Array.isArray(obj?.entries) ? obj.entries : []);
        }
      } catch {
        // no-op
      }
    })();
  }, [today]);

  // ---------- Save entry ----------
  const saveEntry = async (entry: JournalEntry) => {
    const key = JOURNAL_FOR(today);
    const raw = await AsyncStorage.getItem(key);
    let entries: JournalEntry[] = [];
    if (raw) {
      const obj = JSON.parse(raw);
      entries = Array.isArray(obj?.entries) ? obj.entries : [];
    }
    const next = [entry, ...entries]; // newest first
    await AsyncStorage.setItem(key, JSON.stringify({ entries: next }));
    setTodayEntries(next);

    // maintain index of days with entries
    const idxRaw = await AsyncStorage.getItem(JOURNAL_INDEX_KEY);
    let idx: string[] = idxRaw ? JSON.parse(idxRaw) : [];
    if (!idx.includes(today)) {
      idx = [...idx, today];
      await AsyncStorage.setItem(JOURNAL_INDEX_KEY, JSON.stringify(idx));
      setRecentDates(idx.slice(-7));
    }
  };

  const onAnalyzeAndSave = async () => {
    setError(null);
    const reflection = text.trim();
    if (!reflection) {
      setError('Write a short reflection before saving.');
      return;
    }
    setBusy(true);
    try {
      const { summary, emotion } = await (summarize ? summarize(reflection) : localSummarize(reflection));
      const entry: JournalEntry = {
        id: `${Date.now()}:${Math.random().toString(36).slice(2, 7)}`,
        text: reflection,
        summary,
        emotion,
        createdAt: Date.now(),
      };
      await saveEntry(entry);
      setText('');
      if (onJournalSaved) onJournalSaved();
    } catch (e: any) {
      setError('Could not analyze right now. Saved locally without AI.');
      // Save a fallback entry even if AI fails
      const entry: JournalEntry = {
        id: `${Date.now()}:${Math.random().toString(36).slice(2, 7)}`,
        text: reflection,
        summary: 'Saved your note.',
        emotion: 'Neutral',
        createdAt: Date.now(),
      };
      await saveEntry(entry);
      setText('');
    } finally {
      setBusy(false);
    }
  };

  const lastN = todayEntries.slice(0, showLastN);

  return (
          <View style={{ backgroundColor: '#111827', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#1F2937' }}>
            <Text style={{ color: 'white', fontWeight: '800', fontSize: 18, marginBottom: 8 }}>Daily Reflection</Text>
            <Text style={{ color: '#9CA3AF', fontSize: 13, marginBottom: 8 }}>
              How did today’s goals make you feel? One or two sentences is perfect.
            </Text>

            <View
              style={{
                backgroundColor: 'white',
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 8,
                marginBottom: 8,
              }}
            >
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="e.g., I didn’t want to start, but I feel proud I finished."
                placeholderTextColor="#6B7280"
                multiline
                style={{ minHeight: 70, color: '#111827' }}
              />
            </View>

            {error ? <Text style={{ color: '#FCA5A5', marginBottom: 8 }}>{error}</Text> : null}

            <Pressable
              onPress={onAnalyzeAndSave}
              disabled={busy}
              style={{
                backgroundColor: busy ? '#374151' : '#2563EB',
                borderRadius: 12,
                paddingVertical: 10,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {busy ? (
                <ActivityIndicator />
              ) : (
                <Text style={{ color: 'white', fontWeight: '700' }}>Analyze & Save</Text>
              )}
            </Pressable>

            {/* Recent summaries */}
            {lastN.length > 0 && (
              <View style={{ marginTop: 12, gap: 8 }}>
                <Text style={{ color: '#D1D5DB', fontWeight: '700' }}>Today’s Insights</Text>
                {lastN.map((e) => (
                  <View
                    key={e.id}
                    style={{
                      backgroundColor: '#0B1220',
                      borderColor: '#1F2937',
                      borderWidth: 1,
                      borderRadius: 12,
                      padding: 10,
                    }}
                  >
                    <Text style={{ color: '#93C5FD', fontSize: 12, marginBottom: 4 }}>{e.emotion}</Text>
                    <Text style={{ color: 'white' }}>✨ {e.summary}</Text>
                    <Text style={{ color: '#9CA3AF', fontSize: 11, marginTop: 4 }}>
                      {new Date(e.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
  );
}
