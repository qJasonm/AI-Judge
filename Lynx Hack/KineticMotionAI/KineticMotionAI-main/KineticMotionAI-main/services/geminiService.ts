import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AnalysisResult, Tier, UserSettings, DailyLog, AgendaItem, Goal } from "../types";

// Persistent memory for skeletal signatures and biomechanical standards
const benchmarkCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60 * 12; // 12-hour memory persistence

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

export const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800; // Reduced from 1024 for speed
                const MAX_HEIGHT = 800;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                
                const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
                resolve(dataUrl.split(',')[1]);
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};

const safeParseJSON = (text: string) => {
  if (!text) return null;
  let cleaned = text.replace(/```json\s*/g, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const firstOpen = cleaned.indexOf('{');
    const lastClose = cleaned.lastIndexOf('}');
    if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
        try { return JSON.parse(cleaned.substring(firstOpen, lastClose + 1)); } catch (e2) {}
    }
    if (cleaned.startsWith('{') && !cleaned.endsWith('}')) {
        try { return JSON.parse(cleaned + '}'); } catch (e3) { }
    }
    if (cleaned.startsWith('[') && !cleaned.endsWith(']')) {
        try { return JSON.parse(cleaned + ']'); } catch (e4) { }
    }
    console.error("Failed to parse JSON", text);
    throw new Error("Neural output corrupted.");
  }
};

export const generateAudioFeedback = async (text: string, voiceName: string = 'Kore'): Promise<string | undefined> => {
    try {
        const ai = getAIClient();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: { parts: [{ text: text }] },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voiceName },
                    },
                },
            },
        });
        
        return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    } catch (e) {
        console.warn("TTS Generation failed:", e);
        return undefined;
    }
};

export const analyzeMeal = async (base64Image: string) => {
    try {
        const ai = getAIClient();
        const prompt = `Analyze food. JSON ONLY: { "name": string, "calories": number, "protein": number, "carbs": number, "fats": number }`;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: { 
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
                    { text: prompt }
                ] 
            },
            config: {
                responseMimeType: "application/json",
                thinkingConfig: { thinkingBudget: 0 },
                maxOutputTokens: 150
            }
        });

        return safeParseJSON(response.text || '{}');
    } catch (e) {
        console.error("Meal Analysis Failed:", e);
        return null;
    }
};

export const generateDailyPlan = async (userSettings: UserSettings, log: DailyLog) => {
    try {
        const ai = getAIClient();
        const prompt = `
        ACT AS: Elite Coach.
        USER: ${userSettings.profile.weight}kg, Goal: ${userSettings.profile.goal}.
        STATE: Sleep ${log.sleepHours}h, Soreness ${log.soreness}/10.
        TASK: Daily Plan JSON.
        OUTPUT: {
            "trainingFocus": "Short string",
            "readinessAnalysis": "1 sentence",
            "meals": [{ "timing": "Pre-Workout", "name": "...", "calories": 0, "protein": 0, "carbs": 0, "fats": 0 }],
            "macroTargets": { "protein": 0, "carbs": 0, "fats": 0 }
        }
        `;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: { parts: [{ text: prompt }] },
            config: {
                responseMimeType: "application/json",
                thinkingConfig: { thinkingBudget: 0 }
            }
        });

        return safeParseJSON(response.text || '{}');
    } catch (e) {
        console.error("Daily Plan Generation failed:", e);
        return null;
    }
};

export const optimizeAgenda = async (userSettings: UserSettings, log: DailyLog) => {
    try {
        const ai = getAIClient();
        const prompt = `
        ACT AS: Planner.
        USER: Energy ${log.energy}/10. Goal: ${userSettings.profile.goal}. Tasks: ${log.agenda.map(a=>a.text).join(",")}.
        OUTPUT: JSON Array of objects { "text": "...", "time": "HH:MM", "category": "workout"|"focus"|"recovery"|"nutrition" }
        `;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: { parts: [{ text: prompt }] },
            config: {
                responseMimeType: "application/json",
                thinkingConfig: { thinkingBudget: 0 }
            }
        });

        const result = safeParseJSON(response.text || '[]');
        return Array.isArray(result) ? result : [];
    } catch (e) {
        return null;
    }
};

export const generateGoalRoadmap = async (goalTitle: string, userSettings: UserSettings): Promise<any> => {
    try {
        const ai = getAIClient();
        const prompt = `
        ACT AS: Elite Performance Strategist.
        GOAL: "${goalTitle}" for a ${userSettings.profile.skillLevel} athlete.
        TASK: Create a 3-step milestone roadmap + 1 sentence strategy.
        OUTPUT JSON:
        {
            "strategy": "One sentence summary of approach.",
            "milestones": [
                { "title": "Phase 1 Goal", "desc": "Brief metric" },
                { "title": "Phase 2 Goal", "desc": "Brief metric" },
                { "title": "Phase 3 Goal", "desc": "Brief metric" }
            ]
        }
        `;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: { parts: [{ text: prompt }] },
            config: {
                responseMimeType: "application/json",
                thinkingConfig: { thinkingBudget: 0 },
                maxOutputTokens: 300
            }
        });

        return safeParseJSON(response.text || '{}');
    } catch (e) {
        console.error("Roadmap Gen Failed", e);
        return null;
    }
};

export const generateWeeklyInsights = async (history: AnalysisResult[]): Promise<string[]> => {
    if (history.length === 0) return ["No data yet. Log your first session!"];
    
    try {
        const ai = getAIClient();
        const historyStr = history.slice(-5).map(h => 
            `Score: ${h.overallScore}, Risk: ${h.injuryRiskLevel}, Errors: ${h.errors.length}`
        ).join(' | ');

        const prompt = `
        ACT AS: Concise Sports Coach.
        HISTORY: ${historyStr}
        TASK: List 3-5 very short bullet points summarizing progress. Direct and actionable.
        OUTPUT JSON: ["Bullet 1", "Bullet 2", "Bullet 3"]
        `;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: { parts: [{ text: prompt }] },
            config: {
                responseMimeType: "application/json",
                thinkingConfig: { thinkingBudget: 0 },
                maxOutputTokens: 200
            }
        });

        const result = safeParseJSON(response.text || '[]');
        return Array.isArray(result) ? result : ["Keep training to see insights."];
    } catch (e) {
        return ["Focus on consistency this week.", "Watch your form on landings.", "Great effort on recent sessions."];
    }
};

const generatePerfectFormImage = async (sport: string, gender: string = 'Male'): Promise<string | undefined> => {
    try {
        const ai = getAIClient();
        const prompt = `Fitness photo. ${gender} doing perfect ${sport}. Studio light.`;
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-image",
            contents: { parts: [{ text: prompt }] },
            config: { imageConfig: { aspectRatio: "1:1" } }
        });
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) return part.inlineData.data;
        }
        return undefined;
    } catch (e) { return undefined; }
}

export const analyzeMovement = async (
  base64Data: string,
  mimeType: string,
  sportContext: string,
  tier: Tier = 'Basic',
  language: string = 'English',
  sessionHistory?: AnalysisResult[],
  voiceName: string = 'Kore',
  userGender: string = 'Male'
): Promise<AnalysisResult> => {
  const ai = getAIClient();
  const modelId = "gemini-3-flash-preview";
  const cached = benchmarkCache.get(sportContext);
  const isWarm = cached && (Date.now() - cached.timestamp < CACHE_TTL);

  const prompt = `ANALYZE "${sportContext}".
    JSON OUTPUT:
    {
      "overallScore": int(0-100),
      "technicalBreakdown": "string",
      "detailedAnalysis": "string",
      "feedback": "string",
      "injuryRiskLevel": "Low"|"Medium"|"High",
      "powerScore": int,
      "balanceScore": int,
      "injuryRiskScore": int,
      "errors": [{"joint":string,"issue":string,"correction":string,"severity":"Low"|"Medium"|"High"}],
      "jointAngles": [{"joint":string,"angle":number,"target":string,"status":"optimal"|"warning"|"critical"}],
      "jointStress": {"knee": 0-100, "lower_back": 0-100, "ankle": 0-100}, 
      "drills": [string],
      "badges": [string],
      "kinematicChain": "string"
    }
    Telegraphic style. SPEED CRITICAL.`;

  try {
    const analysisPromise = ai.models.generateContent({
      model: modelId,
      contents: { parts: [{ inlineData: { mimeType, data: base64Data } }, { text: prompt }] },
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 },
        maxOutputTokens: 600,
      },
    });

    const imageGenPromise = generatePerfectFormImage(sportContext, userGender);

    const [response, referenceImageBase64] = await Promise.all([analysisPromise, imageGenPromise]);

    const data = safeParseJSON(response.text || '{}');
    if (!data) throw new Error("Null Data");

    const scriptToRead = `${data.feedback}.`; 
    const audioBase64 = await generateAudioFeedback(scriptToRead, voiceName);

    if (!isWarm) benchmarkCache.set(sportContext, { data, timestamp: Date.now() });

    return {
      ...data,
      sport: sportContext,
      timestamp: new Date().toISOString(),
      isCached: !!isWarm,
      audioBase64: audioBase64,
      groundingUrls: [],
      referenceImageBase64: referenceImageBase64
    };
  } catch (error) {
    console.error("Analysis Error:", error);
    throw error;
  }
};

export const analyzeVideoContent = async (videoBase64: string, mimeType: string = "video/mp4", sportContext: string = "General Fitness"): Promise<AnalysisResult> => {
    const ai = getAIClient();
    const prompt = `ANALYZE VIDEO "${sportContext}". JSON OUTPUT matching AnalysisResult structure. Keep concise.`;
    
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts: [{ inlineData: { mimeType, data: videoBase64 } }, { text: prompt }] },
        config: { responseMimeType: "application/json", thinkingConfig: { thinkingBudget: 0 }, maxOutputTokens: 800 }
    });
    
    const data = safeParseJSON(response.text || '{}');
    const scriptToRead = `${data.feedback}.`;
    const audioBase64 = await generateAudioFeedback(scriptToRead, 'Kore');

    return { ...data, sport: sportContext, timestamp: new Date().toISOString(), isCached: false, groundingUrls: [], jointAngles: data.jointAngles || [], audioBase64: audioBase64 };
};

export const getChatResponse = async (history: { role: string; content: string }[], message: string) => {
    try {
        const ai = getAIClient();
        const chat = ai.chats.create({
            model: "gemini-3-flash-preview", 
            config: { 
                systemInstruction: "You are Kinetic MotionAI Support, a helpful and energetic AI assistant for a sports biomechanics app. Keep answers short, encouraging, and helpful.",
                maxOutputTokens: 250 
            },
            history: history.map(h => ({ role: h.role, parts: [{ text: h.content }] }))
        });
        const result = await chat.sendMessage({ message });
        return result.text;
    } catch (e) {
        console.error("Chat Error", e);
        throw e;
    }
};