'use client';

import { useState, useMemo } from 'react';
import {
    IoDocumentTextOutline,
    IoAddOutline,
    IoCreateOutline,
    IoTrashOutline,
    IoSearchOutline
} from 'react-icons/io5';
import Modal from '@/components/Modal';
import TagBadge from '@/components/TagBadge';
import { Note, NOTE_CATEGORIES } from '@/types';
import { useLocalStorage, generateId, formatDate } from '@/hooks/useLocalStorage';

export default function NotesPage() {
    const [notes, setNotes] = useLocalStorage<Note[]>('notes', []);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingNote, setEditingNote] = useState<Note | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        category: 'Personal',
    });

    const filteredNotes = useMemo(() => {
        let filtered = notes;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(n =>
                (n.title?.toLowerCase() || '').includes(query) ||
                (n.content?.toLowerCase() || '').includes(query)
            );
        }

        if (categoryFilter !== 'all') {
            filtered = filtered.filter(n => n.category === categoryFilter);
        }

        return filtered;
    }, [notes, searchQuery, categoryFilter]);

    const openAddModal = () => {
        setEditingNote(null);
        setFormData({
            title: '',
            content: '',
            category: 'Personal',
        });
        setIsModalOpen(true);
    };

    const openEditModal = (note: Note) => {
        setEditingNote(note);
        setFormData({
            title: note.title,
            content: note.content,
            category: note.category,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const now = new Date().toISOString();

        if (editingNote) {
            setNotes(prev => prev.map(n =>
                n.id === editingNote.id
                    ? { ...n, ...formData, updatedAt: now }
                    : n
            ));
        } else {
            const newNote: Note = {
                id: generateId(),
                title: formData.title,
                content: formData.content,
                category: formData.category,
                createdAt: now,
                updatedAt: now,
            };
            setNotes(prev => [newNote, ...prev]);
        }

        setIsModalOpen(false);
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this note?')) {
            setNotes(prev => prev.filter(n => n.id !== id));
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">
                    <IoDocumentTextOutline size={24} />
                    Notes
                </h1>
                <button className="btn btn-primary" onClick={openAddModal}>
                    <IoAddOutline size={16} /> New Note
                </button>
            </div>

            {/* Search and Filter */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
                    <IoSearchOutline size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Search notes..."
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
                    {NOTE_CATEGORIES.map(cat => (
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

            {/* Notes Grid */}
            <div className="notes-list">
                {filteredNotes.length > 0 ? (
                    filteredNotes.map(note => (
                        <div key={note.id} className="note-card" onClick={() => openEditModal(note)}>
                            <div className="note-card-header">
                                <h3 className="note-card-title">{note.title}</h3>
                                <TagBadge tag={note.category} />
                            </div>
                            <p className="note-card-content">{note.content}</p>
                            <div className="note-card-footer">
                                <span className="note-card-date">
                                    {formatDate(note.updatedAt)}
                                </span>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        className="btn btn-icon"
                                        onClick={(e) => { e.stopPropagation(); openEditModal(note); }}
                                    >
                                        <IoCreateOutline size={14} />
                                    </button>
                                    <button
                                        className="btn btn-icon"
                                        onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}
                                    >
                                        <IoTrashOutline size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                        <IoDocumentTextOutline size={48} />
                        <p>{searchQuery || categoryFilter !== 'all' ? 'No notes match your search.' : 'No notes yet.'}</p>
                        <button className="btn btn-primary" onClick={openAddModal}>
                            <IoAddOutline size={16} /> Create Your First Note
                        </button>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingNote ? 'Edit Note' : 'New Note'}
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </button>
                        <button className="btn btn-primary" onClick={handleSubmit}>
                            {editingNote ? 'Update' : 'Save'}
                        </button>
                    </>
                }
            >
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Title</label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Note title"
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
                            {NOTE_CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Content</label>
                        <textarea
                            className="form-input"
                            value={formData.content}
                            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                            placeholder="Write your note here..."
                            style={{ minHeight: '200px', resize: 'vertical' }}
                            required
                        />
                    </div>
                </form>
            </Modal>
        </div>
    );
}
