'use client';

import { useState, useMemo } from 'react';
import {
    IoLockClosedOutline,
    IoAddOutline,
    IoEyeOutline,
    IoEyeOffOutline,
    IoCopyOutline,
    IoCreateOutline,
    IoTrashOutline,
    IoSearchOutline,
    IoCheckmarkOutline,
    IoRefreshOutline
} from 'react-icons/io5';
import Modal from '@/components/Modal';
import TagBadge from '@/components/TagBadge';
import { Password, PASSWORD_CATEGORIES } from '@/types';
import { useLocalStorage, generateId } from '@/hooks/useLocalStorage';

export default function PasswordsPage() {
    const [passwords, setPasswords] = useLocalStorage<Password[]>('passwords', []);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPassword, setEditingPassword] = useState<Password | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        site: '',
        username: '',
        password: '',
        category: 'Other',
        notes: '',
    });

    const filteredPasswords = useMemo(() => {
        let filtered = passwords;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(p =>
                (p.site?.toLowerCase() || '').includes(query) ||
                (p.username?.toLowerCase() || '').includes(query)
            );
        }

        if (categoryFilter !== 'all') {
            filtered = filtered.filter(p => p.category === categoryFilter);
        }

        return filtered;
    }, [passwords, searchQuery, categoryFilter]);

    const togglePasswordVisibility = (id: string) => {
        setVisiblePasswords(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const copyToClipboard = async (text: string, id: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const openAddModal = () => {
        setEditingPassword(null);
        setFormData({
            site: '',
            username: '',
            password: '',
            category: 'Other',
            notes: '',
        });
        setIsModalOpen(true);
    };

    const openEditModal = (password: Password) => {
        setEditingPassword(password);
        // Decode base64 password for editing
        const decodedPassword = atob(password.password);
        setFormData({
            site: password.site,
            username: password.username,
            password: decodedPassword,
            category: password.category,
            notes: password.notes || '',
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Encode password in base64 for basic obfuscation
        const encodedPassword = btoa(formData.password);

        if (editingPassword) {
            setPasswords(prev => prev.map(p =>
                p.id === editingPassword.id
                    ? { ...p, ...formData, password: encodedPassword }
                    : p
            ));
        } else {
            const newPassword: Password = {
                id: generateId(),
                site: formData.site,
                username: formData.username,
                password: encodedPassword,
                category: formData.category,
                notes: formData.notes,
                createdAt: new Date().toISOString(),
            };
            setPasswords(prev => [newPassword, ...prev]);
        }

        setIsModalOpen(false);
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this password?')) {
            setPasswords(prev => prev.filter(p => p.id !== id));
        }
    };

    const getDecodedPassword = (encodedPassword: string) => {
        try {
            return atob(encodedPassword);
        } catch {
            return encodedPassword;
        }
    };

    const generateRandomPassword = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < 16; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setFormData(prev => ({ ...prev, password }));
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">
                    <IoLockClosedOutline size={24} />
                    Password Vault
                </h1>
                <button className="btn btn-primary" onClick={openAddModal}>
                    <IoAddOutline size={16} /> Add Password
                </button>
            </div>

            {/* Warning Banner */}
            <div style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--accent-yellow)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                marginBottom: '24px',
                fontSize: '13px',
                color: 'var(--text-secondary)'
            }}>
                ⚠️ Passwords are stored locally with basic encoding. For sensitive accounts, use a dedicated password manager.
            </div>

            {/* Search and Filter */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
                    <IoSearchOutline size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Search by site or username..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ paddingLeft: '40px' }}
                    />
                </div>

                <div className="table-filters">
                    <button
                        className={`filter-btn ${categoryFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setCategoryFilter('all')}
                    >
                        All
                    </button>
                    {PASSWORD_CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            className={`filter-btn ${categoryFilter === cat ? 'active' : ''}`}
                            onClick={() => setCategoryFilter(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Passwords List */}
            <div className="password-list">
                {filteredPasswords.length > 0 ? (
                    filteredPasswords.map(password => {
                        const isVisible = visiblePasswords.has(password.id);
                        const decodedPassword = getDecodedPassword(password.password);

                        return (
                            <div key={password.id} className="password-item">
                                <div>
                                    <div className="password-site">{password.site}</div>
                                    <TagBadge tag={password.category} />
                                </div>
                                <div className="password-username">{password.username}</div>
                                <div className="password-value">
                                    <span>{isVisible ? decodedPassword : '••••••••••••'}</span>
                                    <button
                                        className="btn btn-icon"
                                        onClick={() => togglePasswordVisibility(password.id)}
                                        title={isVisible ? 'Hide password' : 'Show password'}
                                    >
                                        {isVisible ? <IoEyeOffOutline size={14} /> : <IoEyeOutline size={14} />}
                                    </button>
                                    <button
                                        className="btn btn-icon"
                                        onClick={() => copyToClipboard(decodedPassword, password.id)}
                                        title="Copy password"
                                    >
                                        {copiedId === password.id ? <IoCheckmarkOutline size={14} /> : <IoCopyOutline size={14} />}
                                    </button>
                                </div>
                                <div className="password-actions">
                                    <button className="btn btn-icon" onClick={() => openEditModal(password)}>
                                        <IoCreateOutline size={14} />
                                    </button>
                                    <button className="btn btn-icon" onClick={() => handleDelete(password.id)}>
                                        <IoTrashOutline size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="empty-state">
                        <IoLockClosedOutline size={48} />
                        <p>{searchQuery || categoryFilter !== 'all' ? 'No passwords match your search.' : 'No passwords saved yet.'}</p>
                        <button className="btn btn-primary" onClick={openAddModal}>
                            <IoAddOutline size={16} /> Add Your First Password
                        </button>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingPassword ? 'Edit Password' : 'Add Password'}
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </button>
                        <button className="btn btn-primary" onClick={handleSubmit}>
                            {editingPassword ? 'Update' : 'Save'}
                        </button>
                    </>
                }
            >
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Site/App Name</label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.site}
                            onChange={(e) => setFormData(prev => ({ ...prev, site: e.target.value }))}
                            placeholder="e.g., Google, Netflix, etc."
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Username/Email</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.username}
                                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                                placeholder="your@email.com"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Category</label>
                            <select
                                className="form-select"
                                value={formData.category}
                                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                            >
                                {PASSWORD_CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.password}
                                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                placeholder="Enter password"
                                required
                                style={{ flex: 1, fontFamily: 'monospace' }}
                            />
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={generateRandomPassword}
                            >
                                <IoRefreshOutline size={16} /> Generate
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Notes (optional)</label>
                        <textarea
                            className="form-input"
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Any additional notes..."
                            style={{ minHeight: '80px', resize: 'vertical' }}
                        />
                    </div>
                </form>
            </Modal>
        </div>
    );
}
