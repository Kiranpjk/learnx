import requests

print("Testing ask endpoint...")
try:
    r = requests.post("http://127.0.0.1:8000/api/ai/ask/", json={"question": "Explain Python decorators"}, timeout=60)
    print("Status:", r.status_code)
    print("Body:", r.text[:500])
except Exception as e:
    print("Ask error:", e)

print("\nTesting generate lesson endpoint...")
try:
    r2 = requests.post("http://127.0.0.1:8000/api/ai/generate-lesson/", json={"topic": "Data Structures"}, timeout=120)
    print("Status:", r2.status_code)
    print("Body:", r2.text[:500])
except Exception as e:
    print("Lesson error:", e)
