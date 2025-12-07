import { GoogleGenAI } from "@google/genai";
import { ParsedMessage } from "../types";

// In a real deployed app, this would be available. 
// For this demo, we handle the case where it might be missing gracefully in the UI.
const apiKey = process.env.API_KEY || ''; 

export const analyzePersonaWithGemini = async (messages: ParsedMessage[]) => {
  if (!apiKey) {
    throw new Error("API Key not configured");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // Take a sample of the last 10 messages to avoid huge context windows for simple analysis
  const sample = messages.slice(-10).map(m => `${m.role}: ${m.content.substring(0, 200)}...`).join('\n');

  const prompt = `
    Analyze the following conversation snippet, specifically the 'assistant' responses.
    Determine the assistant's persona, tone, and style.
    Return a JSON object with keys: "tone" (string), "keywords" (array of strings), "suggestedPrompt" (string - a system instruction to replicate this persona).
    
    Snippet:
    ${sample}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });
    
    if (response.text) {
        return JSON.parse(response.text);
    }
    throw new Error("No response text");
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    throw error;
  }
};