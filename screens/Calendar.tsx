import JournalCard from '@/utils/journalCard';
import { summarizeWithFlask } from '@/utils/summarize';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions, Modal, Pressable, SafeAreaView, SectionList, StyleSheet, Text, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useXP } from '../context/XPContext';
import Menu from '../utils/menu';

const { height: screenHeight } = Dimensions.get('window');

type Props = {
  goToCharacter: () => void;
  goToDungeon: () => void;
  goToGoal: () => void;
  goToHome: () => void;
  goToCalendar: () => void;
};

// storage keys (reuse your journal keys)
const JOURNAL_INDEX_KEY = 'levelup_journal_index';
const JOURNAL_FOR = (ymd: string) => `levelup_journal:${ymd}`;

type JournalEntry = {
  id: string;
  text: string;
  summary: string;
  emotion: string;
  createdAt: number;
};

type GoalItem = { kind: 'goal'; value: string };
type JournalItem = { kind: 'journal'; value: JournalEntry };
type SectionItem = GoalItem | JournalItem;

// ----- Local date helpers (NO UTC) -----
const localYMD = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
const addDaysLocal = (d: Date, days: number) => {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
};
const today = localYMD(new Date());
const tmw   = localYMD(addDaysLocal(new Date(), 1));

const normalizeToStrings = (items: any): string[] => {
  if (!items) return [];
  if (Array.isArray(items)) {
    return items.map((x) => (typeof x === 'string' ? x : (x?.title ?? x?.name ?? JSON.stringify(x))));
  }
  return Object.values(items).map((x: any) => (typeof x === 'string' ? x : (x?.title ?? x?.name ?? JSON.stringify(x))));
};

type GoalsByDate = Record<string, string[]>;
type MarkedMap = Record<string, { marked?: boolean; dots?: { key: string; color: string }[] }>;

