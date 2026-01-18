'use client';

import { useEffect, useCallback } from 'react';
import AIInput from './AIInput';
import { Transaction, Movie, Note, Password } from '@/types';

export default function AIWrapper() {
    const handleDataCreated = useCallback((type: string, data: unknown) => {
        // Get existing data from localStorage
        let storageKey: string;

        switch (type) {
            case 'transaction':
                storageKey = 'transactions';
                const forcedBalance = (data as any).forcedBalance;

                if (typeof forcedBalance === 'number') {
                    // 1. Save the new transaction first
                    const existing = localStorage.getItem(storageKey);
                    const existingData = existing ? JSON.parse(existing) : [];
                    const updatedData = [data, ...existingData];
                    localStorage.setItem(storageKey, JSON.stringify(updatedData));

                    // 2. Check if correction is needed
                    const currentBalance = (updatedData as Transaction[]).reduce((acc, t) => {
                        return t.type === 'income' ? acc + t.amount : acc - t.amount;
                    }, 0);

                    const difference = forcedBalance - currentBalance;

                    if (Math.abs(difference) >= 1) {
                        const correctionTransaction: Transaction = {
                            id: crypto.randomUUID(),
                            source: 'Balance Correction (Auto)',
                            amount: Math.abs(difference),
                            type: difference > 0 ? 'income' : 'expense',
                            tags: ['Other'],
                            date: new Date().toISOString().split('T')[0],
                            month: new Date().toLocaleString('default', { month: 'long' })
                        };
                        updatedData.unshift(correctionTransaction);
                        localStorage.setItem(storageKey, JSON.stringify(updatedData));

                        // Notify correction
                        window.dispatchEvent(new CustomEvent('dashboard-data-updated', {
                            detail: { type: 'transaction', data: correctionTransaction }
                        }));
                    }

                    window.dispatchEvent(new CustomEvent('dashboard-data-updated', {
                        detail: { type, data }
                    }));
                    window.location.reload();
                    return; // Handled completely
                }
                break;
            case 'movie':
                storageKey = 'movies';
                break;
            case 'note':
                storageKey = 'notes';
                break;
            case 'password':
                storageKey = 'passwords';
                break;
            case 'investment':
                storageKey = 'stocks';
                break;
            case 'balance_update':
                // Special handling for balance correction
                const targetBalance = (data as any).balance;
                const transactionsStr = localStorage.getItem('transactions');
                const transactions: Transaction[] = transactionsStr ? JSON.parse(transactionsStr) : [];

                const currentBalance = transactions.reduce((acc, t) => {
                    return t.type === 'income' ? acc + t.amount : acc - t.amount;
                }, 0);

                const difference = targetBalance - currentBalance;

                if (Math.abs(difference) < 1) {
                    // Difference is negligible
                    return;
                }

                const correctionTransaction: Transaction = {
                    id: crypto.randomUUID(), // using native uuid or generateId if imported
                    source: 'Balance Correction',
                    amount: Math.abs(difference),
                    type: difference > 0 ? 'income' : 'expense',
                    tags: ['Other'],
                    date: new Date().toISOString().split('T')[0],
                    month: new Date().toLocaleString('default', { month: 'long' }) // Simple month extraction
                };

                // Save correction
                const updatedTransactions = [correctionTransaction, ...transactions];
                localStorage.setItem('transactions', JSON.stringify(updatedTransactions));

                // Dispatch event and reload
                window.dispatchEvent(new CustomEvent('dashboard-data-updated', {
                    detail: { type: 'transaction', data: correctionTransaction }
                }));
                window.location.reload();
                return; // Early return as we handled specific logic

            default:
                return;
        }

        try {
            const existing = localStorage.getItem(storageKey);
            const existingData = existing ? JSON.parse(existing) : [];

            // Add new item to the beginning
            const updatedData = [data, ...existingData];

            // Save back to localStorage
            localStorage.setItem(storageKey, JSON.stringify(updatedData));

            // Dispatch a custom event to notify other components
            window.dispatchEvent(new CustomEvent('dashboard-data-updated', {
                detail: { type, data }
            }));

            // Force a page refresh to show the new data
            // This is a simple approach - a more sophisticated one would use React Context
            window.location.reload();
        } catch (error) {
            console.error('Failed to save data:', error);
        }
    }, []);

    return <AIInput onDataCreated={handleDataCreated} />;
}
