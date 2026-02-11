
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateIcebreakers = async (user1Interests: string[], user2Interests: string[]) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `User A likes: ${user1Interests.join(', ')}. User B likes: ${user2Interests.join(', ')}. 
      Generate 3 unique, engaging, and low-pressure icebreaker questions for these two to start a chat on a dating app.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Icebreaker generation failed", error);
    return [
      "What's your favorite way to spend a weekend?",
      "If you could travel anywhere right now, where would you go?",
      "What's one thing that always makes you smile?"
    ];
  }
};

/**
 * Transcribes audio using gemini-3-flash-preview
 */
export const transcribeAudio = async (base64Data: string, mimeType: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          { text: "Please transcribe this audio exactly. Return ONLY the transcribed text. If there is no speech, return an empty string." },
        ],
      },
    });
    return response.text;
  } catch (error) {
    console.error("Transcription error:", error);
    return "";
  }
};

/**
 * AI Powered Chatbot using gemini-3-pro-preview
 */
export const askLoveAI = async (prompt: string, history: { role: 'user' | 'model', parts: { text: string }[] }[]) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [...history, { role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "You are the Hearts Connect Love AI Assistant. Your goal is to help users navigate dating, give relationship advice, help with profile bios, and keep them optimistic about finding a match. Keep responses concise, friendly, and encouraging. Never be judgmental.",
      }
    });
    return response.text;
  } catch (error) {
    console.error("AI Chat error:", error);
    return "I'm having a little trouble connecting to my romantic circuits. Please try again in a moment!";
  }
};
