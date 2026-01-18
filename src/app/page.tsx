'use client';

import { useEffect, useState } from 'react';
import {
  IoWalletOutline,
  IoFilmOutline,
  IoDocumentTextOutline,
  IoLockClosedOutline,
  IoTrendingUpOutline,
  IoTrendingDownOutline,
  IoArrowForwardOutline,
  IoStatsChartOutline
} from 'react-icons/io5';
import Link from 'next/link';
import { Transaction, Movie, Note, Password, Stock } from '@/types';
import { formatCurrency } from '@/hooks/useLocalStorage';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy
} from '@dnd-kit/sortable';
import { SortableCard } from '@/components/SortableCard';

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [passwords, setPasswords] = useState<Password[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);

  // Drag and Drop State
  const [items, setItems] = useState(['investments', 'finance', 'movies', 'notes']);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    // Load data from localStorage
    const storedTransactions = localStorage.getItem('transactions');
    const storedMovies = localStorage.getItem('movies');
    const storedNotes = localStorage.getItem('notes');
    const storedPasswords = localStorage.getItem('passwords');
    const storedStocks = localStorage.getItem('stocks');
    const storedOrder = localStorage.getItem('dashboard_card_order');

    if (storedTransactions) setTransactions(JSON.parse(storedTransactions));
    if (storedMovies) setMovies(JSON.parse(storedMovies));
    if (storedNotes) setNotes(JSON.parse(storedNotes));
    if (storedPasswords) setPasswords(JSON.parse(storedPasswords));
    if (storedStocks) setStocks(JSON.parse(storedStocks));
    if (storedOrder) setItems(JSON.parse(storedOrder));
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setItems((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over?.id as string);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        localStorage.setItem('dashboard_card_order', JSON.stringify(newOrder));
        return newOrder;
      });
    }
  };

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  // Portfolio Calculation
  const portfolioValue = stocks.reduce((sum, stock) => {
    const val = stock.quantity > 0
      ? stock.quantity * stock.currentPrice
      : (stock.totalInvested || 0);
    return sum + val;
  }, 0);

  // Breakdown
  const epfValue = stocks
    .filter(s => s.type === 'EPF')
    .reduce((sum, s) => sum + (s.totalInvested || (s.quantity * s.currentPrice)), 0);

  const mutualFundValue = portfolioValue - epfValue;

  const moviesToWatch = movies.filter(m => m.status === 'to-watch').length;
  const moviesWatched = movies.filter(m => m.status === 'watched').length;

  const renderCard = (id: string) => {
    switch (id) {
      case 'investments':
        return (
          <Link href="/stocks" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ cursor: 'grab', transition: 'border-color 0.15s', height: '100%' }}>
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <IoTrendingUpOutline size={24} style={{ color: 'var(--accent-green)' }} />
                  <span className="card-title">Investments</span>
                </div>
                <IoArrowForwardOutline size={18} style={{ color: 'var(--text-muted)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '8px' }}>
                  <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--accent-green)' }}>{formatCurrency(portfolioValue)}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <span>SIPs: {formatCurrency(mutualFundValue)}</span>
                  <span>|</span>
                  <span>EPF: {formatCurrency(epfValue)}</span>
                </div>
              </div>
            </div>
          </Link>
        );
      case 'finance':
        return (
          <Link href="/finance" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ cursor: 'grab', transition: 'border-color 0.15s', height: '100%' }}>
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <IoWalletOutline size={24} />
                  <span className="card-title">Finance</span>
                </div>
                <IoArrowForwardOutline size={18} style={{ color: 'var(--text-muted)' }} />
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '8px' }}>
                {transactions.length} transactions recorded
              </p>
            </div>
          </Link>
        );
      case 'movies':
        return (
          <Link href="/movies" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ cursor: 'grab', transition: 'border-color 0.15s', height: '100%' }}>
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <IoFilmOutline size={24} />
                  <span className="card-title">Movies</span>
                </div>
                <IoArrowForwardOutline size={18} style={{ color: 'var(--text-muted)' }} />
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '8px' }}>
                {moviesToWatch} to watch • {moviesWatched} watched
              </p>
            </div>
          </Link>
        );
      case 'notes':
        return (
          <Link href="/notes" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ cursor: 'grab', transition: 'border-color 0.15s', height: '100%' }}>
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <IoDocumentTextOutline size={24} />
                  <span className="card-title">Notes</span>
                </div>
                <IoArrowForwardOutline size={18} style={{ color: 'var(--text-muted)' }} />
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '8px' }}>
                {notes.length} notes saved
              </p>
            </div>
          </Link>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard Overview</h1>
      </div>

      {/* Quick Stats */}
      <div className="overview-stats">
        {/* ... existing stats cards ... */}
        <div className="stat-card">
          <div className="stat-card-label">
            <IoWalletOutline size={16} style={{ display: 'inline', marginRight: '8px' }} />
            Net Balance
          </div>
          <div className={`stat-card-value ${balance >= 0 ? 'positive' : 'negative'}`}>
            {formatCurrency(balance)}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">
            <IoStatsChartOutline size={16} style={{ display: 'inline', marginRight: '8px' }} />
            Portfolio Value
          </div>
          <div className="stat-card-value" style={{ color: 'var(--accent-blue)' }}>
            {formatCurrency(portfolioValue)}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">
            <IoTrendingUpOutline size={16} style={{ display: 'inline', marginRight: '8px' }} />
            Total Income
          </div>
          <div className="stat-card-value positive">
            {formatCurrency(totalIncome)}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">
            <IoTrendingDownOutline size={16} style={{ display: 'inline', marginRight: '8px' }} />
            Total Expenses
          </div>
          <div className="stat-card-value negative">
            {formatCurrency(totalExpenses)}
          </div>
        </div>
      </div>

      {/* Quick Access Cards (Draggable) */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items} strategy={rectSortingStrategy}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {items.map((id) => (
              <SortableCard key={id} id={id}>
                {renderCard(id)}
              </SortableCard>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Recent Activity */}
      {transactions.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '16px', color: 'var(--text-primary)' }}>
            Recent Transactions
          </h2>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Amount</th>
                  <th>Type</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 5).map((t) => (
                  <tr key={t.id}>
                    <td>{t.source}</td>
                    <td style={{ color: t.type === 'income' ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>{t.type}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{t.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
