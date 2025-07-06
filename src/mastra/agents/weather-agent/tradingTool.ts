import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { model } from "../../config";
import { Agent } from "@mastra/core/agent";

// Create an agent that will process the trading context
const agent = new Agent({
  name: "Trading Playbook Agent",
  model,
  instructions: `
You are a Trading Playbook Architect. Your role is to analyze a trader’s background, challenges, and goals, and return insightful guidance on how they can develop a consistent, rule-based trading playbook.
Provide actionable, customized suggestions based on their input.
`,
});

// Step 1: Define input schema (trader fills out this)
const tradingInputSchema = z.object({
  experience: z.string().describe("Your trading experience (e.g., 2 years in crypto)"),
  challenges: z.string().describe("Biggest problems in your trading right now"),
  goals: z.string().describe("Your goals as a trader (e.g., consistent profits, risk control)"),
});

// Step 2: Define output schema (insightful, actionable advice)
const tradingOutputSchema = z.object({
  summary: z.string(),
  keySuggestions: z.array(z.string()),
});

// Step 3: Create the trading tool
export const tradingTool = createTool({
  id: "analyze-trading-context",
  description: "Analyze trading experience, challenges, and goals to generate custom playbook advice",
  inputSchema: tradingInputSchema,
  outputSchema: tradingOutputSchema,
  execute: async ({ context }) => {
    const { experience, challenges, goals } = context;

    const prompt = `
# Trader Background

Experience:
${experience}

Challenges:
${challenges}

Goals:
${goals}

# Task
Based on the trader's background, provide a concise summary of their situation. Then, list 3–5 custom suggestions to help them build a more consistent and structured trading plan/playbook. Focus on clarity, accountability, and improvement. Use bullet points for suggestions.
`;

    const response = await agent.complete(prompt);
    const result = response.text;

    const suggestions = result
      .split("\n")
      .filter((line) => line.trim().startsWith("-") || line.trim().match(/^\d+\./));

    return {
      summary: result,
      keySuggestions: suggestions,
    };
  },
});
