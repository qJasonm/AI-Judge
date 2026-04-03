import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';

export class LiveSessionService {
  private client: GoogleGenAI;
  private sessionPromise: Promise<any> | null = null;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private outputNode: AudioNode | null = null;
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  private isConnected = false;
  private isMuted = false;

  constructor() {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API Key not found");
    this.client = new GoogleGenAI({ apiKey });
  }

  async connect(
    stream: MediaStream, 
    voiceName: string,
    onUserAudio: (level: number) => void,
    onModelAudio: (level: number) => void,
    onMessage: (text: string, grounding?: any[]) => void,
    onError: (error: any) => void,
    onClose: () => void
  ) {
    if (this.isConnected) return;

    this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    
    if (this.inputAudioContext.state === 'suspended') await this.inputAudioContext.resume();
    if (this.outputAudioContext.state === 'suspended') await this.outputAudioContext.resume();

    this.outputNode = this.outputAudioContext.createGain();
    (this.outputNode as GainNode).connect(this.outputAudioContext.destination);
    (this.outputNode as GainNode).gain.value = this.isMuted ? 0 : 1;

    // Define End Session Tool
    const endSessionTool = {
        name: "endSession",
        description: "Ends the live coaching session. Trigger this when the user says 'end session', 'stop', 'quit', or 'bye'.",
    };

    const config = {
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      callbacks: {
        onopen: () => {
          console.log('Live session connected');
          this.isConnected = true;
          this.startAudioInput(stream, onUserAudio);
        },
        onmessage: (message: LiveServerMessage) => {
          this.handleMessage(message, onModelAudio, onMessage, onClose);
        },
        onerror: (e: any) => {
          console.error('Live session error:', e);
          onError(e);
          this.disconnect();
        },
        onclose: () => {
          console.log('Live session closed');
          onClose();
          this.disconnect();
        },
      },
      config: {
        responseModalities: [Modality.AUDIO],
        tools: [
            { googleSearch: {} }, 
            { functionDeclarations: [endSessionTool] }
        ], 
        outputAudioTranscription: {}, 
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName || 'Kore' } },
        },
        systemInstruction: `You are Kinetic MotionAI, an elite, high-energy AI Biomechanics Coach.
        
        OBJECTIVE: Identify the user's exercise using visual cues. 
        
        GYMNASTICS & FORM FOCUS:
        - Watch for toe point, leg extension, landing stability, and spinal alignment.
        - Detect flips, handstands, holds, and flexibility moves instantly.
        
        INSTRUCTIONS:
        1. SPEED: Speak in short, sharp bursts (3-5 words). No conversational filler.
        2. VERIFY: Use Google Search ONLY if you see a rare movement you don't recognize.
        3. COACH: 
           - "Knees straight!"
           - "Point those toes!"
           - "Chest up!"
           - "Stick the landing!"
        4. SESSION CONTROL: If user says "End session" or "Stop", call 'endSession' immediately.
        
        Be strictly professional, high-energy, and IMMEDIATE.`,
      },
    };

    this.sessionPromise = this.client.live.connect(config);
    return this.sessionPromise;
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.outputNode && this.outputAudioContext) {
        (this.outputNode as GainNode).gain.setTargetAtTime(muted ? 0 : 1, this.outputAudioContext.currentTime, 0.05);
    }
  }

  setVolume(volume: number) {
    if (this.outputNode && this.outputAudioContext && !this.isMuted) {
        (this.outputNode as GainNode).gain.setTargetAtTime(Math.max(0, Math.min(1, volume)), this.outputAudioContext.currentTime, 0.1);
    }
  }

  private startAudioInput(stream: MediaStream, onUserAudio: (level: number) => void) {
    if (!this.inputAudioContext || !this.sessionPromise) return;

    if (stream.getAudioTracks().length === 0) {
        console.warn("No audio tracks in stream");
        return;
    }

    this.inputSource = this.inputAudioContext.createMediaStreamSource(stream);
    this.processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      
      let sum = 0;
      for (let i = 0; i < inputData.length; i++) {
        sum += inputData[i] * inputData[i];
      }
      const rms = Math.sqrt(sum / inputData.length);
      onUserAudio(Math.min(100, rms * 500));

      const pcmBlob = this.createBlob(inputData);
      this.sessionPromise?.then((s: any) => {
          if (this.isConnected) s.sendRealtimeInput({ media: pcmBlob });
      });
    };

    this.inputSource.connect(this.processor);
    this.processor.connect(this.inputAudioContext.destination);
  }

  async sendVideoFrame(base64Image: string) {
    if (!this.sessionPromise || !this.isConnected) return;
    
    try {
        await this.sessionPromise.then((s: any) => {
            if (this.isConnected) {
                s.sendRealtimeInput({
                    media: {
                        mimeType: 'image/jpeg',
                        data: base64Image
                    }
                });
            }
        });
    } catch (e) {
        console.error("Error sending frame", e);
    }
  }

  private async handleMessage(
    message: LiveServerMessage, 
    onModelAudio: (level: number) => void,
    onMessage: (text: string, grounding?: any[]) => void,
    onClose: () => void
  ) {
    // Check for Tool Call (End Session)
    const toolCall = message.toolCall;
    if (toolCall) {
        for (const fc of toolCall.functionCalls) {
            if (fc.name === 'endSession') {
                console.log("Model requested end of session.");
                this.disconnect();
                onClose();
                return;
            }
        }
    }

    // 1. Handle Audio
    const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (audioData && this.outputAudioContext) {
        const audioBuffer = await this.decodeAudioData(
            this.decode(audioData),
            this.outputAudioContext,
            24000,
            1
        );

        const rawData = audioBuffer.getChannelData(0);
        let sum = 0;
        const step = Math.floor(rawData.length / 100);
        for (let i = 0; i < rawData.length; i+=step) {
             sum += rawData[i] * rawData[i];
        }
        const rms = Math.sqrt(sum / (rawData.length / step));
        const level = Math.min(100, rms * 500 + 20); 
        
        onModelAudio(level);
        
        setTimeout(() => onModelAudio(0), audioBuffer.duration * 1000);

        this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);
        
        const source = this.outputAudioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.outputNode!);
        source.start(this.nextStartTime);
        
        this.nextStartTime += audioBuffer.duration;
        this.sources.add(source);
        
        source.onended = () => this.sources.delete(source);
    }

    // 2. Handle Text Transcription & Grounding
    const transcription = message.serverContent?.outputTranscription?.text;
    const grounding = (message as any).serverContent?.groundingMetadata?.groundingChunks;

    if (transcription || (grounding && grounding.length > 0)) {
        onMessage(transcription || '', grounding || []);
    }

    if (message.serverContent?.interrupted) {
        this.sources.forEach(source => {
            try { source.stop(); } catch(e) {}
        });
        this.sources.clear();
        this.nextStartTime = 0;
        onModelAudio(0);
    }
  }

  disconnect() {
    this.isConnected = false;
    if (this.sessionPromise) {
      this.sessionPromise.then((s: any) => {
          try { s.close(); } catch(e) {}
      }).catch(() => {});
      this.sessionPromise = null;
    }

    if (this.inputSource) {
      this.inputSource.disconnect();
      this.inputSource = null;
    }
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.inputAudioContext) {
      this.inputAudioContext.close();
      this.inputAudioContext = null;
    }
    if (this.outputAudioContext) {
      this.outputAudioContext.close();
      this.outputAudioContext = null;
    }
    this.sources.clear();
    this.nextStartTime = 0;
  }

  private createBlob(data: Float32Array): Blob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: this.encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  }

  private encode(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  private async decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }
}