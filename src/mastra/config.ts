// src/config.ts (Updated and Corrected)

import dotenv from "dotenv";
import { createOllama } from "ollama-ai-provider";


dotenv.config();

// --- MODEL CONFIGURATION ---
export const modelName = process.env.MODEL_NAME_AT_ENDPOINT ?? "qwen2.5:1.5b";
export const baseURL = process.env.API_BASE_URL ?? "http://127.0.0.1:11434/api";


export const model = createOllama({ baseURL }).chat(modelName, {
  simulateStreaming: true,
});

export const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
