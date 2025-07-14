import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import axios, { AxiosResponse } from "axios";
import { ALPHA_VANTAGE_API_KEY } from "../../config";

const BASE_URL = "https://www.alphavantage.co/query";
const REQUEST_TIMEOUT = 30000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const INDICATOR_CONFIG = {
    rsi: { 
        apiFunction: 'RSI', 
        dataKey: 'Technical Analysis: RSI', 
        parser: (data: any) => data?.RSI || null,
        params: { time_period: 14 }
    },
    macd: { 
        apiFunction: 'MACD', 
        dataKey: 'Technical Analysis: MACD', 
        parser: (data: any) => data?.MACD && data?.MACD_Signal && data?.MACD_Hist ? {
            macd: data.MACD,
            signal: data.MACD_Signal,
            hist: data.MACD_Hist
        } : null
    },
    sma: { 
        apiFunction: 'SMA', 
        dataKey: 'Technical Analysis: SMA', 
        parser: (data: any) => data?.SMA || null,
        params: { time_period: 50 }
    },
    ema: { 
        apiFunction: 'EMA', 
        dataKey: 'Technical Analysis: EMA', 
        parser: (data: any) => data?.EMA || null,
        params: { time_period: 20 }
    },
    bbands: { 
        apiFunction: 'BBANDS', 
        dataKey: 'Technical Analysis: BBANDS', 
        parser: (data: any) => data?.Real_Upper_Band && data?.Real_Middle_Band && data?.Real_Lower_Band ? {
            upper: data.Real_Upper_Band,
            middle: data.Real_Middle_Band,
            lower: data.Real_Lower_Band
        } : null,
        params: { time_period: 20 }
    },
    stoch: { 
        apiFunction: 'STOCH', 
        dataKey: 'Technical Analysis: STOCH', 
        parser: (data: any) => data?.SlowK && data?.SlowD ? {
            slowK: data.SlowK,
            slowD: data.SlowD
        } : null
    },
    obv: { 
        apiFunction: 'OBV', 
        dataKey: 'Technical Analysis: OBV', 
        parser: (data: any) => data?.OBV || null
    }
};

type IndicatorName = keyof typeof INDICATOR_CONFIG;
type ToolOutput = z.infer<typeof marketDataTool.outputSchema>;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const makeRequest = async (url: string, params: any, retries = 0): Promise<AxiosResponse> => {
    try {
        return await axios.get(url, { 
            params, 
            timeout: REQUEST_TIMEOUT,
            headers: {
                'User-Agent': 'Trading-Bot/1.0'
            }
        });
    } catch (error: any) {
        if (retries < MAX_RETRIES) {
            console.warn(`Request failed, retrying... (${retries + 1}/${MAX_RETRIES})`);
            await sleep(RETRY_DELAY * (retries + 1));
            return makeRequest(url, params, retries + 1);
        }
        throw error;
    }
};

const isValidApiResponse = (data: any): boolean => {
    return data && typeof data === 'object' && !data.Note && !data['Error Message'];
};

const parseIndicatorResponse = (
    result: PromiseSettledResult<AxiosResponse>,
    indicatorName: IndicatorName,
    symbol: string
): any | null => {
    if (result.status === 'rejected') {
        console.error(`${indicatorName.toUpperCase()} failed for ${symbol}:`, result.reason?.message);
        return null;
    }

    const responseData = result.value.data;
    if (!isValidApiResponse(responseData)) {
        console.error(`Invalid ${indicatorName.toUpperCase()} response for ${symbol}:`, responseData?.Note || responseData?.['Error Message'] || 'Unknown error');
        return null;
    }
    
    const config = INDICATOR_CONFIG[indicatorName];
    const technicalData = responseData[config.dataKey];
    
    if (!technicalData || Object.keys(technicalData).length === 0) {
        console.warn(`No ${indicatorName.toUpperCase()} data available for ${symbol}`);
        return null;
    }

    const latestDate = Object.keys(technicalData).sort().reverse()[0];
    const latestDataPoint = technicalData[latestDate];
    
    return config.parser(latestDataPoint);
};

const validateSymbol = (symbol: string, assetType: string): boolean => {
    if (!symbol || symbol.trim().length === 0) return false;
    
    switch (assetType) {
        case 'crypto':
            return /^[A-Z]{3,10}USD$/.test(symbol);
        case 'stock':
            return /^[A-Z]{1,5}$/.test(symbol);
        case 'index':
            return /^[A-Z^.]{1,10}$/.test(symbol);
        default:
            return false;
    }
};

