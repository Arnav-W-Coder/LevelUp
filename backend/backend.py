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

def normalize_quotes(s: str) -> str:
    return (s.replace("’", "'")
             .replace("‘", "'")
             .replace("“", '"')
             .replace("”", '"'))

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
        safe_kws = [w for w in (keywords or []) if w not in STOPWORDS and w not in BAD_TOPIC_TOKENS and w.isalpha() and len(w) > 2]
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

# sentiment banding
def sentiment_to_mood(p: float) -> str:
    if p > 0.35: return "positive"
    if p < -0.35: return "negative"
    return "neutral"

# -------- Text normalization & filtering --------
CONTRACTIONS = {
    "’": "'", "‘": "'", "“": '"', "”": '"',
}

NEGATIONS = {"not","no","never","none","without"}

# words to always drop as topics/keywords (contraction bits, auxiliaries, generic verbs)
BAD_TOPIC_TOKENS = {
    "didn","don","doesn","won","wouldn","shouldn","cant","couldn","im","ive","youre","isnt","arent","wasnt","werent",
    "nt","t","ll","re","ve","s","m","d",
    "want","make","made","doing","did","do","does","going","went","start","started","finish","finished","get","got",
    "today","tomorrow","yesterday","day","things","stuff"
}
# minimal stopword set (keep it small; you can expand later)
STOPWORDS = {
    "a","an","the","and","or","but","if","then","so","because","as","of","to","in","on","for","with","at","by","from",
    "is","am","are","was","were","be","been","being",
    "i","you","he","she","we","they","me","him","her","us","them","my","your","his","her","our","their",
    NEGATIONS
}

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
    """
    Regex-only, frequency-based keywords.
    No POS, no noun_phrases. Strong filtering.
    """
    toks = cleaned_tokens(text)
    if not toks:
        return []
    freq = Counter(toks)
    # top-N by frequency
    return [w for w, _ in freq.most_common(n)]

def choose_topic(keywords: list[str], reflection: str) -> str:
    for w in keywords:
        if w not in BAD_TOPIC_TOKENS and w not in STOPWORDS:
            return w
    for w in cleaned_tokens(reflection):
        if w not in BAD_TOPIC_TOKENS:
            return w
    return "this"

# --- load dataset at startup
RESP = ResponseBank(DATA_PATH)

# ---- Routes ----
@app.get("/health")
def health():
    return jsonify({"ok": True}), 200

APP_VERSION = "kwfix-2025-10-25-01"

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

    pol  = float(TextBlob(reflection).sentiment.polarity)
    subj = float(TextBlob(reflection).sentiment.subjectivity)

    # keywords from your earlier top_keywords implementation (or reuse TextBlob noun_phrases with fallbacks)
    kws = top_keywords(reflection, n=5)

    mood = sentiment_to_mood(pol)
    candidates = RESP.query(reflection, mood=mood, style=style or None, keywords=kws, k=8)

    # pick one of the top results with a bit of randomness (top-3 weighted sample)
    pick_pool = candidates[:3] if len(candidates) >= 3 else candidates
    chosen = random.choice(pick_pool) if pick_pool else {"text":"Keeping it simple—one tiny step is enough.", "tags":[]}

    topic = choose_topic(kws, reflection)
    greeting = time_greeting()  # you already have this in your code
    text = fmt(chosen["text"], name=user_name, topic=choose_topic(kws, reflection), greeting=time_greeting())
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
