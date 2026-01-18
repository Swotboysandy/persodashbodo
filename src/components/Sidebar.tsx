'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    IoGridOutline,
    IoWalletOutline,
    IoFilmOutline,
    IoDocumentTextOutline,
    IoLockClosedOutline,
    IoSettingsOutline,
    IoPlanetOutline,
    IoTrendingUpOutline,
    IoMenuOutline,
    IoCloseOutline
} from 'react-icons/io5';

const navItems = [
    { href: '/', label: 'Dashboard', icon: IoGridOutline },
    { href: '/finance', label: 'Finance', icon: IoWalletOutline },
    { href: '/movies', label: 'Movies', icon: IoFilmOutline },
    { href: '/notes', label: 'Notes', icon: IoDocumentTextOutline },
    { href: '/passwords', label: 'Passwords', icon: IoLockClosedOutline },
    { href: '/stocks', label: 'Stocks', icon: IoTrendingUpOutline },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // Close sidebar on route change
    useEffect(() => {
        setIsMobileOpen(false);
    }, [pathname]);

    return (
        <>
            {/* Mobile Header Button */}
            <button
                className="mobile-menu-btn"
                onClick={() => setIsMobileOpen(true)}
                aria-label="Open Menu"
            >
                <IoMenuOutline size={24} />
            </button>

            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            <aside className={`sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar-header-row">
                    <div className="sidebar-logo">
                        <IoPlanetOutline size={24} />
                        <h1>My Dashboard</h1>
                    </div>
                    {/* Mobile Close Button */}
                    <button
                        className="mobile-close-btn"
                        onClick={() => setIsMobileOpen(false)}
                    >
                        <IoCloseOutline size={24} />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href ||
                            (item.href !== '/' && pathname.startsWith(item.href));

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`nav-item ${isActive ? 'active' : ''}`}
                            >
                                <Icon size={18} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid var(--border-color)' }}>
                    <Link href="/settings" className="nav-item">
                        <IoSettingsOutline size={18} />
                        <span>Settings</span>
                    </Link>
                </div>
            </aside>
        </>
    );
}
