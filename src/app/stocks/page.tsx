'use client';

import { useState, useEffect } from 'react';
import {
    IoAddOutline,
    IoTrashOutline,
    IoPencilOutline,
    IoTrendingUpOutline,
    IoTrendingDownOutline,
    IoWalletOutline,
    IoRefreshOutline,
    IoSearchOutline,
    IoTimeOutline
} from 'react-icons/io5';
import { Stock, InvestmentType, Transaction } from '@/types';
import { useLocalStorage, generateId, formatCurrency } from '@/hooks/useLocalStorage';
import Modal from '@/components/Modal';
import { searchSymbols, getQuote, refreshPortfolio, searchMutualFunds, getMutualFundNAV } from '@/services/financeService';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

export default function StocksPage() {
    const [stocks, setStocks] = useLocalStorage<Stock[]>('stocks', []);
    const [transactions] = useLocalStorage<Transaction[]>('transactions', []);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStock, setEditingStock] = useState<Stock | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [investmentType, setInvestmentType] = useState<InvestmentType>('STOCK');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [formData, setFormData] = useState({
        symbol: '',
        name: '',
        quantity: '', // For SIP: Total Units
        buyPrice: '', // For SIP: Avg NAV
        currentPrice: '',
        sipAmount: '',
        sipDate: '',
        totalInvested: '', // Manual override for SIPs
        schemeCode: '' // For Indian MFs
    });

    // Portfolio Calculations
    const totalInvestment = stocks.reduce((sum, stock) => {
        // Exclude stocks with 0 current price from total investment calculation
        // to prevent skewing the "All time" return percentage
        if (stock.currentPrice === 0) return sum;

        if (stock.type === 'SIP' || stock.type === 'MF') {
            return sum + (stock.totalInvested || (stock.quantity * stock.buyPrice));
        }
        return sum + (stock.quantity * stock.buyPrice);
    }, 0);

    const currentValue = stocks.reduce((sum, stock) => sum + (stock.quantity * stock.currentPrice), 0);
    const profitLoss = currentValue - totalInvestment;

    const allocationData = stocks.map(s => ({
        name: s.symbol,
        value: s.quantity > 0 ? (s.quantity * s.currentPrice) : (s.totalInvested || 0)
    })).filter(d => d.value > 0);

    // Wallet Balance Calculation
    const walletBalance = transactions.reduce((acc, t) => {
        return t.type === 'income' ? acc + t.amount : acc - t.amount;
    }, 0);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

    const handleRefreshPrices = async () => {
        setIsLoading(true);
        try {
            const updatedStocks = await refreshPortfolio(stocks);
            setStocks(updatedStocks);
        } catch (error) {
            console.error("Failed to refresh portfolio", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSymbolSearch = async (query: string) => {
        setFormData(prev => ({ ...prev, symbol: query }));
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        try {
            // Search both stocks and mutual funds
            const [stockResults, mfResults] = await Promise.all([
                searchSymbols(query),
                investmentType !== 'STOCK' ? searchMutualFunds(query) : Promise.resolve([])
            ]);

            // Format MF results to match stock results structure
            const formattedMFResults = mfResults.map((mf: any) => ({
                symbol: mf.schemeCode,
                schemeCode: mf.schemeCode,
                longName: mf.schemeName,
                exchange: 'MF',
                quoteType: 'MUTUALFUND'
            }));

            setSearchResults([...stockResults, ...formattedMFResults]);
        } finally {
            setIsSearching(false);
        }
    };

    const selectSymbol = async (result: any) => {
        const isMutualFund = result.quoteType === 'MUTUALFUND';

        setFormData(prev => ({
            ...prev,
            symbol: isMutualFund ? result.longName : result.symbol,
            name: result.longName || result.shortName || result.symbol,
            schemeCode: result.schemeCode || ''
        }));
        setSearchResults([]);

        // Auto-fetch price
        if (isMutualFund && result.schemeCode) {
            const navData = await getMutualFundNAV(result.schemeCode);
            if (navData?.data?.[0]?.nav) {
                setFormData(prev => ({
                    ...prev,
                    currentPrice: navData.data[0].nav,
                    buyPrice: navData.data[0].nav // Set buy price same as current for new additions
                }));
            }
        } else {
            const quote = await getQuote(result.symbol);
            if (quote?.regularMarketPrice) {
                setFormData(prev => ({
                    ...prev,
                    currentPrice: quote.regularMarketPrice.toString()
                }));
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const quantity = Number(formData.quantity);
        const buyPrice = Number(formData.buyPrice);
        const currentPrice = Number(formData.currentPrice);

        // For SIPs, calculate total invested if not provided
        let totalInvested = Number(formData.totalInvested);
        if (!totalInvested && (investmentType === 'STOCK')) {
            totalInvested = quantity * buyPrice;
        } else if (!totalInvested && investmentType !== 'STOCK') {
            // If user didn't enter total invested for SIP, assume avg price calculation
            totalInvested = quantity * buyPrice;
        }

        const newStock: Stock = {
            id: editingStock ? editingStock.id : generateId(),
            symbol: formData.symbol.toUpperCase(),
            name: formData.name,
            type: investmentType,
            quantity,
            buyPrice,
            currentPrice,
            sipAmount: formData.sipAmount ? Number(formData.sipAmount) : undefined,
            sipDate: formData.sipDate ? Number(formData.sipDate) : undefined,
            totalInvested,
            schemeCode: formData.schemeCode || undefined
        };

        if (editingStock) {
            setStocks(prev => prev.map(s => s.id === editingStock.id ? newStock : s));
        } else {
            setStocks(prev => [newStock, ...prev]);
        }

        closeModal();
    };

    const deleteStock = (id: string) => {
        if (confirm('Are you sure you want to remove this investment?')) {
            setStocks(prev => prev.filter(s => s.id !== id));
        }
    };

    const openModal = (stock?: Stock) => {
        if (stock) {
            setEditingStock(stock);
            setInvestmentType(stock.type || 'STOCK'); // Handle legacy data
            setFormData({
                symbol: stock.symbol,
                name: stock.name,
                quantity: stock.quantity.toString(),
                buyPrice: stock.buyPrice.toString(),
                currentPrice: stock.currentPrice.toString(),
                sipAmount: stock.sipAmount?.toString() || '',
                sipDate: stock.sipDate?.toString() || '',
                totalInvested: stock.totalInvested?.toString() || '',
                schemeCode: stock.schemeCode || ''
            });
        } else {
            setEditingStock(null);
            setInvestmentType('STOCK');
            setFormData({
                symbol: '',
                name: '',
                quantity: '',
                buyPrice: '',
                currentPrice: '',
                sipAmount: '',
                sipDate: '',
                totalInvested: '',
                schemeCode: ''
            });
        }
        setSearchResults([]);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingStock(null);
        setSearchResults([]);
    };

    return (
        <div className="fade-in">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">
                        <IoTrendingUpOutline style={{ color: 'var(--accent-green)' }} />
                        Investment Portfolio
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '14px' }}>
                        Track and manage your stocks, mutual funds, and SIPs.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        className="btn btn-secondary"
                        onClick={handleRefreshPrices}
                        disabled={isLoading}
                    >
                        <IoRefreshOutline className={isLoading ? "animate-spin" : ""} size={16} />
                        {isLoading ? 'Updating...' : 'Refresh'}
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={() => openModal()}
                    >
                        <IoAddOutline size={18} />
                        Add Investment
                    </button>
                </div>
            </div>

            {/* Stats Group */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                <div className="stat-card">
                    <div className="stat-card-label">
                        <IoWalletOutline size={14} style={{ display: 'inline', marginRight: '6px' }} />
                        Wallet Balance
                    </div>
                    <div className="stat-card-value">
                        {formatCurrency(walletBalance)}
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-label">
                        <IoTrendingUpOutline size={14} style={{ display: 'inline', marginRight: '6px' }} />
                        Total Invested
                    </div>
                    <div className="stat-card-value">
                        {formatCurrency(totalInvestment)}
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-label">
                        <IoTrendingUpOutline size={14} style={{ display: 'inline', marginRight: '6px' }} />
                        Current Value
                    </div>
                    <div className="stat-card-value">
                        {formatCurrency(currentValue)}
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-label">
                        {profitLoss >= 0 ? <IoTrendingUpOutline size={14} style={{ display: 'inline', marginRight: '6px' }} /> : <IoTrendingDownOutline size={14} style={{ display: 'inline', marginRight: '6px' }} />}
                        Returns
                    </div>
                    <div className={`stat-card-value ${profitLoss >= 0 ? 'positive' : 'negative'}`}>
                        {formatCurrency(profitLoss)}
                    </div>
                    <div style={{ fontSize: '12px', marginTop: '4px', color: profitLoss >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', opacity: 0.8 }}>
                        {totalInvestment > 0 ? ((profitLoss / totalInvestment) * 100).toFixed(2) : 0}% All time
                    </div>
                </div>
            </div>

            {/* Asset Allocation & Holdings Summary */}
            <div style={{ marginBottom: '32px' }}>
                <div className="card" style={{ maxWidth: '600px' }}> {/* Independent width */}
                    <div className="card-header">
                        <span className="card-title" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Asset Allocation</span>
                    </div>
                    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {/* Chart */}
                        <div style={{ width: '180px', height: '180px', position: 'relative' }}>
                            {allocationData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={allocationData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {allocationData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip
                                            contentStyle={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '12px' }}
                                            itemStyle={{ color: 'var(--text-primary)' }}
                                            formatter={(value: any) => formatCurrency(value)}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                                    No assets
                                </div>
                            )}
                        </div>

                        {/* Top Holdings List */}
                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '12px', color: 'var(--text-secondary)' }}>Top Allocations (SIPs/Stocks)</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {stocks
                                    .slice(0, 4) // Show top 4
                                    .map((stock) => (
                                        <div key={stock.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            {/* Logo */}
                                            <div style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '8px',
                                                background: `linear-gradient(135deg, ${stock.type === 'SIP' || stock.type === 'MF'
                                                    ? 'rgba(136, 192, 208, 0.2)'
                                                    : 'rgba(235, 203, 139, 0.2)'
                                                    }, ${stock.type === 'SIP' || stock.type === 'MF'
                                                        ? 'rgba(74, 139, 110, 0.2)'
                                                        : 'rgba(184, 90, 90, 0.2)'
                                                    })`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 700,
                                                fontSize: '12px',
                                                color: stock.type === 'SIP' || stock.type === 'MF'
                                                    ? 'var(--accent-blue)'
                                                    : 'var(--accent-yellow)',
                                                flexShrink: 0
                                            }}>
                                                {stock.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div style={{ minWidth: 0, flex: 1 }}>
                                                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stock.symbol}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stock.name}</div>
                                            </div>
                                        </div>
                                    ))}
                                {stocks.length === 0 && (
                                    <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic' }}>No holdings yet</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Investment List */}
            <div className="section-header" style={{ borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', marginTop: '32px' }}>
                <div className="section-title">
                    <IoTrendingUpOutline /> Holdings
                </div>
            </div>

            {stocks.length === 0 ? (
                <div className="empty-state card" style={{ borderRadius: '0 0 var(--radius-lg) var(--radius-lg)', borderTop: 'none' }}>
                    <IoTrendingUpOutline size={48} />
                    <h3 style={{ color: 'var(--text-primary)', fontSize: '18px', marginBottom: '8px' }}>Your portfolio is empty</h3>
                    <p>Start tracking your wealth by adding stocks, mutual funds, or SIPs.</p>
                    <button className="btn btn-secondary" onClick={() => openModal()}>
                        Add First Investment
                    </button>
                </div>
            ) : (
                <div className="data-table-container" style={{ borderRadius: '0 0 var(--radius-lg) var(--radius-lg)', borderTop: 'none' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Instrument</th>
                                <th style={{ textAlign: 'center' }}>Type</th>
                                <th style={{ textAlign: 'right' }}>Qty</th>
                                <th style={{ textAlign: 'right' }}>Avg. Price</th>
                                <th style={{ textAlign: 'right' }}>LTP</th>
                                <th style={{ textAlign: 'right' }}>Value</th>
                                <th style={{ textAlign: 'right' }}>P&L</th>
                                <th style={{ textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stocks.map((stock) => {
                                const stockValue = stock.quantity > 0
                                    ? stock.quantity * stock.currentPrice
                                    : (stock.totalInvested || 0);

                                const stockInvested = stock.totalInvested || (stock.quantity * stock.buyPrice);
                                const gainLoss = stockValue - stockInvested;
                                const gainLossPercent = stockInvested > 0 ? (gainLoss / stockInvested) * 100 : 0;
                                const isSIP = stock.type === 'SIP' || stock.type === 'MF';
                                const hasValidPrice = stock.currentPrice > 0;

                                return (
                                    <tr key={stock.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '8px',
                                                    background: `linear-gradient(135deg, ${stock.type === 'SIP' || stock.type === 'MF'
                                                        ? 'rgba(136, 192, 208, 0.2)'
                                                        : 'rgba(235, 203, 139, 0.2)'
                                                        }, ${stock.type === 'SIP' || stock.type === 'MF'
                                                            ? 'rgba(74, 139, 110, 0.2)'
                                                            : 'rgba(184, 90, 90, 0.2)'
                                                        })`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: 700,
                                                    fontSize: '16px',
                                                    color: stock.type === 'SIP' || stock.type === 'MF'
                                                        ? 'var(--accent-blue)'
                                                        : 'var(--accent-yellow)',
                                                    flexShrink: 0
                                                }}>
                                                    {stock.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div style={{ minWidth: 0 }}>
                                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{stock.symbol}</div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stock.name}</div>
                                                    {!hasValidPrice && (
                                                        <div style={{ fontSize: '10px', color: 'var(--accent-red)', marginTop: '2px' }}>
                                                            Price not available
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span className={`tag-badge ${isSIP ? 'tag-salary' : 'tag-utilities'
                                                }`}>
                                                {stock.type || 'STOCK'}
                                            </span>
                                            {stock.type === 'SIP' && stock.sipAmount && (
                                                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                                    {formatCurrency(stock.sipAmount)}/mo
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                                            {stock.quantity > 0 ? stock.quantity.toFixed(2) : '-'}
                                        </td>
                                        <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                                            {formatCurrency(stock.buyPrice)}
                                        </td>
                                        <td style={{ textAlign: 'right', color: 'var(--text-primary)' }}>
                                            {formatCurrency(stock.currentPrice)}
                                        </td>
                                        <td style={{ textAlign: 'right', fontWeight: 500 }}>
                                            {formatCurrency(stockValue)}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            {hasValidPrice ? (
                                                <>
                                                    <div style={{ color: gainLoss >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 500 }}>
                                                        {gainLoss > 0 ? '+' : ''}{formatCurrency(gainLoss)}
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: gainLoss >= 0 ? 'rgba(74, 139, 110, 0.7)' : 'rgba(184, 90, 90, 0.7)' }}>
                                                        {gainLossPercent.toFixed(2)}%
                                                    </div>
                                                </>
                                            ) : (
                                                <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>-</div>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                                <button
                                                    className="btn-icon"
                                                    onClick={() => openModal(stock)}
                                                    title="Edit"
                                                    style={{ padding: '6px' }}
                                                >
                                                    <IoPencilOutline size={14} />
                                                </button>
                                                <button
                                                    className="btn-icon"
                                                    onClick={() => deleteStock(stock.id)}
                                                    title="Delete"
                                                    style={{ padding: '6px', color: 'var(--accent-red)' }}
                                                >
                                                    <IoTrashOutline size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingStock ? 'Edit Investment' : 'Add New Investment'}
            >
                <form onSubmit={handleSubmit}>
                    {/* Investment Type Toggle */}
                    <div style={{ display: 'flex', backgroundColor: 'var(--bg-primary)', padding: '4px', borderRadius: 'var(--radius-md)', marginBottom: '16px', border: '1px solid var(--border-color)' }}>
                        {['STOCK', 'MF', 'SIP'].map((type) => (
                            <button
                                key={type}
                                type="button"
                                style={{
                                    flex: 1,
                                    padding: '6px 12px',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    border: 'none',
                                    backgroundColor: investmentType === type ? 'var(--bg-elevated)' : 'transparent',
                                    color: investmentType === type ? 'var(--text-primary)' : 'var(--text-muted)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onClick={() => setInvestmentType(type as InvestmentType)}
                            >
                                {type === 'MF' ? 'Mutual Fund' : type}
                            </button>
                        ))}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Symbol / Fund Name</label>
                        <div style={{ position: 'relative' }}>
                            <IoSearchOutline style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                required
                                placeholder="Search e.g. AAPL, RELIANCE"
                                value={formData.symbol}
                                onChange={e => handleSymbolSearch(e.target.value)}
                                className="form-input"
                                style={{ paddingLeft: '36px', textTransform: 'uppercase' }}
                            />
                            {isSearching && <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: 'var(--text-muted)' }}>Searching...</div>}
                        </div>
                        {searchResults.length > 0 && (
                            <div style={{ position: 'absolute', zIndex: 20, width: '100%', marginTop: '4px', backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', maxHeight: '200px', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                                {searchResults.map((result: any) => (
                                    <div
                                        key={result.symbol}
                                        style={{ padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                        onClick={() => selectSymbol(result)}
                                    >
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{result.symbol}</span>
                                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {result.longName || result.shortName}
                                            </span>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{ fontSize: '10px', display: 'block', color: 'var(--text-secondary)' }}>{result.exchange}</span>
                                            <span style={{ fontSize: '9px', display: 'block', color: 'var(--text-muted)' }}>{result.quoteType}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {formData.symbol.includes(' ') && (
                            <div style={{ fontSize: '11px', color: 'var(--accent-yellow)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span>⚠️ Symbols usually don't have spaces. Try searching logic.</span>
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Description (Optional)</label>
                        <input
                            type="text"
                            placeholder="e.g. Long term hold"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="form-input"
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">
                                {investmentType === 'STOCK' ? 'Quantity' : 'Units Held'}
                            </label>
                            <input
                                type="number"
                                required
                                min="0.0001"
                                step="any"
                                value={formData.quantity}
                                onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                                className="form-input"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">
                                {investmentType === 'STOCK' ? 'Avg Buy Price' : 'Avg NAV'}
                            </label>
                            <input
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                value={formData.buyPrice}
                                onChange={e => setFormData({ ...formData, buyPrice: e.target.value })}
                                className="form-input"
                            />
                        </div>
                    </div>

                    {investmentType === 'SIP' && (
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Monthly Amount</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.sipAmount}
                                    onChange={e => setFormData({ ...formData, sipAmount: e.target.value })}
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">SIP Date</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="31"
                                    placeholder="Day (1-31)"
                                    value={formData.sipDate}
                                    onChange={e => setFormData({ ...formData, sipDate: e.target.value })}
                                    className="form-input"
                                />
                            </div>
                        </div>
                    )}

                    <div className="form-group" style={{ paddingTop: '8px', borderTop: '1px solid var(--border-light)' }}>
                        <label className="form-label">Current Market Price (LTP)</label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                value={formData.currentPrice}
                                onChange={e => setFormData({ ...formData, currentPrice: e.target.value })}
                                className="form-input"
                            />
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Auto-updated</span>
                        </div>
                    </div>

                    <div className="modal-footer" style={{ padding: '16px 0 0 0', marginTop: '16px' }}>
                        <button type="button" className="btn btn-secondary" onClick={closeModal}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            {editingStock ? 'Save Changes' : 'Add to Portfolio'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
