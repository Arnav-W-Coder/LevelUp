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
        # Filter by mood (and optional style) first to keep results on-tone
        idx = [i for i, it in enumerate(self.items) if it.get("mood") == mood or (mood == "neutral" and it.get("mood") in ("neutral","positive","negative"))]
        if style:
            idx = [i for i in idx if self.items[i].get("style") == style] or idx  # if no style matches, fall back to mood only

        if not idx:
            idx = list(range(len(self.items)))

        # Build query string: reflection + keywords boost
        q = clean_text(reflection + " " + " ".join(keywords or []))
        q_vec = self.vectorizer.transform([q])
        q_vec = normalize(q_vec)

        # Compute cosine similarity only against filtered indices
        subM = self.matrix[idx]
        sims = (subM @ q_vec.T).toarray().ravel()

        # Small bonus if tag overlap
        if keywords:
            overlaps = np.array([len(set(keywords) & set(self.items[i].get("tags", []))) for i in idx], dtype=float)
            sims += 0.05 * overlaps  # tiny tag boost

        # Take top-k indices
        top_order = np.argsort(-sims)[: max(k, 1)]
        ranked = [idx[i] for i in top_order]

        return [self.items[i] for i in ranked]

# sentiment banding
def sentiment_to_mood(p: float) -> str:
    if p > 0.35: return "positive"
    if p < -0.35: return "negative"
    return "neutral"

# simple topic chooser
BAD_TOPIC_TOKENS = {"didn","don","doesn","won","wouldn","shouldn","cant","couldn","im","ive","youre","isnt","arent","wasnt","werent"}

def choose_topic(keywords, reflection):
    # prefer non-stopword nouns from your POS-based top_keywords
    for w in keywords:
        if len(w) > 2 and w.isalpha() and w not in BAD_TOPIC_TOKENS:
            return w
    # fallback: scan reflection for a decent noun-like word
    for w in re.findall(r"[a-zA-Z]{3,}", reflection.lower()):
        if w not in BAD_TOPIC_TOKENS:
            return w
    return "this"

# --- load dataset at startup
RESP = ResponseBank(DATA_PATH)

def top_keywords(text: str, n: int = 5):
    try:
        tags = TextBlob(text).tags  # needs 'punkt' + 'averaged_perceptron_tagger'
        nouns = [w.lower() for (w, pos) in tags if pos.startswith("NN")]
    except Exception:
        nouns = [w for w in re.sub(r"[^a-z0-9\- ]+", " ", text.lower()).split() if len(w) >= 2]

    seen, out = set(), []
    for w in nouns:
        if w not in seen:
            seen.add(w); out.append(w)
        if len(out) >= n: break
    return out

# ---- Routes ----
@app.get("/health")
def health():
    return jsonify({"ok": True}), 200

@app.post("/summarize")
def summarize():
    ip = client_ip()
    if rate_limited(ip):
        return jsonify({"error": "Too many requests"}), 429

    data = request.get_json(silent=True) or {}
    reflection = (data.get("reflection") or "").strip()
    reflection = normalize_quotes((data.get("reflection") or "").strip())
    user_name  = (data.get("name") or "friend").strip()[:24]
    style      = (data.get("style") or "").strip()  # optional: "coach"|"friend"|"zen"

    if not reflection:
        return jsonify({"error":"Empty reflection"}), 400
    if len(reflection) > 1000:
        return jsonify({"error":"Reflection too long (max 1000)"}), 413

    blob = TextBlob(reflection)
    pol  = float(blob.sentiment.polarity)
    subj = float(blob.sentiment.subjectivity)

    # keywords from your earlier top_keywords implementation (or reuse TextBlob noun_phrases with fallbacks)
    kws = top_keywords(reflection, n=5)

    mood = sentiment_to_mood(pol)
    candidates = RESP.query(reflection, mood=mood, style=style or None, keywords=kws, k=8)

    # pick one of the top results with a bit of randomness (top-3 weighted sample)
    pick_pool = candidates[:3] if len(candidates) >= 3 else candidates
    chosen = random.choice(pick_pool) if pick_pool else {"text":"Keeping it simple—one tiny step is enough.", "tags":[]}

    topic = choose_topic(kws, reflection)
    greeting = time_greeting()  # you already have this in your code
    text = chosen["text"].format(name=user_name, topic=topic, greeting=greeting)

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
