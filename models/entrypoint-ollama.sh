#!/bin/sh
# Start Ollama server in the background, then pull the four models.

ollama serve &
OLLAMA_PID=$!

# Wait for Ollama to be ready (no curl/wget available, use ollama list)
echo "Waiting for Ollama to start..."
until ollama list > /dev/null 2>&1; do
  sleep 1
done
echo "Ollama is ready. Pulling models..."

# Pull sequentially to avoid competing for bandwidth/disk
ollama pull qjAsOnMA/slidejudge && echo "slidejudge pulled"
ollama pull qjAsOnMA/codejudge && echo "codejudge pulled"
ollama pull qjAsOnMA/textjudge && echo "textjudge pulled"
ollama pull qjAsOnMA/finaljudge && echo "finaljudge pulled"

# Copy to short names so the app can reference them without the username prefix
ollama cp qjAsOnMA/slidejudge slidejudge
ollama cp qjAsOnMA/codejudge codejudge
ollama cp qjAsOnMA/textjudge textjudge
ollama cp qjAsOnMA/finaljudge finaljudge

echo "All models ready."

# Keep Ollama running in the foreground
wait $OLLAMA_PID
