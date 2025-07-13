// src/index.ts

import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { tradingAnalystAgent } from '../mastra/agents/your-agent/tradingAnalystAgent'; // <-- IMPORTING OUR NEW AGENT

/**
 * This is the main entry point for your Mastra application.
 * It configures and starts a server that exposes your agents via an API.
 */
export const mastra = new Mastra({
  // The new Trading Analyst is a single, powerful agent.
  // We don't need a separate workflow for this use case yet.
  workflows: {}, 

  // Registering the new agent we built.
  // It will be accessible at the endpoint: /agents/tradingAnalystAgent
  agents: {
    tradingAnalystAgent,
  },

  // Logger for monitoring agent activity and debugging.
  logger: new PinoLogger({
    name: "TradingAnalystApp",
    level: "info",
  }),

  // Server configuration to run the API.
  server: {
    port: 8080,
    timeout: 20000, // Increased timeout for potentially slow API calls
  },
});

// A simple log to confirm the server is starting with the correct agent
console.log(`🚀 Starting Mastra server with agent: ${tradingAnalystAgent.name}`);
console.log(`➡️  Agent will be available at http://localhost:8080/agents/tradingAnalystAgent`);