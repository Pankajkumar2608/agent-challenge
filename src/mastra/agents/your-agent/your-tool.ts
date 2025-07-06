import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { Agent } from "@mastra/core/agent";
import { model } from "../../config";

// Create the trading assistant agent
const agent = new Agent({
  name: "Trading Tool Agent",
  model,
  instructions: `
You are a trading assistant designed to help users gain insights into their trading behavior, challenges, and goals. You analyze this input and return a clear summary with practical suggestions for building a consistent trading playbook.
  `,
});

// Async function to call the agent with user input
const analyzeTrading = async (context: {
  experience: string;
  challenges: string;
  goals: string;
}) => {
  const prompt = `
# Trader Profile

Experience:
${context.experience}

Challenges:
${context.challenges}

Goals:
${context.goals}

# Task
Based on the above, provide:
1. A short summary of their current trading situation
2. 3–5 tailored suggestions to help them improve or structure their trading plan/playbook
Return bullet points for clarity.
`;

  const response = await agent.run(prompt);
  const text = response.text;

  const suggestions = text
    .split("\n")
    .filter((line) => line.trim().startsWith("-") || line.trim().match(/^\d+\./));

  return {
    summary: text,
    suggestions,
  };
};

// Define the tool using `createTool`
export const tradingTool = createTool({
  id: "trading-playbook-tool",
  description: "Analyzes trading context to generate personalized insights and suggestions",
  inputSchema: z.object({
    experience: z.string().describe("Describe your trading experience"),
    challenges: z.string().describe("Your biggest trading challenges"),
    goals: z.string().describe("What you want to achieve in trading"),
  }),
  outputSchema: z.object({
    summary: z.string(),
    suggestions: z.array(z.string()),
  }),
  execute: async ({ context }) => {
    return await analyzeTrading(context);
  },
});