export default function GoalCalendar({
  goToCharacter, goToDungeon, goToGoal, goToHome, goToCalendar,
}: Props) {
  const { action, savedGoals, tomorrowGoals } = useXP();

  const [loaded, setLoaded] = useState(false);
  const [marked, setMarked] = useState<MarkedMap>({});
  const [goalsByDate, setGoalsByDate] = useState<GoalsByDate>({});
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [journalIndex, setJournalIndex] = useState<string[]>([]);
  const [journalForSelected, setJournalForSelected] = useState<JournalEntry[]>([]);
  const [journalModalOpen, setJournalModalOpen] = useState(false);

  // Merge a dot into a date entry (dedupe by key)
  const mergeDot = (base: MarkedMap, date: string, dot: { key: string; color: string }): MarkedMap => {
    const prev = base[date] ?? {};
    const prevDots = prev.dots ?? [];
    const exists = prevDots.some((d) => d.key === dot.key);
    const dots = exists ? prevDots : [...prevDots, dot];
    return { ...base, [date]: { ...prev, marked: true, dots } };
  };

  

  useEffect(() => {
    if (!loaded) return;

    (async () => {
      const idxRaw = await AsyncStorage.getItem(JOURNAL_INDEX_KEY);
      const idx: string[] = idxRaw ? JSON.parse(idxRaw) : [];
      setJournalIndex(idx);

      setMarked((prev) => {
        let next = prev;
        for (const d of idx) {
          next = mergeDot(next, d, { key: 'journal', color: '#F59E0B' });
        }
        if (JSON.stringify(next) !== JSON.stringify(prev)) {
          AsyncStorage.setItem('markedDates', JSON.stringify(next));
        }
        return next;
      });
    })();
  }, [loaded]);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(JOURNAL_FOR(selectedDate));
      if (!raw) { setJournalForSelected([]); return; }
      try {
        const obj = JSON.parse(raw);
        setJournalForSelected(Array.isArray(obj?.entries) ? obj.entries : []);
      } catch {
        setJournalForSelected([]);
      }
    })();
  }, [selectedDate]);

  // Load persisted state first, then mark loaded=true
  useEffect(() => {
    (async () => {
      try {
        const [savedMarked, savedGoalsMap] = await Promise.all([
          AsyncStorage.getItem('markedDates'),
          AsyncStorage.getItem('goalsByDate'),
        ]);
        if (savedMarked) setMarked(JSON.parse(savedMarked));
        if (savedGoalsMap) setGoalsByDate(JSON.parse(savedGoalsMap));
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  // Persist helpers
  const persistMarked = async (next: MarkedMap) => {
    setMarked(next);
    await AsyncStorage.setItem('markedDates', JSON.stringify(next));
  };
  const persistGoals = async (next: GoalsByDate) => {
    setGoalsByDate(next);
    await AsyncStorage.setItem('goalsByDate', JSON.stringify(next));
  };

  // When `action` flips true, add a GREEN dot to today and persist (after load)
  useEffect(() => {
    if (!loaded || !action) return;
    const next = mergeDot(marked, today, { key: 'action', color: 'transparent'});
    if (JSON.stringify(next) !== JSON.stringify(marked)) {
      persistMarked(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action, loaded]);

  // Sync context's savedGoals (today) and tomorrowGoals (tomorrow) into dots + goals list (after load)
  useEffect(() => {
    if (!loaded) return;

    const todayGoals = normalizeToStrings(savedGoals);
    const tmwGoals = normalizeToStrings(tomorrowGoals);

    let nextMarked = marked;
    let nextGoals = goalsByDate;
    let changed = false;

    if (todayGoals.length > 0) {
      const m = mergeDot(nextMarked, today, { key: 'planned', color: '#2563EB' });
      if (JSON.stringify(m) !== JSON.stringify(nextMarked)) {
        nextMarked = m;
        changed = true;
      }
      const g = Array.from(new Set([...(nextGoals[today] ?? []), ...todayGoals]));
      if (JSON.stringify(g) !== JSON.stringify(nextGoals[today] ?? [])) {
        nextGoals = { ...nextGoals, [today]: g };
        changed = true;
      }
    }

    if (tmwGoals.length > 0) {
      const m = mergeDot(nextMarked, tmw, { key: 'planned', color: '#2563EB' });
      if (JSON.stringify(m) !== JSON.stringify(nextMarked)) {
        nextMarked = m;
        changed = true;
      }
      const g = Array.from(new Set([...(nextGoals[tmw] ?? []), ...tmwGoals]));
      if (JSON.stringify(g) !== JSON.stringify(nextGoals[tmw] ?? [])) {
        nextGoals = { ...nextGoals, [tmw]: g };
        changed = true;
      }
    }

    if (changed) {
      // persist separately to avoid race clobbers
      if (nextMarked !== marked) persistMarked(nextMarked);
      if (nextGoals !== goalsByDate) persistGoals(nextGoals);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedGoals, tomorrowGoals, loaded]);

  // Calendar + list
  const markedDates = useMemo(() => marked, [marked]);
  const onDayPress = (d: { dateString: string }) => d?.dateString && setSelectedDate(d.dateString);
  const goalsForSelected = goalsByDate[selectedDate] ?? [];
  const calendarKey = useMemo(() => Object.keys(marked).join('|'), [marked]);

  // Build a single data source for the SectionList
  const sections: { title: string; count: number; data: SectionItem[] }[] = [
    { title: 'Goals', count: goalsForSelected.length,
      data: goalsForSelected.map((g) => ({ kind: 'goal', value: g })) },
    { title: 'Journal', count: journalForSelected.length,
      data: journalForSelected.map((e) => ({ kind: 'journal', value: e })) },
  ];
  

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Calendar</Text>

      <Calendar
        key={calendarKey}
        markingType="multi-dot"
        markedDates={markedDates}
        onDayPress={onDayPress}
        dayComponent={({ date, state, onPress }) => {
            if (!date) return null;

            const entry = markedDates?.[date.dateString];
            const dots = entry?.dots ?? [];
            const isActionDay = dots.some((d) => d.key === 'action'); // your "green dot" flag

            const isDisabled = state === 'disabled';
            const isToday = state === 'today';

            return (
            <Pressable
                onPress={() => onPress?.(date)}
                style={({pressed}) => [{
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 6,
                minHeight: 52,
                minWidth: 30,
                borderRadius: 12,
                opacity: isDisabled ? 0.4 : 1,
                backgroundColor: isToday ? '#E5E7EB' : 'transparent',
                position: 'relative'}, // needed for absolute emoji
                pressed && styles.buttonPressed]}
            >
                {/* Day number ALWAYS rendered, explicit color */}
                <Text
                style={{
                    fontWeight: '700',
                    color: isToday ? '#111827' : 'white', // visible on your black bg
                    zIndex: 2,
                }}
                >
                {date.day}
                </Text>

                {/* Built-in dots reproduced under the number */}
                <View style={{ flexDirection: 'row', gap: 2, marginTop: 2, zIndex: 1 }}>
                {dots.map((d) => (
                    <View
                    key={d.key}
                    style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: d.color }}
                    />
                ))}
                </View>

                {/* 🔥 Emoji overlay – placed low and behind, so it never hides the number */}
                {isActionDay && (
                <Text
                    style={{
                    position: 'absolute',
                    bottom: 2,           // near bottom of the cell
                    zIndex: 0,           // behind number and dots
                    fontSize: 12,
                    }}
                    pointerEvents="none"
                >
                    🔥
                </Text>
                )}
            </Pressable>
            );
        }}
        theme={{
            calendarBackground: 'black',
            
        }}
        />

      <View style={styles.listHeader}>
        <Text style={styles.listHeaderDate}>{selectedDate}</Text>
        <Text style={styles.listHeaderCount}>{goalsForSelected.length} planned</Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item, idx) =>
          (item.kind === 'goal'
            ? `${`goals-${selectedDate}`}-${idx}-${item.value}`
            : `${`journal-${selectedDate}`}-${(item.value as JournalEntry).id}`)}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={
          <Text style={{ color: '#9CA3AF', paddingVertical: 12, alignSelf: 'center' }}>
            Nothing planned or journaled for this day.
          </Text>
        }
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: screenHeight * 0.08 + 20 }}
        renderSectionHeader={({ section }) => (
          <View style={{ marginTop: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Text style={{ color: 'white', fontSize: 18, fontWeight: '700' }}>{section.title}</Text>
            <Text style={{ color: '#9CA3AF', fontSize: 14 }}>{section.count}</Text>
          </View>
        )}
        renderItem={({ item }) => {
          if (item.kind === 'goal') {
            return (
              <View style={{
                backgroundColor: '#111827',
                borderRadius: 12,
                padding: 12,
                borderWidth: 1,
                borderColor: '#1F2937',
              }}>
                <Text style={{ color: 'white', fontWeight: '700' }}>{item.value as string}</Text>
                <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 4 }}>Planned</Text>
              </View>
            );
          }

          const e = item.value as JournalEntry;
          return (
            <View style={{
              backgroundColor: '#0B1220',
              borderColor: '#1F2937',
              borderWidth: 1,
              borderRadius: 12,
              padding: 12, 
            }}>
              <Text style={{
                color: e.emotion === 'Stressed' ? '#FCA5A5'
                    : e.emotion === 'Motivated' ? '#93C5FD'
                    : '#D1D5DB',
                fontWeight: '700',
                marginBottom: 4
              }}>
                {e.emotion}
              </Text>
              <Text style={{ color: 'white' }}>✨ {e.summary}</Text>
              <Text style={{ color: '#9CA3AF', fontSize: 11, marginTop: 6 }}>
                {new Date(e.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </Text>
            </View>
          );
        }}
      />

      {/* Floating write button */}
      { selectedDate === localYMD() ? <Pressable
        onPress={() => setJournalModalOpen(true)}
        style={{
          position: 'absolute', right: 16, bottom: 100,
          backgroundColor: '#2563EB', paddingHorizontal: 16, paddingVertical: 12,
          borderRadius: 999, borderWidth: 1, borderColor: '#1F2937'
        }}
      >
        <Text style={{ color: 'white', fontWeight: '700' }}>Write reflection</Text>
      </Pressable> : <View></View>}

      <Menu
        goToHome={goToHome}
        goToGoal={goToGoal}
        goToDungeon={goToDungeon}
        goToCharacter={goToCharacter}
        goToCalendar={goToCalendar}
        screen="Calendar"
      />
      <Modal visible={journalModalOpen} animationType="slide" transparent>
        <View style={{
          flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
          justifyContent: 'flex-end'
        }}>
          <View style={{
            backgroundColor: 'black', paddingBottom: 24, paddingTop: 12,
            borderTopLeftRadius: 16, borderTopRightRadius: 16
          }}>
            <JournalCard
              summarize={summarizeWithFlask}
              onJournalSaved={async () => {
                // reload entries and dots
                const raw = await AsyncStorage.getItem(JOURNAL_FOR(selectedDate));
                const obj = raw ? JSON.parse(raw) : { entries: [] };
                setJournalForSelected(Array.isArray(obj?.entries) ? obj.entries : []);

                // ensure the journal dot exists for this date
                if (!journalIndex.includes(selectedDate)) {
                  const idx = [...journalIndex, selectedDate];
                  setJournalIndex(idx);
                  setMarked((prev) => {
                    const next = mergeDot(prev, selectedDate, { key: 'journal', color: '#F59E0B' });
                    if (JSON.stringify(next) !== JSON.stringify(prev)) {
                      AsyncStorage.setItem('markedDates', JSON.stringify(next));
                    }
                    return next;
                  });
                }

                setJournalModalOpen(false);
              }}
            />
            <Pressable onPress={() => setJournalModalOpen(false)} style={{ alignSelf: 'center', marginTop: 8 }}>
              <Text style={{ color: '#9CA3AF' }}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  title: {
    color: 'white',
    fontSize: 50,
    fontWeight: 'bold',
    marginTop: screenHeight * 0.05,
    alignSelf: 'center',
  },
  calendar: {
    marginTop: screenHeight * 0.02,
    backgroundColor: 'black',
  },
  listHeader: {
    marginTop: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  listHeaderDate: { color: 'white', fontSize: 18, fontWeight: '700' },
  listHeaderCount: { color: '#9CA3AF', fontSize: 14 },
  goalCard: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  goalTitle: { color: 'white', fontWeight: '700' },
  goalMeta: { color: '#9CA3AF', fontSize: 12, marginTop: 4 },
  buttonPressed: {transform: [{ scale: 0.9 }]},
});