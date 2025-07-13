import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import axios, { AxiosResponse } from "axios";
import { ALPHA_VANTAGE_API_KEY } from "../../config";

const BASE_URL = "https://www.alphavantage.co/query";

// --- Configuration Object for Indicators ---
// This drives the tool's logic. Adding a new indicator is as simple as adding an entry here.
const INDICATOR_CONFIG = {
    rsi: { apiFunction: 'RSI', dataKey: 'Technical Analysis: RSI', parser: (data: any) => data.RSI },
    macd: { apiFunction: 'MACD', dataKey: 'Technical Analysis: MACD', parser: (data: any) => ({ macd: data.MACD, signal: data.MACD_Signal, hist: data.MACD_Hist }) },
    sma: { apiFunction: 'SMA', dataKey: 'Technical Analysis: SMA', parser: (data: any) => data.SMA, params: { time_period: 50 } },
    ema: { apiFunction: 'EMA', dataKey: 'Technical Analysis: EMA', parser: (data: any) => data.EMA, params: { time_period: 20 } },
    bbands: { apiFunction: 'BBANDS', dataKey: 'Technical Analysis: BBANDS', parser: (data: any) => ({ upper: data.Real_Upper_Band, middle: data.Real_Middle_Band, lower: data.Real_Lower_Band }), params: { time_period: 20 } },
    stoch: { apiFunction: 'STOCH', dataKey: 'Technical Analysis: STOCH', parser: (data: any) => ({ slowK: data.SlowK, slowD: data.SlowD }) },
    obv: { apiFunction: 'OBV', dataKey: 'Technical Analysis: OBV', parser: (data: any) => data.OBV }
};

// --- Type Definitions for Clarity ---
type IndicatorName = keyof typeof INDICATOR_CONFIG;
type ToolOutput = z.infer<typeof marketDataTool.outputSchema>;

// --- Refactored Helper Functions ---

/**
 * Creates a standardized error for a failed API fetch.
 */
const createApiError = (indicator: string, symbol: string, apiNote?: string): void => {
    const message = apiNote || "No data returned or an unknown API issue occurred.";
    console.error(`[Tool Error] Could not fetch ${indicator} for symbol '${symbol}'. API Response: ${message}`);
};

/**
 * Generic parser for a single indicator's API response.
 * It handles all common logic: error checking, finding the latest data point, and parsing.
 */
const parseIndicatorResponse = (
    result: PromiseSettledResult<AxiosResponse>,
    indicatorName: IndicatorName,
    symbol: string
): any | undefined => {
    if (result.status === 'rejected') {
        createApiError(indicatorName.toUpperCase(), symbol, result.reason?.message);
        return undefined;
    }

    const responseData = result.value.data;
    if (!responseData) {
        createApiError(indicatorName.toUpperCase(), symbol);
        return undefined;
    }
    
    // Handle Alpha Vantage's "Thank you for using..." note which indicates a rate limit or invalid call
    if (responseData["Note"]) {
        createApiError(indicatorName.toUpperCase(), symbol, responseData["Note"]);
        return undefined;
    }
    
    const config = INDICATOR_CONFIG[indicatorName];
    const technicalData = responseData[config.dataKey];
    
    if (!technicalData || Object.keys(technicalData).length === 0) {
        createApiError(indicatorName.toUpperCase(), symbol);
        return undefined;
    }

    const latestDate = Object.keys(technicalData)[0];
    const latestDataPoint = technicalData[latestDate];
    
    return config.parser(latestDataPoint);
};

export const marketDataTool = createTool({
    id: "fetch_market_data",
    description: "Gets current price and a comprehensive set of technical indicators for a given stock, crypto, or index symbol.",
    
    inputSchema: z.object({
        symbol: z.string().describe("The ticker symbol. For stocks/indices (e.g., 'AAPL', 'TSLA'). For crypto, use the pair format (e.g., 'BTCUSD')."),
        assetType: z.enum(['stock', 'crypto', 'index']).describe("The type of the asset."),
    }),

    outputSchema: z.object({
        symbol: z.string(),
        price: z.string().optional(),
        rsi: z.string().optional(),
        macd: z.object({ macd: z.string(), signal: z.string(), hist: z.string() }).optional(),
        sma: z.string().optional(),
        ema: z.string().optional(),
        bollingerBands: z.object({ upper: z.string(), middle: z.string(), lower: z.string() }).optional(),
        stoch: z.object({ slowK: z.string(), slowD: z.string() }).optional(),
        obv: z.string().optional()
    }),

    execute: async ({ context }) => {
        const { symbol, assetType } = context;
        console.log(`[Tool] Fetching market data for ${assetType.toUpperCase()} symbol ${symbol}...`);

        const indicatorSymbol = assetType === 'crypto' ? symbol.slice(0, -3) : symbol;
        const output: ToolOutput = { symbol: symbol.toUpperCase() };

        // --- Build API Requests ---
        let priceRequest: Promise<AxiosResponse>;
        if (assetType === 'crypto') {
            priceRequest = axios.get(BASE_URL, { params: { function: 'CURRENCY_EXCHANGE_RATE', from_currency: indicatorSymbol, to_currency: symbol.slice(-3), apikey: ALPHA_VANTAGE_API_KEY } });
        } else {
            priceRequest = axios.get(BASE_URL, { params: { function: 'GLOBAL_QUOTE', symbol, apikey: ALPHA_VANTAGE_API_KEY } });
        }

        const indicatorRequests = (Object.keys(INDICATOR_CONFIG) as IndicatorName[]).map(key => {
            const config = INDICATOR_CONFIG[key];
            const params = {
                function: config.apiFunction,
                symbol: indicatorSymbol,
                interval: 'daily',
                series_type: 'close',
                apikey: ALPHA_VANTAGE_API_KEY,
                ...config.params
            };
            return axios.get(BASE_URL, { params });
        });

        // --- Execute All Requests Concurrently ---
        const [priceResult, ...indicatorResults] = await Promise.allSettled([priceRequest, ...indicatorRequests]);

        // --- Parse Price Response ---
        if (priceResult.status === 'fulfilled') {
            const priceData = priceResult.value.data;
            if (assetType === 'crypto') {
                const quote = priceData["Realtime Currency Exchange Rate"];
                if (quote) output.price = quote["5. Exchange Rate"];
                else createApiError('Price', symbol, priceData["Note"]);
            } else {
                const quote = priceData["Global Quote"];
                if (quote && Object.keys(quote).length > 0) output.price = quote["05. price"];
                else createApiError('Price', symbol, priceData["Note"]);
            }
        } else {
            createApiError('Price', symbol, priceResult.reason?.message);
        }

        // --- Parse All Indicator Responses Using the Generic Parser ---
        (Object.keys(INDICATOR_CONFIG) as IndicatorName[]).forEach((key, index) => {
            const result = indicatorResults[index];
            const parsedData = parseIndicatorResponse(result, key, symbol);
            if (parsedData) {
                // Map camelCase keys from config to output schema keys if they differ
                if (key === 'bbands') {
                    output.bollingerBands = parsedData;
                } else {
                    (output as any)[key] = parsedData;
                }
            }
        });

        console.log(`[Tool] Data fetch complete for ${symbol}. Returning available data.`);
        return output;
    },
});