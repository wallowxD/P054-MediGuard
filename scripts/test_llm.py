import json
import os
from pathlib import Path
import sys
import urllib.request

sys.stdout.reconfigure(encoding="utf-8")

from dotenv import load_dotenv
load_dotenv()

key = os.getenv("GEMINI_API_KEY")
qwen_key = os.getenv("QWEN_API_KEY")

print(f"Gemini Key: {key[:10]}...")
print(f"Qwen Key: {qwen_key[:10]}...")

# 1. Test Qwen OpenAI Endpoint
import openai
client = openai.OpenAI(api_key=qwen_key, base_url="https://dashscope-intl.aliyuncs.com/compatible-mode/v1")
res = client.chat.completions.create(
    model="qwen3-vl-flash",
    messages=[{"role": "user", "content": "Xin chào, hãy trả về 'OK'"}],
    temperature=0.0
)
print("Qwen Response:", res.choices[0].message.content)
