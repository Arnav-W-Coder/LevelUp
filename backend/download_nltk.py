# backend/download_nltk.py
import nltk

# Core pieces TextBlob uses
nltk.download("punkt")
nltk.download("averaged_perceptron_tagger")

# Needed by TextBlob's noun_phrases extractor
nltk.download("brown")

# Some envs expect this extra resource; safe if it doesn't exist
try:
    nltk.download("punkt_tab")
except Exception:
    pass
