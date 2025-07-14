# Nosana Builders Challenge: Agent-101

![Agent-101](./assets/NosanaBuildersChallengeAgents.jpg)

# Trading Analyst Agent

## Topic

Nosana Builders Challenge, 2nd edition  
Agent-101: Build your first agent

## Description

This project is a sophisticated Trading Analyst Agent developed for the Nosana Builders Challenge. The agent's primary function is to provide detailed technical analysis of financial assets. It intelligently uses structured tools to interact with the Alpha Vantage API, fetching and interpreting market data. The agent is capable of searching for assets, retrieving a wide range of technical indicators, and presenting a comprehensive analysis in a clear, structured format.

## Trading Analyst Agent: Description and Purpose

The Trading Analyst Agent is an AI-powered bot designed to act as a professional trading analyst. It leverages two powerful tools to interact with real-time financial data:

1. `symbolSearchTool`: Finds and disambiguates financial assets (stocks, cryptocurrencies, indices) based on user keywords.
2. `marketDataTool`: Fetches current price and a suite of technical indicators for a specified asset.

### Key Capabilities

- Symbol Search: Accurately finds financial assets and clarifies with the user if multiple matches are found.
- Comprehensive Data Retrieval: Fetches current price, RSI, MACD, SMA, EMA, Bollinger Bands, Stochastic Oscillator, and On-Balance Volume (OBV).
- Structured Analysis: Presents data in a detailed, easy-to-read markdown format that explains what each indicator means.
- Educational Insights: Provides context and interpretation for technical indicators, helping users understand the market dynamics.
- Robust Error Handling: Gracefully manages API errors, partial data, or failed searches by informing the user and suggesting next steps.

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/trading-analyst-agent.git
cd trading-analyst-agent
2. Install Dependencies

pnpm install
3. Setup Ollama
This agent is designed to run locally with an LLM served by Ollama.

a. Install Ollama
Follow the instructions on the official Ollama website: https://ollama.com

b. Start the Ollama service

ollama serve
c. Pull and run the recommended model

ollama pull qwen2:1.5b
ollama run qwen2:1.5b
Why qwen2:1.5b?

Lightweight: Requires only ~1GB of space.

Fast: Delivers quick inference times, even on a CPU.

Tool Calling: Natively supports the tool-calling functionality required by the agent.

Development-Friendly: Perfect for local development and testing loops.

The Ollama server runs on http://localhost:11434 by default, which is compatible with the OpenAI API format that Mastra expects.

Environment Variables Required
This agent requires an API key from Alpha Vantage to fetch financial data.

1. Get an API Key
Visit the Alpha Vantage website and claim your free API key: https://www.alphavantage.co

2. Create a .env file
Create a file named .env in the root of your project and add the following content:


ALPHA_VANTAGE_API_KEY=YOUR_ALPHA_VANTAGE_KEY
Replace YOUR_ALPHA_VANTAGE_KEY with the key you obtained.

Run Locally
Start the agent in development mode:


pnpm run dev
Docker Build and Run Commands
You can also build and run the agent inside a Docker container.

Build the Docker image

docker build -t trading-analyst-agent .
Run the container

docker run -p 8080:8080 --env-file .env trading-analyst-agent
The --env-file .env flag passes the required ALPHA_VANTAGE_API_KEY to the container.

Example Usage
Scenario 1: Searching for an asset and getting a full report
User:

Can you give me a technical analysis of Apple?

Agent:

I found a few potential matches for "Apple". Which one are you interested in?

AAPL (stock) - Apple Inc. - United States

APLE (stock) - Apple Hospitality REIT Inc - United States

...and 3 other results.

User: AAPL, the first one.

Agent: Apple Inc. (AAPL) Technical Analysis

Current Market Position
Price: $214.29  
Trend Context: The price is currently trading above its key short-term and long-term moving averages, suggesting a bullish trend.

Technical Indicators Analysis

Trend Indicators
Moving Averages:
SMA (50): $195.50 → The price is approximately 9.6% above its 50-day simple moving average, indicating a strong medium-term bullish trend.  
EMA (20): $208.15 → The price is above its 20-day exponential moving average, confirming strong short-term momentum.  
Interpretation: Both primary trend indicators confirm that Apple is in a bullish phase. The space between the price and the moving averages suggests the trend has strong momentum.

Momentum Indicators
RSI (14): 68.5 → Neutral to slightly overbought.  
What this means: The RSI is approaching the 70 level, which indicates strong buying pressure but also suggests the asset could be nearing a point where a pullback is possible.

MACD:  
Signal: Bullish. The MACD line is above the signal line, and the histogram is positive.  

Stochastic (%K/%D): 75.2/71.8 → Neutral.  
Market Psychology: This level suggests buying momentum is strong but not yet in the extreme "overbought" territory (>80).

Volatility & Volume
Bollinger Bands:  
Volatility Assessment: The price is trading in the upper half of the Bollinger Bands, which is consistent with an uptrend. The bands are moderately wide, indicating healthy volatility.

OBV:  
Volume Confirmation: The On-Balance Volume is in a steady uptrend, which confirms that volume is supporting the price increase. This is a strong sign of accumulation.

Key Insights
Strong Bullish Trend: All trend indicators (Price, SMAs, EMAs) are aligned, confirming a robust uptrend.  
Volume Confirmed Momentum: The rising OBV validates the price action, suggesting institutional buying and strong market conviction.  
Nearing Overbought: While momentum is strong, the RSI is nearing 70, which warrants caution. Traders will be watching for signs of exhaustion.

What to Watch
RSI hitting 70: A cross above 70 could signal peak momentum, while a rejection could precede a short-term price correction.  
Support Levels: Watch the 20-day EMA (~$208) as a potential first line of support if a pullback occurs.

Educational Analysis: This technical analysis is for learning purposes only and does not constitute financial advice. Always conduct your own research and consider your risk tolerance. ```
