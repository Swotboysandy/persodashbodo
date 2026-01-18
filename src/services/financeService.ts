
import { Stock } from '@/types';

export const searchSymbols = async (query: string) => {
    if (!query) return [];
    try {
        const res = await fetch(`/api/finance/search?query=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error('Failed to search');
        const data = await res.json();
        return data.quotes || [];
    } catch (error) {
        console.error(error);
        return [];
    }
};

export const getQuote = async (symbol: string) => {
    if (!symbol) return null;
    try {
        const res = await fetch(`/api/finance/quote?symbol=${encodeURIComponent(symbol)}`);
        if (!res.ok) throw new Error('Failed to fetch quote');
        return await res.json();
    } catch (error) {
        console.error(error);
        return null;
    }
};

// Indian Mutual Fund API functions
export const searchMutualFunds = async (query: string) => {
    if (!query) return [];
    try {
        const res = await fetch(`/api/finance/mf?action=search&query=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error('Failed to search mutual funds');
        const data = await res.json();
        return data;
    } catch (error) {
        console.error(error);
        return [];
    }
};

export const getMutualFundNAV = async (schemeCode: string) => {
    if (!schemeCode) return null;
    try {
        const res = await fetch(`/api/finance/mf?action=nav&schemeCode=${encodeURIComponent(schemeCode)}`);
        if (!res.ok) throw new Error('Failed to fetch NAV');
        return await res.json();
    } catch (error) {
        console.error(error);
        return null;
    }
};

export const getMutualFundHistory = async (schemeCode: string) => {
    if (!schemeCode) return null;
    try {
        const res = await fetch(`/api/finance/mf?action=history&schemeCode=${encodeURIComponent(schemeCode)}`);
        if (!res.ok) throw new Error('Failed to fetch history');
        return await res.json();
    } catch (error) {
        console.error(error);
        return null;
    }
};

export const refreshPortfolio = async (investments: Stock[]): Promise<Stock[]> => {
    const updated = await Promise.all(investments.map(async (inv) => {
        // Check if it's an Indian mutual fund
        if (inv.schemeCode) {
            const navData = await getMutualFundNAV(inv.schemeCode);
            if (navData && navData.data && navData.data.length > 0) {
                const latestNav = parseFloat(navData.data[0].nav);
                return {
                    ...inv,
                    currentPrice: latestNav,
                    name: navData.meta?.scheme_name || inv.name
                };
            }
        } else {
            // Regular stock via Yahoo Finance
            const quote = await getQuote(inv.symbol);
            if (quote && quote.regularMarketPrice) {
                return {
                    ...inv,
                    currentPrice: quote.regularMarketPrice,
                    name: quote.longName || quote.shortName || inv.name
                };
            }
        }
        return inv;
    }));
    return updated;
};
