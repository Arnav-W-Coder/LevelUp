# backend/download_nltk.py
import os, nltk

NLTK_PATH = os.environ.get("NLTK_DATA", "/opt/render/nltk_data")
os.makedirs(NLTK_PATH, exist_ok=True)

nltk.download("punkt", download_dir=NLTK_PATH)
nltk.download("averaged_perceptron_tagger", download_dir=NLTK_PATH)
nltk.download("brown", download_dir=NLTK_PATH)
try:
    nltk.download("punkt_tab", download_dir=NLTK_PATH)
except Exception:
    pass
