FROM python:3.11-slim

# System deps for building numpy/sklearn
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential gcc g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download NLTK resources used by TextBlob
RUN python - <<'PY'
import nltk
nltk.download('punkt')
nltk.download('averaged_perceptron_tagger')
PY

COPY . /app

ENV PORT=8000
EXPOSE 8000
CMD ["gunicorn", "-w", "2", "-b", "0.0.0.0:8000", "backend:app", "--timeout", "120"]
