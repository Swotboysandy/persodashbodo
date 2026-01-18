'use client';

import { useState, useMemo } from 'react';
import {
    IoTrendingUpOutline,
    IoTrendingDownOutline,
    IoAddOutline,
    IoChevronForwardOutline,
    IoCreateOutline,
    IoTrashOutline
} from 'react-icons/io5';
import Modal from '@/components/Modal';
import TagBadge from '@/components/TagBadge';
import { Transaction, MonthlySummary, MONTHS, INCOME_TAGS, EXPENSE_TAGS } from '@/types';
import { useLocalStorage, generateId, formatCurrency, formatDate, getMonthFromDate } from '@/hooks/useLocalStorage';

type ViewMode = 'income' | 'expense';
type FilterQuarter = 'all' | 'Q1' | 'Q2' | 'Q3' | 'Q4';

export default function FinancePage() {
    const [transactions, setTransactions] = useLocalStorage<Transaction[]>('transactions', []);
    const [viewMode, setViewMode] = useState<ViewMode>('income');
    const [filterQuarter, setFilterQuarter] = useState<FilterQuarter>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set(MONTHS));

    // Form state
    const [formData, setFormData] = useState({
        source: '',
        amount: '',
        tags: [] as string[],
        date: new Date().toISOString().split('T')[0],
    });

    const filteredTransactions = useMemo(() => {
        let filtered = transactions.filter(t => t.type === viewMode);

        if (filterQuarter !== 'all') {
            const quarterMonths: Record<string, string[]> = {
                'Q1': ['January', 'February', 'March'],
                'Q2': ['April', 'May', 'June'],
                'Q3': ['July', 'August', 'September'],
                'Q4': ['October', 'November', 'December'],
            };
            filtered = filtered.filter(t => quarterMonths[filterQuarter].includes(t.month));
        }

        return filtered;
    }, [transactions, viewMode, filterQuarter]);

    const groupedByMonth = useMemo(() => {
        const groups: Record<string, Transaction[]> = {};
        MONTHS.forEach(month => {
            const monthTransactions = filteredTransactions.filter(t => t.month === month);
            if (monthTransactions.length > 0) {
                groups[month] = monthTransactions;
            }
        });
        return groups;
    }, [filteredTransactions]);

    const monthlySummaries: MonthlySummary[] = useMemo(() => {
        return MONTHS.map(month => {
            const monthTransactions = transactions.filter(t => t.month === month);
            const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
            const expenses = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
            return { month, income, expenses, net: income - expenses };
        }).filter(s => s.income > 0 || s.expenses > 0);
    }, [transactions]);

    const toggleMonth = (month: string) => {
        const newExpanded = new Set(expandedMonths);
        if (newExpanded.has(month)) {
            newExpanded.delete(month);
        } else {
            newExpanded.add(month);
        }
        setExpandedMonths(newExpanded);
    };

    const openAddModal = () => {
        setEditingTransaction(null);
        setFormData({
            source: '',
            amount: '',
            tags: [],
            date: new Date().toISOString().split('T')[0],
        });
        setIsModalOpen(true);
    };

    const openEditModal = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        setFormData({
            source: transaction.source,
            amount: transaction.amount.toString(),
            tags: transaction.tags,
            date: transaction.date,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const month = getMonthFromDate(formData.date);

        if (editingTransaction) {
            setTransactions(prev => prev.map(t =>
                t.id === editingTransaction.id
                    ? { ...t, ...formData, amount: parseFloat(formData.amount), month }
                    : t
            ));
        } else {
            const newTransaction: Transaction = {
                id: generateId(),
                source: formData.source,
                amount: parseFloat(formData.amount),
                tags: formData.tags,
                date: formData.date,
                month,
                type: viewMode,
            };
            setTransactions(prev => [newTransaction, ...prev]);
        }

        setIsModalOpen(false);
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this transaction?')) {
            setTransactions(prev => prev.filter(t => t.id !== id));
        }
    };

    const toggleTag = (tag: string) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.includes(tag)
                ? prev.tags.filter(t => t !== tag)
                : [...prev.tags, tag]
        }));
    };

    const availableTags = viewMode === 'income' ? INCOME_TAGS : EXPENSE_TAGS;

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">
                    {viewMode === 'income' ? <IoTrendingUpOutline size={24} /> : <IoTrendingDownOutline size={24} />}
                    Personal Finance Tracker
                </h1>
            </div>

            {/* Monthly Overview Cards */}
            <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '16px', color: 'var(--text-secondary)' }}>
                    Total Savings
                </h2>
                <div className="monthly-grid">
                    {monthlySummaries.length > 0 ? (
                        monthlySummaries.map(summary => (
                            <div key={summary.month} className="monthly-card">
                                <div className="monthly-card-header">
                                    <div className="month-indicator" />
                                    <span className="month-name">{summary.month}</span>
                                </div>
                                <div className="monthly-card-stats">
                                    <div className="stat-row">
                                        <span className="stat-label">Income:</span>
                                        <span className="stat-value">{formatCurrency(summary.income)}</span>
                                    </div>
                                    <div className="stat-row">
                                        <span className="stat-label">Expenses:</span>
                                        <span className="stat-value">{formatCurrency(summary.expenses)}</span>
                                    </div>
                                    <div className="stat-row">
                                        <span className="stat-label">Net:</span>
                                        <span className={`stat-value ${summary.net >= 0 ? 'positive' : 'negative'}`}>
                                            {formatCurrency(summary.net)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                            No transactions yet. Add your first transaction to see monthly summaries.
                        </div>
                    )}
                </div>
            </div>

            {/* Income/Expense Toggle */}
            <div className="data-table-container">
                <div className="section-header">
                    <div className="section-title">
                        {viewMode === 'income' ? <IoTrendingUpOutline size={18} /> : <IoTrendingDownOutline size={18} />}
                        {viewMode === 'income' ? 'Income' : 'Expenses'}
                    </div>
                    <div className="section-actions">
                        <div className="table-filters">
                            <button
                                className={`filter-btn ${filterQuarter === 'all' ? 'active' : ''}`}
                                onClick={() => setFilterQuarter('all')}
                            >
                                All Months
                            </button>
                            {['Q1', 'Q2', 'Q3', 'Q4'].map(q => (
                                <button
                                    key={q}
                                    className={`filter-btn ${filterQuarter === q ? 'active' : ''}`}
                                    onClick={() => setFilterQuarter(q as FilterQuarter)}
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                        <button className="btn btn-primary" onClick={openAddModal}>
                            <IoAddOutline size={16} /> New
                        </button>
                    </div>
                </div>

                {/* View Mode Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
                    <button
                        onClick={() => setViewMode('income')}
                        style={{
                            flex: 1,
                            padding: '12px',
                            background: viewMode === 'income' ? 'var(--bg-tertiary)' : 'transparent',
                            border: 'none',
                            color: viewMode === 'income' ? 'var(--text-primary)' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            borderBottom: viewMode === 'income' ? '2px solid var(--accent-blue)' : 'none',
                        }}
                    >
                        <IoTrendingUpOutline size={16} /> Income
                    </button>
                    <button
                        onClick={() => setViewMode('expense')}
                        style={{
                            flex: 1,
                            padding: '12px',
                            background: viewMode === 'expense' ? 'var(--bg-tertiary)' : 'transparent',
                            border: 'none',
                            color: viewMode === 'expense' ? 'var(--text-primary)' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            borderBottom: viewMode === 'expense' ? '2px solid var(--accent-blue)' : 'none',
                        }}
                    >
                        <IoTrendingDownOutline size={16} /> Expenses
                    </button>
                </div>

                {/* Grouped Transactions */}
                <div style={{ padding: '16px' }}>
                    {Object.keys(groupedByMonth).length > 0 ? (
                        Object.entries(groupedByMonth).map(([month, monthTransactions]) => (
                            <div key={month} className="month-group">
                                <div
                                    className={`month-group-header ${expandedMonths.has(month) ? 'expanded' : ''}`}
                                    onClick={() => toggleMonth(month)}
                                >
                                    <IoChevronForwardOutline size={16} />
                                    <div className="month-indicator-small" />
                                    <span className="month-group-title">{month}</span>
                                    <span className="month-group-count">{monthTransactions.length}</span>
                                </div>

                                {expandedMonths.has(month) && (
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Source</th>
                                                <th>Amount</th>
                                                <th>Tags</th>
                                                <th>Date</th>
                                                <th>Month</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {monthTransactions.map(t => (
                                                <tr key={t.id}>
                                                    <td>{t.source}</td>
                                                    <td>{formatCurrency(t.amount)}</td>
                                                    <td>
                                                        {t.tags.map(tag => (
                                                            <TagBadge key={tag} tag={tag} />
                                                        ))}
                                                    </td>
                                                    <td style={{ color: 'var(--text-secondary)' }}>{formatDate(t.date)}</td>
                                                    <td>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <div className="month-indicator-small" />
                                                            {t.month}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            <button className="btn btn-icon" onClick={() => openEditModal(t)}>
                                                                <IoCreateOutline size={14} />
                                                            </button>
                                                            <button className="btn btn-icon" onClick={() => handleDelete(t.id)}>
                                                                <IoTrashOutline size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="empty-state">
                            <p>No {viewMode} transactions found.</p>
                            <button className="btn btn-primary" onClick={openAddModal}>
                                <IoAddOutline size={16} /> Add {viewMode}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingTransaction ? `Edit ${viewMode}` : `Add ${viewMode}`}
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </button>
                        <button className="btn btn-primary" onClick={handleSubmit}>
                            {editingTransaction ? 'Update' : 'Add'}
                        </button>
                    </>
                }
            >
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Source</label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.source}
                            onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                            placeholder="e.g., Salary, Rent, etc."
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Amount (₹)</label>
                            <input
                                type="number"
                                className="form-input"
                                value={formData.amount}
                                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Date</label>
                            <input
                                type="date"
                                className="form-input"
                                value={formData.date}
                                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Tags</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {availableTags.map(tag => (
                                <button
                                    key={tag}
                                    type="button"
                                    className={`filter-btn ${formData.tags.includes(tag) ? 'active' : ''}`}
                                    onClick={() => toggleTag(tag)}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
