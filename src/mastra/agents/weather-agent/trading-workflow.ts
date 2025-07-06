// This file serves as an example, can be deleted later.
import { Agent } from "@mastra/core/agent";
import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { model } from "../../config";

// Create Trading Playbook Agent
const agent = new Agent({
  name: "Trading Playbook Agent",
  model,
  instructions: `
#CONTEXT
I lack a clearly defined trading playbook or trading plan. This causes me to make inconsistent, off-the-cuff decisions and exposes me to costly mistakes. I want to eliminate uncertainty and anxiety by building a bulletproof trading playbook—a clear rule-set that transforms every session into a predictable, controlled process. My goal is to develop a customized, actionable trading playbook I can rely on every day.

#ROLE
You are a Trading Playbook Architect and Thinking Time Facilitator. Your expertise is in helping traders uncover weak spots in their process, clarify their rules, and build playbooks that create consistency and confidence. You use challenging, high-level questions to help me reflect, codify, and personalize my trading plan.

#RESPONSE GUIDELINES
Start by asking several calibration questions to understand my current trading style, decision-making process, pain points, goals, and any previous attempts at creating a playbook.
Use my answers to craft and ask 7 challenging, customized Thinking Time–style questions that force deep reflection and accountability around my trading rules and plan.
After each answer, ask a targeted, thoughtful follow-up to help me clarify or strengthen my response before moving on.
Tailor all questions and follow-ups to my unique context—no generic or surface-level prompts.
After all 7 questions and follow-ups are complete, analyze my responses and synthesize them into a clear, actionable, and bulletproof trading playbook that addresses my specific needs.

#TASK CRITERIA
Begin with multiple calibration questions to understand my trading context, pain points, and aspirations for a playbook.
Generate and deliver 7 customized Thinking Time questions, each with a tailored follow-up after my answer.
At the end, summarize my insights into a practical, 3–5 step trading playbook or rule-set that I can implement immediately.

#OUTPUT FORMATTING
1. Calibration questions (one at a time, wait for my responses).
2. 7 customized Thinking Time questions (one at a time, with follow-ups after each answer).
3. Synthesized, actionable 3–5 step trading playbook/rule-set summarizing my key insights and action points.
  `,
});

// Input schema: user trading context
const tradingContextSchema = z.object({
  tradingExperience: z.string(),
  currentChallenges: z.string(),
  goals: z.string(),
});

// Output schema: structured playbook
const tradingPlaybookSchema = z.object({
  summary: z.string(),
  rules: z.array(z.string()),
});

// Step 1: Gather Trading Context
const gatherContext = createStep({
  id: "gather-trading-context",
  description: "Gathers trading experience, current challenges, and goals",
  inputSchema: tradingContextSchema,
  outputSchema: z.object({
    conversation: z.string(),
  }),
  execute: async ({ inputData }) => {
    const prompt = `
Here is my trading context:
Experience: ${inputData.tradingExperience}
Challenges: ${inputData.currentChallenges}
Goals: ${inputData.goals}

Begin by asking calibration questions based on this.
`;

    const response = await agent.stream([{ role: "user", content: prompt }]);

    let conversation = "";
    for await (const chunk of response.textStream) {
      process.stdout.write(chunk);
      conversation += chunk;
    }

    return { conversation };
  },
});

// Step 2: Build Playbook Based on Interaction
const buildPlaybook = createStep({
  id: "build-trading-playbook",
  description: "Creates a customized trading playbook from discussion",
  inputSchema: z.object({
    conversation: z.string(),
  }),
  outputSchema: tradingPlaybookSchema,
  execute: async ({ inputData }) => {
    const prompt = `
Based on the following conversation with me:
${inputData.conversation}

Generate a summarized 3–5 step trading playbook with clear, actionable rules I can follow.
`;

    const response = await agent.stream([{ role: "user", content: prompt }]);
    let result = "";
    for await (const chunk of response.textStream) {
      process.stdout.write(chunk);
      result += chunk;
    }

    const rules = result
      .split("\n")
      .filter((line) => line.trim().startsWith("-") || line.trim().match(/^\d+\./));

    return {
      summary: result,
      rules,
    };
  },
});

// Full Workflow
const tradingPlaybookWorkflow = createWorkflow({
  id: "trading-playbook-workflow",
  inputSchema: tradingContextSchema,
  outputSchema: tradingPlaybookSchema,
})
  .then(gatherContext)
  .then(buildPlaybook);

tradingPlaybookWorkflow.commit();

export { tradingPlaybookWorkflow };
