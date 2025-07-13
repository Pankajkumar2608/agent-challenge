// src/config.ts (Updated and Corrected)

import dotenv from "dotenv";
import { createOllama } from "ollama-ai-provider";

// Load environment variables once at the beginning
dotenv.config();

// --- MODEL CONFIGURATION ---
export const modelName = process.env.MODEL_NAME_AT_ENDPOINT ?? "qwen2.5:1.5b";
export const baseURL = process.env.API_BASE_URL ?? "http://127.0.0.1:11434/api";

// Create and export the model instance
export const model = createOllama({ baseURL }).chat(modelName, {
  simulateStreaming: true,
});

// --- API KEY CONFIGURATION (THE FIX IS HERE) ---
export const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

// Log the values to confirm they are loaded correctly
console.log(`[Config] Model Name: ${modelName}`);
console.log(`[Config] Base URL:   ${baseURL}`);
// This log will immediately tell us if the key is loaded or not
console.log(`[Config] Alpha Vantage API Key: ${ALPHA_VANTAGE_API_KEY ? 'Loaded Successfully' : '!!! UNDEFINED !!!'}`);

// Add a check to halt the application if the key is missing
if (!ALPHA_VANTAGE_API_KEY) {
  throw new Error(
    "FATAL ERROR: ALPHA_VANTAGE_API_KEY is not defined in your .env file. The application cannot start."
  );
}