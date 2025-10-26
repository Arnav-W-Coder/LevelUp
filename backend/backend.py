from flask import Flask, request, jsonify
from flask_cors import CORS
from textblob import TextBlob
import time
import re
import random
from datetime import datetime
import json, os
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import normalize
import os, nltk
from collections import Counter
NLTK_PATH = os.environ.get("NLTK_DATA", "/opt/render/nltk_data")
if NLTK_PATH not in nltk.data.path:
    nltk.data.path.append(NLTK_PATH)

app = Flask(__name__)
# TODO: In production, restrict to your app's origins
CORS(app, resources={r"/*": {"origins": "*"}})

# ---- Simple in-memory rate limit per IP (60 req/min) ----
BUCKET = {}              # { ip: [timestamps...] }
WINDOW_SEC = 60
MAX_REQ_PER_WINDOW = 60

def client_ip():
    # Handles proxies (Railway/Render/etc.)
    fwd = request.headers.get("X-Forwarded-For", "")
    return (fwd.split(",")[0].strip() if fwd else request.remote_addr or "unknown")

def rate_limited(ip: str) -> bool:
    now = time.time()
    times = [t for t in BUCKET.get(ip, []) if now - t < WINDOW_SEC]
    if len(times) >= MAX_REQ_PER_WINDOW:
        return True
    times.append(now)
    BUCKET[ip] = times
    return False

# ---- Helpers ----

def band(p):
    # sentiment bands you can tweak
    if p > 0.35: return "positive"
    if p < -0.35: return "negative"
    return "neutral"

def time_greeting():
    h = datetime.now().hour
    if 5 <= h < 12: return "Morning"
    if 12 <= h < 18: return "Afternoon"
    return "Evening"

DATA_PATH = os.path.join(os.path.dirname(__file__), "responses.json")

