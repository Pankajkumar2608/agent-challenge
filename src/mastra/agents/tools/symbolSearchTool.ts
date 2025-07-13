import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import axios from "axios";
import { ALPHA_VANTAGE_API_KEY } from "../../config";

const BASE_URL = "https://www.alphavantage.co/query";

export const symbolSearchTool = createTool({
    id: "symbol_search",
    description: "Searches for any financial asset. It automatically formats symbols to be ready for the market data tool.",
    
    inputSchema: z.object({
        keywords: z.string().describe("The name or keywords to search for (e.g., 'doge coin', 'Apple')."),
    }),

    outputSchema: z.object({
        results: z.array(z.object({
            // This symbol is now ALWAYS ready for the next tool.
            symbol: z.string().describe("The final, fully formatted ticker symbol, ready for 'fetch_market_data'."),
            name: z.string(),
            type: z.string().describe("The type of asset: 'Cryptocurrency', 'Equity', 'Index', etc."),
            region: z.string(),
        })),
    }),

    execute: async ({ context }) => {
        const { keywords } = context;
        console.log(`[Tool] Searching for symbol with keywords: ${keywords}`);
        
        try {
            const response = await axios.get(BASE_URL, {
                params: {
                    function: 'SYMBOL_SEARCH',
                    keywords,
                    apikey: ALPHA_VANTAGE_API_KEY
                }
            });

            const data = response.data;
            if (!data.bestMatches || data.bestMatches.length === 0) {
                console.log(`[Tool] No symbol found for keywords: ${keywords}`);
                return { results: [] };
            }
            
            // --- THE CRITICAL IMPROVEMENT IS HERE ---
            const results = data.bestMatches.map((match: any) => {
                let finalSymbol = match["1. symbol"];
                const assetType = match["3. type"];

                // If it's a crypto, format it correctly right here in the tool.
                if (assetType === 'Cryptocurrency' && !finalSymbol.endsWith('USD')) {
                    finalSymbol = `${finalSymbol}USD`;
                    console.log(`[Tool] Transformed crypto symbol to: ${finalSymbol}`);
                }

                return {
                    symbol: finalSymbol,
                    name: match["2. name"],
                    type: assetType,
                    region: match["4. region"],
                };
            });

            console.log(`[Tool] Found and formatted ${results.length} matches for "${keywords}".`);
            return { results };

        } catch (error: any) {
            console.error(`[Tool] Error searching for symbol "${keywords}":`, error.message);
            throw new Error(`Failed to search for symbol: ${error.message}`);
        }
    },
});