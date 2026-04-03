#!/bin/sh
# Start Ollama server in the background, then pull the four models.

ollama serve &
OLLAMA_PID=$!

# Wait for Ollama to be ready
echo "Waiting for Ollama to start..."
until curl -sf http://localhost:11434/api/tags > /dev/null 2>&1; do
  sleep 1
done
echo "Ollama is ready. Pulling models..."

ollama pull qjAsOnMA/slidejudge &
ollama pull qjAsOnMA/codejudge &
ollama pull qjAsOnMA/textjudge &
ollama pull qjAsOnMA/finaljudge

# Wait for background pulls
wait

# Copy to short names so the app can reference them without the username prefix
ollama cp qjAsOnMA/slidejudge slidejudge
ollama cp qjAsOnMA/codejudge codejudge
ollama cp qjAsOnMA/textjudge textjudge
ollama cp qjAsOnMA/finaljudge finaljudge

echo "All models ready."

# Keep Ollama running in the foreground
wait $OLLAMA_PID
