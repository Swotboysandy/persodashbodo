'use client';

import { useState, useRef, useEffect } from 'react';
import {
    IoSettingsOutline,
    IoDownloadOutline,
    IoCloudUploadOutline,
    IoTrashOutline,
    IoCheckmarkOutline,
    IoWalletOutline,
    IoSaveOutline
} from 'react-icons/io5';

export default function SettingsPage() {
    const [exportStatus, setExportStatus] = useState<string | null>(null);
    const [importStatus, setImportStatus] = useState<string | null>(null);
    const [balanceStatus, setBalanceStatus] = useState<string | null>(null);
    const [startingBalance, setStartingBalance] = useState<string>('0');
    const [monthlySalary, setMonthlySalary] = useState<string>('0');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load saved settings on mount
    useEffect(() => {
        const savedBalance = localStorage.getItem('startingBalance');
        const savedSalary = localStorage.getItem('monthlySalary');
        if (savedBalance) setStartingBalance(savedBalance);
        if (savedSalary) setMonthlySalary(savedSalary);
    }, []);

    const saveFinanceSettings = () => {
        localStorage.setItem('startingBalance', startingBalance);
        localStorage.setItem('monthlySalary', monthlySalary);
        setBalanceStatus('Settings saved successfully!');
        setTimeout(() => setBalanceStatus(null), 3000);
    };

    const exportData = () => {
        const data = {
            transactions: localStorage.getItem('transactions'),
            movies: localStorage.getItem('movies'),
            notes: localStorage.getItem('notes'),
            passwords: localStorage.getItem('passwords'),
            stocks: localStorage.getItem('stocks'),
            dashboardLayout: localStorage.getItem('dashboard_card_order'),
            startingBalance: localStorage.getItem('startingBalance'),
            monthlySalary: localStorage.getItem('monthlySalary'),
            exportedAt: new Date().toISOString(),
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setExportStatus('Data exported successfully!');
        setTimeout(() => setExportStatus(null), 3000);
    };

    const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target?.result as string);

                if (data.transactions) localStorage.setItem('transactions', data.transactions);
                if (data.movies) localStorage.setItem('movies', data.movies);
                if (data.notes) localStorage.setItem('notes', data.notes);
                if (data.passwords) localStorage.setItem('passwords', data.passwords);
                if (data.stocks) localStorage.setItem('stocks', data.stocks);
                if (data.dashboardLayout) localStorage.setItem('dashboard_card_order', data.dashboardLayout);
                if (data.startingBalance) localStorage.setItem('startingBalance', data.startingBalance);
                if (data.monthlySalary) localStorage.setItem('monthlySalary', data.monthlySalary);

                setImportStatus('Data imported successfully! Refresh the page to see changes.');
                setTimeout(() => setImportStatus(null), 5000);
            } catch (err) {
                setImportStatus('Failed to import data. Invalid file format.');
                setTimeout(() => setImportStatus(null), 3000);
            }
        };
        reader.readAsText(file);

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const clearAllData = () => {
        if (confirm('Are you sure you want to delete ALL data? This cannot be undone!')) {
            if (confirm('This will permanently delete all transactions, movies, notes, and passwords. Continue?')) {
                localStorage.removeItem('transactions');
                localStorage.removeItem('movies');
                localStorage.removeItem('notes');
                localStorage.removeItem('passwords');
                localStorage.removeItem('startingBalance');
                localStorage.removeItem('monthlySalary');
                window.location.reload();
            }
        }
    };

    const formatCurrency = (value: string) => {
        const num = parseFloat(value) || 0;
        return num.toLocaleString('en-IN', {
            style: 'currency',
            currency: 'INR'
        });
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">
                    <IoSettingsOutline size={24} />
                    Settings
                </h1>
            </div>

            <div className="settings-grid">
                {/* Finance Settings */}
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(136, 192, 208, 0.1)',
                            color: 'var(--accent-blue)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <IoWalletOutline size={18} />
                        </div>
                        <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Finance Settings</h2>
                    </div>

                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
                        Configure your starting balance and monthly income for accurate financial tracking.
                    </p>

                    <div className="form-group">
                        <label className="form-label">Starting Balance (From Previous Month)</label>
                        <input
                            type="number"
                            className="form-input"
                            value={startingBalance}
                            onChange={(e) => setStartingBalance(e.target.value)}
                            placeholder="0"
                        />
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                            Current value: {formatCurrency(startingBalance)}
                        </p>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Monthly Salary / Income</label>
                        <input
                            type="number"
                            className="form-input"
                            value={monthlySalary}
                            onChange={(e) => setMonthlySalary(e.target.value)}
                            placeholder="0"
                        />
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                            Current value: {formatCurrency(monthlySalary)}
                        </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
                        <button className="btn btn-primary" onClick={saveFinanceSettings}>
                            <IoSaveOutline size={16} /> Save Settings
                        </button>
                        {balanceStatus && (
                            <span style={{ color: 'var(--accent-green)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <IoCheckmarkOutline size={14} /> {balanceStatus}
                            </span>
                        )}
                    </div>
                </div>

            </div>

            {/* Cloud Sync */}
            <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(94, 129, 172, 0.1)',
                        color: 'var(--accent-blue)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <IoCloudUploadOutline size={18} />
                    </div>
                    <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Cloud Sync</h2>
                </div>

                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
                    Securely backup your data to the cloud. You can restore it on another device using your PIN.
                </p>

                <div className="setting-item">
                    <div>
                        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Manual Backup</h3>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Push current data to cloud storage.</p>
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={async () => {
                            const pin = localStorage.getItem('app_pin');
                            if (!pin) {
                                alert('Please set a PIN first (Reload page to see Lock Screen)');
                                return;
                            }

                            const btn = document.getElementById('sync-btn');
                            if (btn) btn.innerText = 'Syncing...';

                            try {
                                const data = {
                                    transactions: localStorage.getItem('transactions'),
                                    movies: localStorage.getItem('movies'),

                                    notes: localStorage.getItem('notes'),
                                    passwords: localStorage.getItem('passwords'),
                                    stocks: localStorage.getItem('stocks'),
                                    dashboardLayout: localStorage.getItem('dashboard_card_order'),
                                    settings: {
                                        startingBalance: localStorage.getItem('startingBalance'),
                                        monthlySalary: localStorage.getItem('monthlySalary')
                                    },
                                    syncedAt: new Date().toISOString()
                                };

                                const res = await fetch('/api/sync/save', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ pin, data })
                                });
                                const result = await res.json();

                                if (result.success) {
                                    setExportStatus('Cloud Sync Successful!');
                                    setTimeout(() => setExportStatus(null), 3000);
                                } else {
                                    alert('Sync Failed: ' + result.error);
                                }
                            } catch (e) {
                                alert('Sync Failed: Network Error');
                            }
                            if (btn) btn.innerHTML = '<svg .../> Sync Now'; // Reset (simplified)
                            if (btn) btn.innerText = 'Sync Now';
                        }}
                        id="sync-btn"
                    >
                        <IoCloudUploadOutline size={16} /> Sync Now
                    </button>
                </div>

                <div className="setting-item" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Restore from Cloud</h3>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Pull data from cloud (Overwrites local data).</p>
                    </div>
                    <button
                        className="btn btn-secondary"
                        onClick={async () => {
                            if (!confirm('This will OVERWRITE your current local data with the cloud backup. Are you sure?')) return;

                            const pin = localStorage.getItem('app_pin');
                            if (!pin) {
                                alert('Please set a PIN first');
                                return;
                            }

                            const btn = document.getElementById('restore-btn');
                            if (btn) btn.innerText = 'Restoring...';

                            try {
                                const res = await fetch('/api/sync/load', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ pin })
                                });
                                const result = await res.json();

                                if (result.success && result.data) {
                                    const { transactions, movies, notes, passwords, stocks, dashboardLayout, settings } = result.data;

                                    if (transactions) localStorage.setItem('transactions', transactions);
                                    if (movies) localStorage.setItem('movies', movies);
                                    if (notes) localStorage.setItem('notes', notes);
                                    if (passwords) localStorage.setItem('passwords', passwords);
                                    if (stocks) localStorage.setItem('stocks', stocks);
                                    if (dashboardLayout) localStorage.setItem('dashboard_card_order', dashboardLayout);
                                    if (settings?.startingBalance) localStorage.setItem('startingBalance', settings.startingBalance);
                                    if (settings?.monthlySalary) localStorage.setItem('monthlySalary', settings.monthlySalary);

                                    // Refresh session
                                    const expiry = Date.now() + (30 * 24 * 60 * 60 * 1000);
                                    localStorage.setItem('session_expiry', expiry.toString());

                                    alert('Data restored successfully!');
                                    window.location.reload();
                                } else {
                                    alert('Restore Failed: ' + (result.message || result.error));
                                }
                            } catch (e) {
                                alert('Restore Failed: Network Error');
                            }
                            if (btn) btn.innerText = 'Restore Now';
                        }}
                        id="restore-btn"
                    >
                        <IoDownloadOutline size={16} /> Restore Now
                    </button>
                </div>
            </div>

            {/* Data Management (Local) */}
            <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(136, 192, 208, 0.1)',
                        color: 'var(--accent-blue)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <IoDownloadOutline size={18} />
                    </div>
                    <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Local Import/Export</h2>
                </div>

                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
                    Export your data to JSON for backup or import data from a previous backup.
                </p>

                <div style={{ display: 'grid', gap: '16px' }}>
                    <div className="setting-item">
                        <div>
                            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Export Data</h3>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Download all your data as a JSON file.</p>
                        </div>
                        <button className="btn btn-secondary" onClick={exportData}>
                            <IoDownloadOutline size={16} /> Export
                        </button>
                    </div>

                    {exportStatus && (
                        <div style={{
                            padding: '8px 12px',
                            backgroundColor: 'rgba(163, 190, 140, 0.1)',
                            color: 'var(--accent-green)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <IoCheckmarkOutline size={14} />
                            {exportStatus}
                        </div>
                    )}

                    <div className="setting-item">
                        <div>
                            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>Import Data</h3>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Restore data from a backup file.</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                accept=".json"
                                onChange={importData}
                            />
                            <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
                                <IoCloudUploadOutline size={16} /> Import
                            </button>
                        </div>
                    </div>

                    {importStatus && (
                        <div style={{
                            padding: '8px 12px',
                            backgroundColor: 'rgba(163, 190, 140, 0.1)',
                            color: 'var(--accent-green)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <IoCheckmarkOutline size={14} />
                            {importStatus}
                        </div>
                    )}
                </div>
            </div>

            {/* Danger Zone */}
            <div className="card" style={{ borderColor: 'rgba(191, 97, 106, 0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(191, 97, 106, 0.1)',
                        color: 'var(--accent-red)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <IoTrashOutline size={18} />
                    </div>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--accent-red)' }}>Danger Zone</h2>
                </div>

                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
                    Permanently delete all your data. This action cannot be undone.
                </p>

                <button
                    className="btn"
                    style={{
                        backgroundColor: 'rgba(191, 97, 106, 0.1)',
                        color: 'var(--accent-red)',
                        border: '1px solid rgba(191, 97, 106, 0.2)',
                        width: '100%'
                    }}
                    onClick={clearAllData}
                >
                    <IoTrashOutline size={16} /> Clear All Data
                </button>
            </div>
        </div>

    );
}
