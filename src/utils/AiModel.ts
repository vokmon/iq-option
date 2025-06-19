import { getAnalysisEnvConfig } from "../models/environment/AnalysisEnvConfig";

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

let googleModel: ChatGoogleGenerativeAI;

export const getChatGoogleGenerativeAI = () => {
  if (!googleModel) {
    const analysisConfig = getAnalysisEnvConfig();
    googleModel = new ChatGoogleGenerativeAI({
      model: analysisConfig.analysis.ai.GOOGLE_AI_MODEL,
      maxOutputTokens: 8192,
      apiKey: analysisConfig.analysis.ai.GOOGLE_API_KEY,
      temperature: 1,
      topP: 0.95,
      // topK: 64,
    });
  }
  return googleModel;
};