def clean_text(s: str) -> str:
    s = s.lower()
    s = re.sub(r"[^a-z0-9\-\' ]+", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s

def fmt(template: str, **kwargs) -> str:
    try:
        return template.format(**kwargs)
    except Exception:
        return re.sub(r"[{}]", "", template)


class ResponseBank:
    def __init__(self, path: str):
        with open(path, "r", encoding="utf-8") as f:
            self.items = json.load(f)  # list of dicts
        # Keep original texts; build corpus for TF-IDF
        self.texts = [clean_text(it["text"] + " " + " ".join(it.get("tags", []))) for it in self.items]
        self.vectorizer = TfidfVectorizer(ngram_range=(1,2), min_df=1, max_features=50000)
        self.matrix = self.vectorizer.fit_transform(self.texts)  # (N x D)
        self.matrix = normalize(self.matrix)

    def query(self, reflection: str, mood: str, style: str|None, keywords: list[str], k: int = 8):
        idx = [i for i, it in enumerate(self.items)
            if it.get("mood") == mood or (mood == "neutral" and it.get("mood") in ("neutral","positive","negative"))]
        if style:
            idx = [i for i in idx if self.items[i].get("style") == style] or idx

        if not idx:
            idx = list(range(len(self.items)))

        # Only add **filtered** keywords back into the query to avoid “didn” etc.
        safe_kws = [w for w in (keywords or [])
            if w.isalpha() and len(w) > 2
            and w not in STOPWORDS and w not in BAD_TOPIC_TOKENS]

        # If the mood is negative, do not let positive words bias retrieval
        if mood == "negative":
            safe_kws = [w for w in safe_kws if w not in POS_WORDS]

        q = clean_text(reflection + (" " + " ".join(safe_kws) if safe_kws else ""))

        q_vec = self.vectorizer.transform([q])
        q_vec = normalize(q_vec)

        subM = self.matrix[idx]
        sims = (subM @ q_vec.T).toarray().ravel()

        if safe_kws:
            overlaps = np.array([len(set(safe_kws) & set(self.items[i].get("tags", []))) for i in idx], dtype=float)
            sims += 0.05 * overlaps

        top_order = np.argsort(-sims)[: max(k, 1)]
        ranked = [idx[i] for i in top_order]
        return [self.items[i] for i in ranked]

# put near your helpers
POS_WORDS = {"good","great","ok","okay","glad","happy","excited","confident","proud","relieved"}
NEGATORS   = {"not","no","never","cannot","cant","can't","dont","don't","didnt","didn't","won't","wont","isn't","isnt","aren't","arent","wasn't","wasnt","weren't","werent"}
NEG_WORDS_HARD = {"shit","terrible","awful","horrible","worthless","useless","hopeless","bad","sucks","suck","garbage","failure","failed","failing"}
POS_BOOSTERS = {"proud","finished","completed","accomplished","achieved","progress","streak","workout","gym","done"}
def clause_polarity(clause: str) -> float:
    t = normalize_contractions(clause).lower()
    pol = float(TextBlob(t).sentiment.polarity)

    # hard negatives override inside the clause
    if any(w in t for w in NEG_WORDS_HARD):
        pol = min(pol, -0.6)

    # “not <positive>” inside the clause → negative
    if re.search(r"\bnot\s+(%s)\b" % "|".join(map(re.escape, POS_WORDS)), t):
        pol = min(pol, -0.5)

    # generic negator + positive score → dampen/flip this clause only
    if any(n in t for n in NEGATORS) and pol > 0:
        pol = -0.6 * abs(pol)  # softer than before

    # small positive bump for clear completion language without a negator
    if any(b in t for b in POS_BOOSTERS) and not any(n in t for n in NEGATORS):
        pol = min(1.0, pol + 0.2)

    return pol

def adjusted_sentiment(text: str):
    # split into clauses; if there's a “but/however”, weight right side more
    parts = [p.strip() for p in BUT_SPLITTER.split(text) if p.strip()]
    if len(parts) == 1:
        pol = clause_polarity(parts[0])
        subj = float(TextBlob(normalize_contractions(text)).sentiment.subjectivity)
        if -0.05 < pol < 0.05:
            pol = 0.0
        return pol, subj

    # weight later clause(s) higher (e.g., 0.7 last, 0.3 rest combined)
    weights = []
    if len(parts) == 2:
        weights = [0.3, 0.7]
    else:
        # distribute increasing weights toward the end
        base = np.linspace(0.2, 0.8, num=len(parts))
        weights = (base / base.sum()).tolist()

    pols = [clause_polarity(p) for p in parts]
    pol = float(sum(w * p for w, p in zip(weights, pols)))

    subj = float(TextBlob(normalize_contractions(text)).sentiment.subjectivity)
    if -0.05 < pol < 0.05:
        pol = 0.0
    return pol, subj

def sentiment_to_mood(p: float) -> str:
    # tighter thresholds than stock
    if p > 0.2:  return "positive"
    if p < -0.2: return "negative"
    return "neutral"

# -------- Text normalization & filtering --------
CONTRACTIONS = {
    "’": "'", "‘": "'", "“": '"', "”": '"',
}
BUT_SPLITTER = re.compile(r"\b(?:but|however|though|yet)\b", flags=re.I)
NEGATIONS = {"not","no","never","without"}
BAD_TOPIC_TOKENS = {
  # contraction shards
  "didn","don","doesn","won","wouldn","shouldn","cant","couldn","isnt","arent","wasnt","werent","nt","t","ll","re","ve","m","d",
  # generic verbs/utility
  "want","make","made","doing","did","do","does","going","went","start","started","finish","finished","get","got","feel","feels","feeling","felt",
  # super generic/time/interrogatives that make bad topics
  "today","tomorrow","yesterday","day","things","stuff","time","about","what","when","where","why","how","think"
}
STOPWORDS = {
  "a","an","the","and","or","but","if","then","so","because","as","of","to","in","on","for","with","at","by","from",
  "is","am","are","was","were","be","been","being",
  "i","you","he","she","we","they","me","him","her","us","them","my","your","his","her","our","their","it","its",
  "this","that","these","those","very","also","just","too","than",
}
STOPWORDS = STOPWORDS.union(NEGATIONS)  # <- merge sets safely
# Extend your blocks
BAD_TOPIC_TOKENS.update({"about","what","when","where","why","how","like","anything"})
BAD_TOPIC_TOKENS.update(NEG_WORDS_HARD)  # never use profanity as topic

def normalize_quotes(s: str) -> str:
    return (s.replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"'))

def normalize_contractions(s: str) -> str:
    s = normalize_quotes(s)
    # expand common ones
    s = re.sub(r"\b(can|could|should|would)n\'t\b", r"\1 not", s, flags=re.I)
    s = re.sub(r"\b(\w+)n\'t\b", r"\1 not", s, flags=re.I)  # didn't -> did not
    s = re.sub(r"\bI\'m\b", "I am", s, flags=re.I)
    s = re.sub(r"\bI\'ve\b", "I have", s, flags=re.I)
    s = re.sub(r"\bI\'ll\b", "I will", s, flags=re.I)
    s = re.sub(r"\bI\'d\b", "I would", s, flags=re.I)
    s = re.sub(r"\b(\w+)\'re\b", r"\1 are", s, flags=re.I)
    s = re.sub(r"\b(\w+)\'ve\b", r"\1 have", s, flags=re.I)
    s = re.sub(r"\b(\w+)\'ll\b", r"\1 will", s, flags=re.I)
    s = re.sub(r"\b(\w+)\'d\b", r"\1 would", s, flags=re.I)
    return s

def cleaned_tokens(s: str) -> list[str]:
    s = normalize_contractions(s).lower()
    s = re.sub(r"[^a-z0-9\- ]+", " ", s)
    toks = []
    for w in s.split():
        if len(w) < 3:          # drop tiny bits (to, nt, t)
            continue
        if w in STOPWORDS or w in BAD_TOPIC_TOKENS:
            continue
        if w.isdigit():
            continue
        toks.append(w)
    return toks

def top_keywords(text: str, n: int = 5) -> list[str]:
    """Regex-only, frequency-based keywords. Strong filtering (no POS)."""
    toks = cleaned_tokens(text)
    if not toks:
        return []
    freq = Counter(toks)
    kws = [w for w, _ in freq.most_common(n)]
    # final guard: strip any negations that somehow slipped through
    return [w for w in kws if w not in NEGATIONS]

def choose_topic(keywords: list[str], reflection: str, mood: str) -> str:
    def ok_topic(w: str) -> bool:
        if not (w.isalpha() and len(w) > 2):
            return False
        if w in STOPWORDS or w in BAD_TOPIC_TOKENS:
            return False
        # If overall mood is negative, do NOT use positive words as the topic
        if mood == "negative" and w in POS_WORDS:
            return False
        return True

    for w in keywords:
        if ok_topic(w):
            return w
    for w in cleaned_tokens(reflection):
        if ok_topic(w):
            return w
    return "this"

# --- load dataset at startup
RESP = ResponseBank(DATA_PATH)

# ---- Routes ----
@app.get("/health")
def health():
    return jsonify({"ok": True}), 200

APP_VERSION = "kwfix-2025-10-25-04"

@app.get("/version")
def version():
    return {"version": APP_VERSION}


@app.post("/summarize")
def summarize():
    ip = client_ip()
    if rate_limited(ip):
        return jsonify({"error": "Too many requests"}), 429

    data = request.get_json(silent=True) or {}
    reflection_raw = (data.get("reflection") or "").strip()
    reflection = normalize_contractions(reflection_raw)
    user_name  = (data.get("name") or "friend").strip()[:24]
    style      = (data.get("style") or "").strip()

    if not reflection:
        return jsonify({"error":"Empty reflection"}), 400
    if len(reflection) > 1000:
        return jsonify({"error":"Reflection too long (max 1000)"}), 413

    pol, subj = adjusted_sentiment(reflection)

    # keywords from your earlier top_keywords implementation (or reuse TextBlob noun_phrases with fallbacks)
    kws = top_keywords(reflection, n=5)

    mood = sentiment_to_mood(pol)

    if mood == "negative":
        # keep keywords but drop obviously positive ones to avoid weird echoes
        kws = [w for w in kws if w not in POS_WORDS]

    candidates = RESP.query(reflection, mood=mood, style=style or None, keywords=kws, k=8)

    # pick one of the top results with a bit of randomness (top-3 weighted sample)
    pick_pool = candidates[:3] if len(candidates) >= 3 else candidates
    chosen = random.choice(pick_pool) if pick_pool else {"text":"Keeping it simple—one tiny step is enough.", "tags":[]}

    topic = choose_topic(kws, reflection, mood)

    # last-ditch topic guard
    if (
        (not topic.isalpha()) or (len(topic) < 3)
        or (topic in NEGATIONS) or (topic in STOPWORDS) or (topic in BAD_TOPIC_TOKENS)
        or (mood == "negative" and topic in POS_WORDS)
    ):
        topic = "this"

    greeting = time_greeting()
    text = chosen["text"]
    text = re.sub(r"\s+", " ", text).strip()

    emotion = "Motivated" if mood == "positive" else "Stressed" if mood == "negative" else "Neutral"
    return jsonify({
        "summary": text,
        "emotion": emotion,
        "polarity": pol,
        "subjectivity": subj,
        "keywords": kws
    }), 200

if __name__ == "__main__":
    # Dev server
    app.run(host="0.0.0.0", port=8000, debug=True)
