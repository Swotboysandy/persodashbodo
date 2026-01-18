'use client';

import { useState, useEffect } from 'react';
import { IoLockClosedOutline, IoKeyOutline, IoCheckmarkCircleOutline, IoWarningOutline } from 'react-icons/io5';

interface LockScreenProps {
    onUnlock: () => void;
}

export default function LockScreen({ onUnlock }: LockScreenProps) {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [isSetupMode, setIsSetupMode] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Check if PIN exists
        const storedPin = localStorage.getItem('app_pin');
        if (!storedPin) {
            setIsSetupMode(true);
        }
    }, []);

    const handleUnlock = async () => {
        setError('');
        setIsLoading(true);

        const storedPin = localStorage.getItem('app_pin');

        if (isSetupMode) {
            if (pin.length < 4) {
                setError('PIN too short (min 4 digits)');
                setIsLoading(false);
                return;
            }
            // Save new PIN
            localStorage.setItem('app_pin', pin);
            setIsSetupMode(false);
            setPin('');
            // Trigger Sync optional? For now just unlock
            onUnlock();
        } else {
            // Verify PIN
            if (pin === storedPin) {
                // Set 30-day session
                const expiry = Date.now() + (30 * 24 * 60 * 60 * 1000);
                localStorage.setItem('session_expiry', expiry.toString());
                onUnlock();
            } else {
                setError('Incorrect PIN');
            }
        }
        setIsLoading(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleUnlock();
        }
    };

    return (
        <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-[#0d0d10] text-white">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#1f1f25_0%,_#0d0d10_60%)]" />
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#ffffff10] to-transparent" />

            <div className="relative w-full max-w-[450px] px-12 py-16 text-center bg-[#16161a]/80 backdrop-blur-xl border border-[#2a2a30] rounded-[2.5rem] shadow-[0_0_60px_-15px_rgba(0,0,0,0.8)] flex flex-col items-center gap-8">

                {/* Header Section */}
                <div className="flex flex-col items-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#0d0d10] border border-[#2a2a30] shadow-inner text-white">
                        <IoLockClosedOutline size={32} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
                            {isSetupMode ? 'Create Passcode' : 'Welcome Back'}
                        </h1>
                        <p className="text-sm text-[#888890] leading-relaxed max-w-[280px] mx-auto">
                            {isSetupMode
                                ? 'Set a secure PIN to encrypt your personal data.'
                                : 'Enter your PIN to decrypt and access your brain.'}
                        </p>
                    </div>
                </div>

                {/* Input Section */}
                <div className="relative w-full max-w-[280px] group">
                    <input
                        type="password"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="••••"
                        className="w-full rounded-2xl bg-[#0d0d10] border border-[#2a2a30] py-6 text-center text-3xl font-bold tracking-[0.8em] text-white placeholder-[#2a2a30] focus:border-white/20 focus:outline-none focus:ring-4 focus:ring-white/5 transition-all group-hover:border-[#3a3a40]"
                        autoFocus
                        maxLength={8}
                    />
                </div>

                {error && (
                    <div className="w-full flex items-center justify-center gap-2 text-sm text-red-500 bg-red-500/10 py-3 rounded-xl animate-pulse">
                        <IoWarningOutline /> {error}
                    </div>
                )}

                {/* Actions Section */}
                <div className="w-full flex flex-col items-center gap-4">
                    <button
                        onClick={handleUnlock}
                        disabled={isLoading || pin.length === 0}
                        className="w-full max-w-[280px] rounded-xl bg-white py-5 text-black font-bold text-lg hover:bg-[#e0e0e0] disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]"
                    >
                        {isLoading ? 'Decrypting...' : (isSetupMode ? 'Set PIN' : 'Unlock Dashboard')}
                    </button>

                    {isSetupMode && (
                        <button
                            onClick={async () => {
                                if (pin.length < 4) {
                                    setError('Enter a PIN first');
                                    return;
                                }
                                setIsLoading(true);
                                setError('');
                                try {
                                    const res = await fetch('/api/sync/load', {
                                        method: 'POST',
                                        body: JSON.stringify({ pin }),
                                        headers: { 'Content-Type': 'application/json' }
                                    });
                                    const data = await res.json();

                                    if (data.success && data.data) {
                                        // Restore logic...
                                        const { transactions, movies, notes, passwords, settings } = data.data;
                                        if (transactions) localStorage.setItem('transactions', transactions);
                                        if (movies) localStorage.setItem('movies', movies);
                                        if (notes) localStorage.setItem('notes', notes);
                                        if (passwords) localStorage.setItem('passwords', passwords);
                                        if (settings?.startingBalance) localStorage.setItem('startingBalance', settings.startingBalance);
                                        if (settings?.monthlySalary) localStorage.setItem('monthlySalary', settings.monthlySalary);

                                        localStorage.setItem('app_pin', pin);

                                        // Set 30-day session
                                        const expiry = Date.now() + (30 * 24 * 60 * 60 * 1000);
                                        localStorage.setItem('session_expiry', expiry.toString());

                                        onUnlock();
                                        window.location.reload();
                                    } else {
                                        setError('No backup found');
                                    }
                                } catch (e) {
                                    setError('Connection failed');
                                }
                                setIsLoading(false);
                            }}
                            className="text-xs text-[#666670] hover:text-white transition-colors py-2"
                        >
                            Recover from Cloud Backup
                        </button>
                    )}
                </div>
            </div>

            <div className="absolute bottom-8 text-[#333338] text-xs font-mono">
                ENCRYPTED • LOCAL • SECURE
            </div>
        </div>
    );
}
