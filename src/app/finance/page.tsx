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
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [extractedTransactions, setExtractedTransactions] = useState<Transaction[]>([]);
    const [isExtracting, setIsExtracting] = useState(false);

    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set([MONTHS[new Date().getMonth()]]));

    const [formData, setFormData] = useState({
        source: '',
        amount: '',
        tags: [] as string[],
        date: new Date().toISOString().split('T')[0],
        type: 'expense'
    });

    const availableTags = useMemo(() => {
        const tags = new Set(viewMode === 'income' ? INCOME_TAGS : EXPENSE_TAGS);
        // Add used tags
        transactions.forEach(t => {
            t.tags.forEach(tag => tags.add(tag));
        });
        return Array.from(tags).sort();
    }, [viewMode, transactions]);

    const groupedByMonth = useMemo(() => {
        const grouped: { [key: string]: Transaction[] } = {};

        let filtered = transactions.filter(t => t.type === viewMode);

        // Sort by date desc
        filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        filtered.forEach(t => {
            if (!grouped[t.month]) {
                grouped[t.month] = [];
            }
            grouped[t.month].push(t);
        });

        return grouped;
    }, [transactions, viewMode]);

    const calculatedSummaries = useMemo(() => {
        const summaries: { [key: string]: MonthlySummary } = {};

        transactions.forEach(t => {
            if (!summaries[t.month]) {
                summaries[t.month] = {
                    month: t.month,
                    income: 0,
                    expenses: 0,
                    net: 0
                };
            }
            if (t.type === 'income') {
                summaries[t.month].income += t.amount;
                summaries[t.month].net += t.amount;
            } else {
                summaries[t.month].expenses += t.amount;
                summaries[t.month].net -= t.amount;
            }
        });

        const result = Object.values(summaries).sort((a, b) => {
            return MONTHS.indexOf(b.month) - MONTHS.indexOf(a.month);
        });

        console.log('Calculated Summaries:', result);
        return result;
    }, [transactions]);

    const toggleMonth = (month: string) => {
        setExpandedMonths(prev => {
            const newSet = new Set(prev);
            if (newSet.has(month)) {
                newSet.delete(month);
            } else {
                newSet.add(month);
            }
            return newSet;
        });
    };

    const toggleTag = (tag: string) => {
        setFormData(prev => {
            const tags = prev.tags.includes(tag)
                ? prev.tags.filter(t => t !== tag)
                : [...prev.tags, tag];
            return { ...prev, tags };
        });
    };

    const openAddModal = () => {
        setEditingTransaction(null);
        setFormData({
            source: '',
            amount: '',
            tags: [],
            date: new Date().toISOString().split('T')[0],
            type: viewMode
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
            type: transaction.type
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const month = getMonthFromDate(formData.date);

        if (editingTransaction) {
            setTransactions(prev => prev.map(t =>
                t.id === editingTransaction.id
                    ? {
                        ...t,
                        source: formData.source,
                        amount: parseFloat(formData.amount),
                        tags: formData.tags,
                        date: formData.date,
                        month,
                        type: formData.type as 'income' | 'expense'
                    }
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
                type: formData.type as 'income' | 'expense',
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

    // PDF Handling
    // PDF Handling
    const convertPdfToImage = async (file: File): Promise<Blob[]> => {
        try {
            const pdfJS = await import('pdfjs-dist');
            pdfJS.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfJS.version}/build/pdf.worker.min.mjs`;

            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfJS.getDocument({ data: arrayBuffer }).promise;

            const blobs: Blob[] = [];

            // Process all pages
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 2 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                if (context) {
                    await page.render({
                        canvasContext: context,
                        viewport: viewport
                    } as any).promise;

                    const blob = await new Promise<Blob | null>((resolve) => {
                        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.95);
                    });

                    if (blob) blobs.push(blob);
                }
            }
            return blobs;

        } catch (error) {
            console.error('PDF conversion failed:', error);
            alert('Failed to process PDF pages.');
            return [];
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsExtracting(true);

        try {
            let filesToProcess: File[] = [];

            if (file.type === 'application/pdf') {
                const imageBlobs = await convertPdfToImage(file);
                console.log(`Converted PDF to ${imageBlobs.length} images`);
                filesToProcess = imageBlobs.map((blob, i) =>
                    new File([blob], `page_${i + 1}.jpg`, { type: "image/jpeg" })
                );
            } else {
                filesToProcess = [file];
            }

            if (filesToProcess.length === 0) {
                alert('No pages could be processed from the file.');
                return;
            }

            const allTransactions: Transaction[] = [];

            // Process each page sequentially
            for (let i = 0; i < filesToProcess.length; i++) {
                console.log(`Processing page ${i + 1}/${filesToProcess.length}...`);

                const formData = new FormData();
                formData.append('file', filesToProcess[i]);

                // Rate limiting delay (3 seconds) to prevent API overload
                if (i > 0) {
                    console.log("Waiting to respect rate limits...");
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }

                const response = await fetch('/api/finance/extract', {
                    method: 'POST',
                    body: formData,
                });

                const data = await response.json();

                if (data.transactions && Array.isArray(data.transactions)) {
                    const pageTransactions = data.transactions.map((t: any) => ({
                        id: generateId(),
                        source: t.source || 'Unknown',
                        amount: Math.abs(parseFloat(t.amount)) || 0,
                        tags: t.tags || [],
                        date: t.date || new Date().toISOString().split('T')[0],
                        month: getMonthFromDate(t.date || new Date().toISOString()),
                        type: t.type === 'expense' ? 'expense' : 'income',
                    }));
                    allTransactions.push(...pageTransactions);
                }
            }

            if (allTransactions.length > 0) {
                // Sort combined results
                allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setExtractedTransactions(allTransactions);
                setIsReviewModalOpen(true);
            } else {
                alert('Could not find transactions on any page.');
            }

        } catch (error) {
            console.error('Extraction failed:', error);
            alert('Failed to process pages.');
        } finally {
            setIsExtracting(false);
            e.target.value = '';
        }
    };

    const saveExtractedTransactions = () => {
        setTransactions(prev => {
            const updated = [...extractedTransactions, ...prev];
            return updated;
        });

        // Auto-expand the months for the new transactions
        const newMonths = new Set(extractedTransactions.map(t => t.month));
        setExpandedMonths(prev => {
            const next = new Set(prev);
            newMonths.forEach(m => next.add(m));
            return next;
        });

        alert(`Successfully added ${extractedTransactions.length} transactions.`);
        setIsReviewModalOpen(false);
        setExtractedTransactions([]);
    };

    const removeExtractedTransaction = (id: string) => {
        setExtractedTransactions(prev => prev.filter(t => t.id !== id));
    };

    const updateExtractedTransaction = (id: string, field: keyof Transaction, value: any) => {
        setExtractedTransactions(prev => prev.map(t => {
            if (t.id === id) {
                const updates: any = { [field]: value };
                if (field === 'date') {
                    updates.month = getMonthFromDate(value);
                }
                return { ...t, ...updates };
            }
            return t;
        }));
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">
                    {viewMode === 'income' ? <IoTrendingUpOutline size={24} /> : <IoTrendingDownOutline size={24} />}
                    Personal Finance Tracker
                </h1>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <label
                        className={`btn ${isExtracting ? 'btn-disabled' : 'btn-secondary'}`}
                        style={{ cursor: isExtracting ? 'not-allowed' : 'pointer', position: 'relative', overflow: 'hidden' }}
                    >
                        {isExtracting ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div className="spinner" />
                                <span>Processing...</span>
                            </div>
                        ) : (
                            <>
                                <IoAddOutline size={18} /> AI Upload
                            </>
                        )}
                        <input
                            type="file"
                            accept="image/*,.pdf"
                            style={{ display: 'none' }}
                            onChange={handleFileUpload}
                            disabled={isExtracting}
                        />
                    </label>
                </div>
            </div>

            {/* ... Monthly Overview Cards ... */}
            <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '16px', color: 'var(--text-secondary)' }}>
                    Total Savings
                </h2>
                <div className="monthly-grid">
                    {calculatedSummaries.length > 0 ? (
                        calculatedSummaries.map(summary => (
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

            <Modal
                isOpen={isReviewModalOpen}
                onClose={() => setIsReviewModalOpen(false)}
                title="Review Extracted Transactions"
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setIsReviewModalOpen(false)}>
                            Cancel
                        </button>
                        <button className="btn btn-primary" onClick={saveExtractedTransactions}>
                            Save All ({extractedTransactions.length})
                        </button>
                    </>
                }
            >
                <div style={{ maxHeight: '60vh', overflowY: 'auto', margin: '-16px' }}>
                    <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 10 }}>
                            <tr>
                                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Date</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Source</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Type</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Amount</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {extractedTransactions.map((t) => (
                                <tr key={t.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '8px 16px' }}>
                                        <input
                                            type="date"
                                            className="form-input"
                                            style={{ padding: '4px 8px', fontSize: '13px', width: '130px' }}
                                            value={t.date}
                                            onChange={(e) => updateExtractedTransaction(t.id, 'date', e.target.value)}
                                        />
                                    </td>
                                    <td style={{ padding: '8px 16px' }}>
                                        <input
                                            type="text"
                                            className="form-input"
                                            style={{ padding: '4px 8px', fontSize: '13px', width: '100%' }}
                                            value={t.source}
                                            onChange={(e) => updateExtractedTransaction(t.id, 'source', e.target.value)}
                                        />
                                    </td>
                                    <td style={{ padding: '8px 16px' }}>
                                        <select
                                            className="form-select"
                                            style={{ padding: '4px 8px', fontSize: '13px', width: '100px' }}
                                            value={t.type}
                                            onChange={(e) => updateExtractedTransaction(t.id, 'type', e.target.value)}
                                        >
                                            <option value="income">Income</option>
                                            <option value="expense">Expense</option>
                                        </select>
                                    </td>
                                    <td style={{ padding: '8px 16px', textAlign: 'right' }}>
                                        <input
                                            type="number"
                                            className="form-input"
                                            style={{ padding: '4px 8px', fontSize: '13px', textAlign: 'right', width: '100px' }}
                                            value={t.amount}
                                            onChange={(e) => updateExtractedTransaction(t.id, 'amount', parseFloat(e.target.value))}
                                        />
                                    </td>
                                    <td style={{ padding: '8px 16px', textAlign: 'center' }}>
                                        <button
                                            className="btn btn-icon"
                                            style={{ color: 'var(--error-color)' }}
                                            onClick={() => removeExtractedTransaction(t.id)}
                                        >
                                            <IoTrashOutline size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {extractedTransactions.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                            <p>No transactions extracted.</p>
                        </div>
                    )}
                </div>
            </Modal>

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
