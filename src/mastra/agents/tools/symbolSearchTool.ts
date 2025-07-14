import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import axios from "axios";
import { ALPHA_VANTAGE_API_KEY } from "../../config";

const BASE_URL = "https://www.alphavantage.co/query";
const REQUEST_TIMEOUT = 15000;
const MAX_RETRIES = 2;

const ASSET_TYPE_MAP: Record<string, string> = {
    'Equity': 'stock',
    'ETF': 'stock',
    'Index': 'index',
    'Cryptocurrency': 'crypto',
    'Physical Currency': 'crypto'
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const makeRequest = async (url: string, params: any, retries = 0): Promise<any> => {
    try {
        const response = await axios.get(url, { 
            params, 
            timeout: REQUEST_TIMEOUT,
            headers: {
                'User-Agent': 'Trading-Bot/1.0'
            }
        });
        return response.data;
    } catch (error: any) {
        if (retries < MAX_RETRIES && (error.code === 'ECONNABORTED' || error.response?.status >= 500)) {
            console.warn(`Search request failed, retrying... (${retries + 1}/${MAX_RETRIES})`);
            await sleep(1000 * (retries + 1));
            return makeRequest(url, params, retries + 1);
        }
        throw error;
    }
};

const formatSymbolForAssetType = (symbol: string, assetType: string): string => {
    const cleanSymbol = symbol.trim().toUpperCase();
    
    switch (assetType) {
        case 'crypto':
            return cleanSymbol.endsWith('USD') ? cleanSymbol : `${cleanSymbol}USD`;
        case 'stock':
        case 'index':
            return cleanSymbol;
        default:
            return cleanSymbol;
    }
};

const validateSearchResult = (match: any): boolean => {
    return match && 
           match["1. symbol"] && 
           match["2. name"] && 
           match["3. type"] && 
           match["4. region"];
};

const normalizeAssetType = (apiType: string): string => {
    return ASSET_TYPE_MAP[apiType] || 'stock';
};

const filterResults = (results: any[], keywords: string): any[] => {
    const keywordLower = keywords.toLowerCase();
    
    return results
        .filter(result => {
            const nameMatch = result.name.toLowerCase().includes(keywordLower);
            const symbolMatch = result.symbol.toLowerCase().includes(keywordLower);
            return nameMatch || symbolMatch;
        })
        .sort((a, b) => {
            const aExact = a.symbol.toLowerCase() === keywordLower || a.name.toLowerCase() === keywordLower;
            const bExact = b.symbol.toLowerCase() === keywordLower || b.name.toLowerCase() === keywordLower;
            
            if (aExact && !bExact) return -1;
            if (!aExact && bExact) return 1;
            
            const aStartsWith = a.symbol.toLowerCase().startsWith(keywordLower) || a.name.toLowerCase().startsWith(keywordLower);
            const bStartsWith = b.symbol.toLowerCase().startsWith(keywordLower) || b.name.toLowerCase().startsWith(keywordLower);
            
            if (aStartsWith && !bStartsWith) return -1;
            if (!aStartsWith && bStartsWith) return 1;
            
            return 0;
        })
        .slice(0, 10);
};

export const symbolSearchTool = createTool({
    id: "symbol_search",
    description: "Searches for financial assets and returns formatted symbols ready for market data fetching.",
    
    inputSchema: z.object({
        keywords: z.string().min(1).max(100).describe("Search keywords (e.g., 'Apple', 'Bitcoin', 'SPY')"),
    }),

    outputSchema: z.object({
        results: z.array(z.object({
            symbol: z.string().describe("Formatted ticker symbol ready for market data tool"),
            name: z.string(),
            type: z.string().describe("Normalized asset type: 'stock', 'crypto', or 'index'"),
            region: z.string(),
            originalType: z.string().describe("Original API asset type")
        })),
        query: z.string(),
        totalFound: z.number()
    }),

    execute: async ({ context }) => {
        const { keywords } = context;
        const cleanKeywords = keywords.trim();
        
        if (!cleanKeywords) {
            throw new Error("Search keywords cannot be empty");
        }

        console.log(`Searching for: "${cleanKeywords}"`);
        
        try {
            const data = await makeRequest(BASE_URL, {
                function: 'SYMBOL_SEARCH',
                keywords: cleanKeywords,
                apikey: ALPHA_VANTAGE_API_KEY
            });

            if (data.Note) {
                throw new Error(`API limit reached: ${data.Note}`);
            }

            if (data['Error Message']) {
                throw new Error(`API error: ${data['Error Message']}`);
            }

            if (!data.bestMatches || !Array.isArray(data.bestMatches)) {
                console.log(`No matches found for: "${cleanKeywords}"`);
                return { 
                    results: [], 
                    query: cleanKeywords,
                    totalFound: 0 
                };
            }

            const validMatches = data.bestMatches.filter(validateSearchResult);
            
            if (validMatches.length === 0) {
                console.log(`No valid matches found for: "${cleanKeywords}"`);
                return { 
                    results: [], 
                    query: cleanKeywords,
                    totalFound: 0 
                };
            }

            let results = validMatches.map((match: any) => {
                const originalType = match["3. type"];
                const normalizedType = normalizeAssetType(originalType);
                const originalSymbol = match["1. symbol"];
                const formattedSymbol = formatSymbolForAssetType(originalSymbol, normalizedType);

                return {
                    symbol: formattedSymbol,
                    name: match["2. name"],
                    type: normalizedType,
                    region: match["4. region"],
                    originalType
                };
            });

            results = filterResults(results, cleanKeywords);

            console.log(`Found ${results.length} relevant matches for "${cleanKeywords}"`);
            
            return { 
                results, 
                query: cleanKeywords,
                totalFound: results.length 
            };

        } catch (error: any) {
            console.error(`Search failed for "${cleanKeywords}":`, error.message);
            
            if (error.message.includes('API limit')) {
                throw new Error('API rate limit exceeded. Please try again later.');
            }
            
            throw new Error(`Search failed: ${error.message}`);
        }
    },
});