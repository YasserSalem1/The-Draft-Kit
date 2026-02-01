import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv('.env')

API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=API_KEY)

print(f"Checking models for key: {API_KEY[:5]}...")

try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(m.name)
except Exception as e:
    print(f"Error: {e}")
