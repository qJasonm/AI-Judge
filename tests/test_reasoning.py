"""Quick test to see how finaljudge streams reasoning vs content tokens."""
from ollama import Client

c = Client(host="http://localhost:11434")
stream = c.chat(
    model="finaljudge:latest",
    messages=[{"role": "user", "content": "Say hello in JSON format"}],
    stream=True,
)

count = 0
for chunk in stream:
    msg = chunk.get("message", {})
    content = msg.get("content", "")
    reasoning = msg.get("reasoning", "")
    
    if content or reasoning:
        print(f"[{count}] content={repr(content)}, reasoning={repr(reasoning)}")
        count += 1
    
    if count >= 20:
        break

print("\nDone - check if reasoning field is populated or if thinking comes through content.")
