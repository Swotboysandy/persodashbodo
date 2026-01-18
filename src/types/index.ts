// Types for the Personal Dashboard

export interface Transaction {
    id: string;
    source: string;
    amount: number;
    tags: string[];
    date: string;
    month: string;
    type: 'income' | 'expense';
}

export interface MonthlySummary {
    month: string;
    income: number;
    expenses: number;
    net: number;
}

export interface Movie {
    id: string;
    title: string;
    status: 'to-watch' | 'watching' | 'watched';
    rating?: number;
    notes?: string;
    genre?: string;
    addedDate: string;
    // Enhanced metadata from OMDb
    imdbId?: string;
    poster?: string;
    plot?: string;
    cast?: string[];
    releaseYear?: number;
    imdbRating?: number;
    director?: string;
    runtime?: string;
}

export interface Note {
    id: string;
    title: string;
    content: string;
    category: string;
    createdAt: string;
    updatedAt: string;
}

export interface Password {
    id: string;
    site: string;
    username: string;
    password: string;
    category: string;
    notes?: string;
    createdAt: string;
}

export type InvestmentType = 'STOCK' | 'MF' | 'SIP' | 'EPF';

export interface Stock {
    id: string;
    symbol: string;
    name: string;
    type: InvestmentType;
    quantity: number; // For SIPs, this is total units
    buyPrice: number; // For SIPs, this can be average NAV
    currentPrice: number;
    // SIP specific fields
    sipAmount?: number;
    sipDate?: number;
    totalInvested?: number; // Explicit field for SIPs where quantity * buyPrice might not match
    // Indian Mutual Fund specific
    schemeCode?: string; // For MFapi.in
    priceHistory?: PriceSnapshot[];
}

export interface PriceSnapshot {
    date: string;
    price: number;
}

export interface FinanceSettings {
    balance: number;
    salary: number;
    currency: string;
}

export const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export const EXPENSE_TAGS = [
    'Rent/Mortgage', 'Utilities', 'Family', 'Retail', 'loan', 'Marksheet',
    'Education', 'Food', 'Transport', 'Entertainment', 'Healthcare', 'Other'
];

export const INCOME_TAGS = ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'];

export const MOVIE_GENRES = [
    'Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Romance',
    'Documentary', 'Thriller', 'Animation', 'Other'
];

export const NOTE_CATEGORIES = ['Personal', 'Work', 'Ideas', 'Tasks', 'Other'];

export const PASSWORD_CATEGORIES = ['Social', 'Banking', 'Email', 'Shopping', 'Work', 'Other'];
