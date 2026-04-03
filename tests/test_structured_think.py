import json
from pydantic import BaseModel
from ollama import Client

class TestResponse(BaseModel):
    name: str
    age: int

c = Client(host="http://localhost:11434")

print("Requesting with structured format...")
stream = c.chat(
    model="finaljudge:latest",
    messages=[{"role": "user", "content": "Tell me about a person named Alice. Return as JSON."}],
    stream=True,
    format=TestResponse.model_json_schema()
)

full_content = ""
for chunk in stream:
    token = chunk.get("message", {}).get("content", "")
    full_content += token
    print(token, end="", flush=True)

print("\n\nIs <think> present?", "<think>" in full_content)
