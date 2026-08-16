import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI

if sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env")

api_key = os.getenv("OPENAI_API_KEY")
print(f"Loaded OPENAI_API_KEY: {api_key[:10]}...")

client = OpenAI(api_key=api_key)

# Test model names
models_to_try = ["gpt-5", "gpt-5-preview", "gpt-4o", "gpt-4o-mini"]

for model_name in models_to_try:
    print(f"Testing model: {model_name}...")
    try:
        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": "You are a medical OCR judge."},
                {"role": "user", "content": "Hello, respond with model name."}
            ],
            max_tokens=50
        )
        print(f"SUCCESS with model {model_name}: {response.choices[0].message.content.strip()}")
        break
    except Exception as e:
        print(f"FAILED with model {model_name}: {e}")
