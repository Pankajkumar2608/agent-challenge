![Agent-101](./assets/NosanaBuildersChallengeAgents.jpg)

# Trading Analyst Agent for Nosana Agent-101

### A sophisticated AI agent that performs detailed technical analysis of financial assets using real-time market data.

This project was developed for the **Nosana Builders Challenge (2nd Edition): Agent-101**. It demonstrates how to build an AI agent with structured tools, local LLM integration, and robust error handling to deliver insightful, educational analysis on stocks, cryptocurrencies, and indices.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Live Demo](#live-demo)
- [Setup and Installation](#setup-and-installation)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Install Dependencies](#2-install-dependencies)
  - [3. Set Up Ollama](#3-set-up-ollama)
  - [4. Configure Environment Variables](#4-configure-environment-variables)
- [Running the Agent](#running-the-agent)
  - [Run Locally](#run-locally)
  - [Run with Docker](#run-with-docker)
- [Example Usage](#example-usage)
- [Disclaimer](#disclaimer)

---

## Overview

The Trading Analyst Agent acts as an AI-powered financial analyst. It leverages two powerful, custom-built tools to interact with the Alpha Vantage API:

1.  **`symbolSearchTool`**: Finds and disambiguates financial assets (stocks, cryptocurrencies, indices) based on user keywords.
2.  **`marketDataTool`**: Fetches a comprehensive suite of technical indicators for a specified asset, complete with robust retry logic and data validation.

The agent interprets this data based on a detailed set of instructions, providing users with a structured, educational, and easy-to-understand technical report.

## Features

-   🔎 **Intelligent Symbol Search**: Accurately finds assets and asks for clarification when results are ambiguous.
-   📊 **Comprehensive Data Retrieval**: Fetches Price, RSI, MACD, SMA, EMA, Bollinger Bands, Stochastic Oscillator, and On-Balance Volume (OBV).
-   🤖 **Structured Analysis**: Presents data in a detailed, easy-to-read markdown format that explains what each indicator means.
-   🎓 **Educational Insights**: Provides clear context and interpretation for technical indicators, helping users learn about market analysis.
-   🛡️ **Robust Error Handling**: Gracefully manages API errors, partial data, or failed searches by informing the user and suggesting next steps.
-   🐳 **Dockerized**: Ready for containerized deployment with simple build and run commands.

## Technology Stack

-   **Agent Framework**: [Mastra](https://www.mastra.io/)
-   **LLM Service**: [Ollama](https://ollama.com/) with `qwen2:1.5b`
-   **Financial Data**: [Alpha Vantage API](https://www.alphavantage.co/)
-   **Language**: TypeScript
-   **Database (for memory)**: LibSQL / SQLite

## Live Demo





---

## Setup and Installation

Follow these steps to get the Trading Analyst Agent running on your local machine.

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/trading-analyst-agent.git
cd trading-analyst-agent

2. Install Dependencies
This project uses pnpm for package management.

pnpm install

3. Set Up Ollama
The agent is designed to run with a local LLM served by Ollama.
a. Install Ollama
Follow the official instructions at ollama.com.
b. Start the Ollama Service
Open a new terminal and run:```bash
ollama serve

**c. Pull and Run the Recommended Model**  
We use `qwen2:1.5b` for its balance of performance and resource efficiency.
```bash
ollama pull qwen2:1.5b
ollama run qwen2:1.5b
Use code with caution.
Why qwen2:1.5b?
Lightweight: Requires only ~1GB of space.
Fast: Delivers quick inference times on a CPU.
Tool Calling: Natively supports the function-calling required by the agent.
Development-Friendly: Perfect for local development and testing.
The Ollama server will run on http://localhost:11434 by default.
4. Configure Environment Variables
The agent needs an API key from Alpha Vantage to fetch financial data.
a. Get a Free API Key
Visit alphavantage.co to claim your free key.
b. Create a .env file
In the root of the project, create a file named .env and add your API key:
Generated env
ALPHA_VANTAGE_API_KEY=YOUR_ALPHA_VANTAGE_KEY

Env
Running the Agent
Once the setup is complete, you can run the agent locally or using Docker.
Run Locally
Start the agent in development mode. The agent will be accessible at http://localhost:8080.

pnpm run dev


Run with Docker
You can also build and run the agent inside a container.
1. Build the Docker Image

docker build -t trading-analyst-agent .


2. Run the Container
Generated bash
docker run -p 8080:8080 --env-file .env trading-analyst-agent
Use code with caution.

The --env-file .env flag securely passes your API key to the container.
Example Usage
Here is a sample interaction with the Trading Analyst Agent.
👤 User:
Can you give me a technical analysis of Apple?
🤖 Agent:
I found a few potential matches for "Apple". Which one are you interested in?
AAPL (stock) - Apple Inc. - United States
APLE (stock) - Apple Hospitality REIT Inc - United States
...and 3 other results.
 User:
AAPL, the first one.
 Agent:

# Apple Inc. (AAPL) Technical Analysis

## Current Market Position
**Price:** $214.29
**Trend Context:** The price is currently trading above its key short-term and long-term moving averages, suggesting a bullish trend.

## Technical Indicators Analysis

### 📈 Trend Indicators
**Moving Averages:**
- **SMA (50):** $195.50 → The price is approximately 9.6% above its 50-day simple moving average, indicating a strong medium-term bullish trend.
- **EMA (20):** $208.15 → The price is above its 20-day exponential moving average, confirming strong short-term momentum.

**Interpretation:** Both primary trend indicators confirm that Apple is in a bullish phase. The space between the price and the moving averages suggests the trend has strong momentum.

### ⚡ Momentum Indicators
**RSI (14):** 68.5 → Neutral to slightly overbought.
- **What this means:** The RSI is approaching the 70 level, which indicates strong buying pressure but also suggests the asset could be nearing a point where a pullback is possible.

### 📊 Volatility & Volume
**Bollinger Bands:**
- **Volatility Assessment:** The price is trading in the upper half of the Bollinger Bands, which is consistent with an uptrend.

**OBV:**
- **Volume Confirmation:** The On-Balance Volume is in a steady uptrend, which confirms that volume is supporting the price increase. This is a strong sign of accumulation.

## 🔍 Key Insights
1.  **Strong Bullish Trend**: All trend indicators (Price, SMAs, EMAs) are aligned, confirming a robust uptrend.
2.  **Volume Confirmed Momentum**: The rising OBV validates the price action, suggesting strong market conviction.
3.  **Nearing Overbought**: While momentum is strong, the RSI is nearing 70, which warrants caution.

## ⚠️ What to Watch
- **RSI hitting 70**: A cross above 70 could signal peak momentum.
- **Support Levels**: Watch the 20-day EMA (~$208) as a potential first line of support.

Disclaimer
This technical analysis is generated by an AI agent and is for educational purposes only. It does not constitute financial advice. Always conduct your own research and consider your risk tolerance before making any investment decisions.