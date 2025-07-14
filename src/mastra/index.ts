import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { tradingAnalystAgent } from '../mastra/agents/your-agent/tradingAnalystAgent'; // <-- IMPORTING OUR NEW AGENT

/**
 * This is the main entry point for your Mastra application.
 * It configures and starts a server that exposes your agents via an API.
 */
export const mastra = new Mastra({
  workflows: {}, 
  agents: {
    tradingAnalystAgent,
  },
  logger: new PinoLogger({
    name: "TradingAnalystApp",
    level: "info",
  }),
  server: {
    port: 8080,
    timeout: 20000,
  },
});