const determineAssetType = (symbol: string): 'stock' | 'crypto' | 'index' => {
    if (symbol.endsWith('USD') && symbol.length > 3) return 'crypto';
    if (symbol.includes('^') || symbol.includes('.')) return 'index';
    return 'stock';
};

export const marketDataTool = createTool({
    id: "fetch_market_data",
    description: "Fetches current price and technical indicators for stocks, crypto, or indices with robust error handling and validation.",
    
    inputSchema: z.object({
        symbol: z.string().min(1).describe("Ticker symbol (e.g., 'AAPL', 'BTCUSD', '^GSPC')"),
        assetType: z.enum(['stock', 'crypto', 'index']).describe("Asset type"),
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
        obv: z.string().optional(),
        errors: z.array(z.string()).optional()
    }),

    execute: async ({ context }) => {
        const { symbol, assetType } = context;
        const cleanSymbol = symbol.trim().toUpperCase();
        
        console.log(`Fetching market data for ${assetType} symbol: ${cleanSymbol}`);

        if (!validateSymbol(cleanSymbol, assetType)) {
            throw new Error(`Invalid symbol format for ${assetType}: ${cleanSymbol}`);
        }

        const output: ToolOutput = { symbol: cleanSymbol, errors: [] };
        const indicatorSymbol = assetType === 'crypto' ? cleanSymbol.slice(0, -3) : cleanSymbol;

        try {
            let priceRequest: Promise<AxiosResponse>;
            
            if (assetType === 'crypto') {
                priceRequest = makeRequest(BASE_URL, {
                    function: 'CURRENCY_EXCHANGE_RATE',
                    from_currency: indicatorSymbol,
                    to_currency: cleanSymbol.slice(-3),
                    apikey: ALPHA_VANTAGE_API_KEY
                });
            } else {
                priceRequest = makeRequest(BASE_URL, {
                    function: 'GLOBAL_QUOTE',
                    symbol: cleanSymbol,
                    apikey: ALPHA_VANTAGE_API_KEY
                });
            }

            const indicatorRequests = (Object.keys(INDICATOR_CONFIG) as IndicatorName[]).map(key => {
                const config = INDICATOR_CONFIG[key];
                return makeRequest(BASE_URL, {
                    function: config.apiFunction,
                    symbol: indicatorSymbol,
                    interval: 'daily',
                    series_type: 'close',
                    apikey: ALPHA_VANTAGE_API_KEY,
                    ...config.params
                });
            });

            const [priceResult, ...indicatorResults] = await Promise.allSettled([
                priceRequest,
                ...indicatorRequests
            ]);

            // Parse price
            if (priceResult.status === 'fulfilled') {
                const priceData = priceResult.value.data;
                if (isValidApiResponse(priceData)) {
                    if (assetType === 'crypto') {
                        const quote = priceData["Realtime Currency Exchange Rate"];
                        if (quote?.["5. Exchange Rate"]) {
                            output.price = parseFloat(quote["5. Exchange Rate"]).toFixed(2);
                        }
                    } else {
                        const quote = priceData["Global Quote"];
                        if (quote?.["05. price"]) {
                            output.price = parseFloat(quote["05. price"]).toFixed(2);
                        }
                    }
                }
            }

            if (!output.price) {
                output.errors?.push("Price data unavailable");
            }

            // Parse indicators
            (Object.keys(INDICATOR_CONFIG) as IndicatorName[]).forEach((key, index) => {
                const result = indicatorResults[index];
                const parsedData = parseIndicatorResponse(result, key, cleanSymbol);
                
                if (parsedData) {
                    if (key === 'bbands') {
                        output.bollingerBands = parsedData;
                    } else {
                        (output as any)[key] = parsedData;
                    }
                } else {
                    output.errors?.push(`${key.toUpperCase()} data unavailable`);
                }
            });

            // Clean up empty errors array
            if (output.errors?.length === 0) {
                delete output.errors;
            }

            return output;

        } catch (error: any) {
            console.error(`Critical error fetching data for ${cleanSymbol}:`, error.message);
            throw new Error(`Failed to fetch market data: ${error.message}`);
        }
    },
});