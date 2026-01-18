'use client';

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import AIWrapper from "@/components/AIWrapper";
import ClickSpark from "@/components/ClickSpark";
import LockScreen from "@/components/LockScreen";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const [isLocked, setIsLocked] = useState(true);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);

        // Smart Session Check
        const expiry = localStorage.getItem('session_expiry');
        if (expiry && parseInt(expiry) > Date.now()) {
            setIsLocked(false);
        }
    }, []);

    if (!isMounted) return null; // Prevent hydration mismatch

    // Check if we are potentially on a public page?
    // For this personal dashboard, everything is protected.

    return (
        <>
            <div className="bg-grain" />

            {isLocked ? (
                <LockScreen onUnlock={() => setIsLocked(false)} />
            ) : (
                <>
                    <ClickSpark sparkColor="#ffffff" sparkCount={8} sparkRadius={15}>
                        <div className="app-container">
                            <Sidebar />
                            <main className="main-content">
                                {children}
                            </main>
                        </div>
                    </ClickSpark>
                    <AIWrapper />
                </>
            )}
        </>
    );
}
