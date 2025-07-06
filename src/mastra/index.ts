import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { tradingAgent } from "./agents/weather-agent/treading-agent";
import { tradingPlaybookWorkflow } from "./agents/weather-agent/trading-workflow"; // Optional: if you’ve created a workflow

export const mastra = new Mastra({
  workflows: {
    tradingPlaybookWorkflow, // Include if you use a workflow
  },
  agents: {
    tradingAgent,
  },
  logger: new PinoLogger({
    name: "Mastra",
    level: "info",
  }),
  server: {
    port: 8080,
    timeout: 10000,
  },
});
