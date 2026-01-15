
import { GoogleGenAI } from "@google/genai";
import { AnalysisType } from "../types";

// Always use the named parameter and process.env.API_KEY directly as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeProductDoc = async (text: string, type: AnalysisType) => {
  const model = "gemini-3-flash-preview";
  
  let prompt = "";
  if (type === AnalysisType.INSIGHT) {
    prompt = `
      You are an expert product analyst. Based on the following product documentation, 
      extract the core functional modules, user pain points addressed, and primary value propositions. 
      Format your response in professional Chinese Markdown.
      
      Product Documentation:
      ${text}
    `;
  } else {
    prompt = `
      You are a senior Product Manager. Based on the following product documentation, 
      generate a detailed and structured Product Requirements Document (PRD). 
      Include: Overview, Target Audience, Functional Requirements, Non-Functional Requirements, and User Flows.
      Format your response in professional Chinese Markdown.
      
      Product Documentation:
      ${text}
    `;
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
      }
    });

    // Access .text property directly (do not call as a method).
    return response.text || "No insights could be generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error occurred while connecting to the AI brain. Please try again later.";
  }
};
