from flask import Flask, request, jsonify
from flask_cors import CORS
from textblob import TextBlob
import time
import re
import random
from datetime import datetime

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

TEMPLATES = {
    # Each mood has multiple styles; we’ll pick one at random
    "positive": {
        "coach": [
            "🔥 {greeting}, {name}! Momentum is building. That {topic} win keeps stacking.",
            "Love that energy, {name}. Keep leaning into {topic}—you’re compounding gains.",
            "You showed up and it shows. Bank that confidence and take the next tiny step.",
            "That’s a clean rep on {topic}. Lock it in and let it pull you forward."
        ],
        "friend": [
            "That felt good, huh? Proud of you for sticking with {topic}.",
            "Yesss—little wins like this on {topic} add up fast.",
            "You did the thing. That glow you feel? You earned it.",
            "I can hear the spark in this. Keep that vibe going, {name}."
        ],
        "zen": [
            "Notice the lightness after {topic}. Keep choosing the small kind action.",
            "Momentum is quiet but real. Return to this feeling when it gets noisy.",
            "A gentle yes to {topic} today. The path gets clearer with each step.",
            "Consistency is a soft drumbeat—yours is steady."
        ]
    },
    "neutral": {
        "coach": [
            "Logged it—steady reps matter. One tiny nudge on {topic} next.",
            "Neutral today is fine. What’s a 2-minute move you can make on {topic}?",
            "Not every day is fireworks. Keep the base strong; progress follows.",
            "You kept the promise to show up. That’s the muscle we’re training."
        ],
        "friend": [
            "Okay, noted. Even writing this down helps future you.",
            "Chill day. Maybe one small thing for {topic} before you wrap?",
            "You’re still in the game—no drama needed.",
            "Sometimes ‘fine’ is a win. Tomorrow we add 1%."
        ],
        "zen": [
            "You observed without judgment. That’s practice.",
            "Let today be simple. One breath, one tiny step.",
            "The middle is where stamina grows.",
            "Quiet progress is still progress."
        ]
    },
    "negative": {
        "coach": [
            "Tough reps count double. One ultra-small next step on {topic}, right now.",
            "Resistance showed up; you showed up anyway. That’s grit.",
            "Shrink the target: 2 minutes on {topic}. Start there.",
            "We don’t need heroics—just one honest push. You’ve got this."
        ],
        "friend": [
            "Oof, felt heavy. Proud of you for being real about it.",
            "Hey, that was rough. Let’s find a tiny win on {topic} and call it.",
            "You’re not alone in this. Small is still forward.",
            "Be kind to yourself tonight. A little reset goes a long way."
        ],
        "zen": [
            "Name the weight, breathe once, take the smallest step.",
            "Suffering visited; let it pass through. Choose one gentle action.",
            "Sit with it briefly, then loosen your grip. One tiny move on {topic}.",
            "Storms pass. Anchor in a single simple act."
        ]
    }
}

def choose_topic(keywords, reflection):
    # Prefer detected keywords; otherwise pick a salient word from the reflection
    if keywords:
        return keywords[0]
    # fallback: simple content word from reflection
    rb = TextBlob(reflection)
    nouns = [w.lower() for (w, pos) in rb.tags if pos.startswith("NN")]
    return nouns[0] if nouns else "this"

def friendly_emotion_label(p):
    if p > 0.35: return "Motivated"
    if p < -0.35: return "Stressed"
    return "Neutral"

def generate_summary(name, p, keywords, reflection, style="coach"):
    mood = band(p)                # positive / neutral / negative
    style = style if style in TEMPLATES[mood] else "coach"
    topic = choose_topic(keywords, reflection)
    template = random.choice(TEMPLATES[mood][style])
    # Basic personalization
    return template.format(
        name=(name or "friend"),
        greeting=time_greeting(),
        topic=topic
    )


def top_keywords(text: str, n: int = 5):
    blob = TextBlob(text)
    phrases = [p.lower() for p in blob.noun_phrases if 2 <= len(p) <= 40]
    if phrases:
        return phrases[:n]
    nouns = [w.lower() for (w, pos) in blob.tags if pos.startswith("NN")]
    nouns = [re.sub(r"[^a-z0-9\- ]", "", w) for w in nouns if len(w) >= 2]
    out = []
    for w in nouns:
        if w not in out:
            out.append(w)
        if len(out) >= n:
            break
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
    user_name = (data.get("name") or "").strip()[:24]  # optional
    style = (data.get("style") or "coach").strip()      # "coach" | "friend" | "zen"

    if not reflection:
        return jsonify({"error": "Empty reflection"}), 400
    if len(reflection) > 1000:
        return jsonify({"error": "Reflection too long (max 1000)"}), 413

    blob = TextBlob(reflection)
    pol = float(blob.sentiment.polarity)
    subj = float(blob.sentiment.subjectivity)

    # keywords = noun phrases (fallbacks already added earlier)
    keywords = top_keywords(reflection, n=5)

    summary = generate_summary(user_name, pol, keywords, reflection, style=style)
    emotion = friendly_emotion_label(pol)

    return jsonify({
        "summary": summary,
        "emotion": emotion,
        "polarity": pol,
        "subjectivity": subj,
        "keywords": keywords
    }), 200

if __name__ == "__main__":
    # Dev server
    app.run(host="0.0.0.0", port=8000, debug=True)
