'use client';

import { useState, useMemo } from 'react';
import {
    IoFilmOutline,
    IoAddOutline,
    IoStar,
    IoStarOutline,
    IoCreateOutline,
    IoTrashOutline,
    IoEyeOutline,
    IoEyeOffOutline,
    IoCheckmarkCircleOutline,
    IoSearchOutline
} from 'react-icons/io5';
import Modal from '@/components/Modal';
import { Movie, MOVIE_GENRES } from '@/types';
import { useLocalStorage, generateId } from '@/hooks/useLocalStorage';
import { searchMovies, getMovieDetails } from '@/services/movieService';
import Image from 'next/image';

type StatusFilter = 'all' | 'to-watch' | 'watching' | 'watched';

export default function MoviesPage() {
    const [movies, setMovies] = useLocalStorage<Movie[]>('movies', []);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        status: 'to-watch' as Movie['status'],
        rating: 0,
        notes: '',
        genre: '',
        imdbId: '',
        poster: '',
        plot: '',
        cast: [] as string[],
        releaseYear: 0,
        imdbRating: 0,
        director: '',
        runtime: ''
    });

    const filteredMovies = useMemo(() => {
        if (statusFilter === 'all') return movies;
        return movies.filter(m => m.status === statusFilter);
    }, [movies, statusFilter]);

    const handleMovieSearch = async (query: string) => {
        setSearchQuery(query);
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const results = await searchMovies(query);
            setSearchResults(results);
        } finally {
            setIsSearching(false);
        }
    };

    const selectMovie = async (result: any) => {
        setIsSearching(true);
        try {
            const details = await getMovieDetails(result.id);
            if (details) {
                setFormData({
                    title: details.title,
                    status: 'to-watch',
                    rating: 0,
                    notes: '',
                    genre: details.genres?.[0] || '',
                    imdbId: details.id,
                    poster: details.poster || '',
                    plot: details.plot || '',
                    cast: details.cast || [],
                    releaseYear: details.releaseYear || 0,
                    imdbRating: details.rating || 0,
                    director: details.director || '',
                    runtime: details.runtime || ''
                });
            }
        } finally {
            setIsSearching(false);
            setSearchResults([]);
            setSearchQuery('');
        }
    };

    const openAddModal = () => {
        setEditingMovie(null);
        setFormData({
            title: '',
            status: 'to-watch',
            rating: 0,
            notes: '',
            genre: '',
            imdbId: '',
            poster: '',
            plot: '',
            cast: [],
            releaseYear: 0,
            imdbRating: 0,
            director: '',
            runtime: ''
        });
        setSearchQuery('');
        setSearchResults([]);
        setIsModalOpen(true);
    };

    const openEditModal = (movie: Movie) => {
        setEditingMovie(movie);
        setFormData({
            title: movie.title,
            status: movie.status,
            rating: movie.rating || 0,
            notes: movie.notes || '',
            genre: movie.genre || '',
            imdbId: movie.imdbId || '',
            poster: movie.poster || '',
            plot: movie.plot || '',
            cast: movie.cast || [],
            releaseYear: movie.releaseYear || 0,
            imdbRating: movie.imdbRating || 0,
            director: movie.director || '',
            runtime: movie.runtime || ''
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingMovie) {
            setMovies(prev => prev.map(m =>
                m.id === editingMovie.id
                    ? { ...m, ...formData }
                    : m
            ));
        } else {
            const newMovie: Movie = {
                id: generateId(),
                title: formData.title,
                status: formData.status,
                rating: formData.rating,
                notes: formData.notes,
                genre: formData.genre,
                addedDate: new Date().toISOString(),
                // Include OMDb metadata
                imdbId: formData.imdbId,
                poster: formData.poster,
                plot: formData.plot,
                cast: formData.cast,
                releaseYear: formData.releaseYear,
                imdbRating: formData.imdbRating,
                director: formData.director,
                runtime: formData.runtime
            };
            setMovies(prev => [newMovie, ...prev]);
        }

        setIsModalOpen(false);
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this movie?')) {
            setMovies(prev => prev.filter(m => m.id !== id));
        }
    };

    const handleStatusChange = (id: string, newStatus: Movie['status']) => {
        setMovies(prev => prev.map(m =>
            m.id === id ? { ...m, status: newStatus } : m
        ));
    };

    const renderStars = (rating: number) => {
        return (
            <div style={{ display: 'flex', color: 'var(--accent-yellow)' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star}>
                        {star <= rating ? <IoStar size={14} /> : <IoStarOutline size={14} />}
                    </span>
                ))}
            </div>
        );
    };

    const counts = {
        toWatch: movies.filter(m => m.status === 'to-watch').length,
        watching: movies.filter(m => m.status === 'watching').length,
        watched: movies.filter(m => m.status === 'watched').length,
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">
                    <IoFilmOutline size={24} />
                    Movies Watchlist
                </h1>
                <button className="btn btn-primary" onClick={openAddModal}>
                    <IoAddOutline size={16} /> Add Movie
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <div className="card" style={{ padding: '12px' }}>
                    <h3 style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>To Watch</h3>
                    <div style={{ fontSize: '20px', fontWeight: 600 }}>{counts.toWatch}</div>
                </div>
                <div className="card" style={{ padding: '12px' }}>
                    <h3 style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Watching</h3>
                    <div style={{ fontSize: '20px', fontWeight: 600 }}>{counts.watching}</div>
                </div>
                <div className="card" style={{ padding: '12px' }}>
                    <h3 style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Watched</h3>
                    <div style={{ fontSize: '20px', fontWeight: 600 }}>{counts.watched}</div>
                </div>
            </div>

            <div className="table-filters" style={{ marginBottom: '24px' }}>
                <button
                    className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('all')}
                >
                    All Movies
                </button>
                <button
                    className={`filter-btn ${statusFilter === 'to-watch' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('to-watch')}
                >
                    To Watch
                </button>
                <button
                    className={`filter-btn ${statusFilter === 'watching' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('watching')}
                >
                    Watching
                </button>
                <button
                    className={`filter-btn ${statusFilter === 'watched' ? 'active' : ''}`}
                    onClick={() => setStatusFilter('watched')}
                >
                    Watched
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                {filteredMovies.map(movie => (
                    <div key={movie.id} className="card movie-card" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ position: 'relative', width: '100%', height: '200px', marginBottom: '12px', borderRadius: 'var(--radius-md)', overflow: 'hidden', backgroundColor: 'var(--bg-secondary)' }}>
                            {movie.poster ? (
                                <Image
                                    src={movie.poster}
                                    alt={movie.title}
                                    fill
                                    style={{ objectFit: 'cover' }}
                                    unoptimized
                                />
                            ) : (
                                <div style={{
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: 'linear-gradient(135deg, rgba(136, 192, 208, 0.1) 0%, rgba(184, 90, 90, 0.1) 100%)',
                                    color: 'var(--text-muted)'
                                }}>
                                    <IoFilmOutline size={64} style={{ opacity: 0.3 }} />
                                </div>
                            )}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <div>
                                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>{movie.title}</h3>
                                {movie.releaseYear && (
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{movie.releaseYear}</span>
                                )}
                            </div>
                            {(movie.imdbRating || 0) > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-yellow)' }}>
                                    <IoStar size={16} />
                                    <span style={{ fontSize: '14px', fontWeight: 600 }}>{(movie.imdbRating || 0).toFixed(1)}</span>
                                </div>
                            )}
                        </div>

                        <div style={{ marginBottom: '12px' }}>
                            <span
                                style={{
                                    display: 'inline-block',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    fontWeight: 500,
                                    backgroundColor:
                                        movie.status === 'watched' ? 'rgba(74, 139, 110, 0.2)' :
                                            movie.status === 'watching' ? 'rgba(235, 203, 139, 0.2)' :
                                                'rgba(136, 192, 208, 0.2)',
                                    color:
                                        movie.status === 'watched' ? 'var(--accent-green)' :
                                            movie.status === 'watching' ? 'var(--accent-yellow)' :
                                                'var(--accent-blue)',
                                    marginRight: '8px'
                                }}
                            >
                                {movie.status === 'to-watch' ? 'To Watch' :
                                    movie.status === 'watching' ? 'Watching' : 'Watched'}
                            </span>
                            {movie.genre && (
                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                    {movie.genre}
                                </span>
                            )}
                        </div>

                        {movie.plot && (
                            <p style={{
                                fontSize: '13px',
                                color: 'var(--text-muted)',
                                marginBottom: '12px',
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                            }}>
                                {movie.plot}
                            </p>
                        )}

                        {movie.cast && movie.cast.length > 0 && (
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                                <strong>Cast:</strong> {movie.cast.slice(0, 3).join(', ')}
                            </p>
                        )}

                        {movie.notes && (
                            <p style={{
                                fontSize: '12px',
                                color: 'var(--text-secondary)',
                                marginBottom: '12px',
                                fontStyle: 'italic',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                            }}>
                                "{movie.notes}"
                            </p>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                            <button
                                className="btn btn-secondary"
                                style={{ fontSize: '12px', padding: '6px 12px' }}
                                onClick={() => {
                                    const nextStatus =
                                        movie.status === 'to-watch' ? 'watching' :
                                            movie.status === 'watching' ? 'watched' : 'to-watch';
                                    handleStatusChange(movie.id, nextStatus);
                                }}
                            >
                                {movie.status === 'to-watch' ? <><IoEyeOutline size={14} /> Start</> :
                                    movie.status === 'watching' ? <><IoCheckmarkCircleOutline size={14} /> Finish</> :
                                        <><IoEyeOutline size={14} /> Rewatch</>}
                            </button>

                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button className="btn btn-icon" onClick={() => openEditModal(movie)}>
                                    <IoCreateOutline size={14} />
                                </button>
                                <button className="btn btn-icon" onClick={() => handleDelete(movie.id)}>
                                    <IoTrashOutline size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredMovies.length === 0 && (
                <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                    <p>No movies found.</p>
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setSearchResults([]); setSearchQuery(''); }}
                title={editingMovie ? "Edit Movie" : "Add Movie"}
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => { setIsModalOpen(false); setSearchResults([]); setSearchQuery(''); }}>
                            Cancel
                        </button>
                        <button className="btn btn-primary" onClick={handleSubmit} disabled={!formData.title}>
                            {editingMovie ? 'Update' : 'Add'}
                        </button>
                    </>
                }
            >
                <form onSubmit={handleSubmit}>
                    {!editingMovie && (
                        <div className="form-group">
                            <label className="form-label">Search Movie</label>
                            <div style={{ position: 'relative' }}>
                                <IoSearchOutline style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 1 }} />
                                <input
                                    type="text"
                                    className="form-input"
                                    value={searchQuery}
                                    onChange={(e) => handleMovieSearch(e.target.value)}
                                    placeholder="Search for a movie..."
                                    style={{ paddingLeft: '36px' }}
                                />
                                {isSearching && (
                                    <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: 'var(--text-muted)' }}>
                                        Searching...
                                    </div>
                                )}

                                {searchResults.length > 0 && (
                                    <div style={{
                                        position: 'absolute', left: 0, zIndex: 20, width: '100%',
                                        marginTop: '4px',
                                        backgroundColor: 'var(--bg-elevated)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: 'var(--radius-md)',
                                        maxHeight: '450px',
                                        overflowY: 'auto',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                                    }}>
                                        {searchResults.map((result: any) => (
                                            <div
                                                key={result.id}
                                                style={{
                                                    padding: '12px 16px',
                                                    cursor: 'pointer',
                                                    borderBottom: '1px solid var(--border-light)',
                                                    display: 'flex',
                                                    gap: '12px',
                                                    alignItems: 'center',
                                                    transition: 'background-color 0.2s'
                                                }}
                                                onClick={() => selectMovie(result)}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                                {result.poster && (
                                                    <Image
                                                        src={result.poster}
                                                        alt={result.title}
                                                        width={40}
                                                        height={60}
                                                        style={{ borderRadius: '4px', objectFit: 'cover' }}
                                                        unoptimized
                                                    />
                                                )}
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{result.title}</div>
                                                    {result.releaseYear && (
                                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{result.releaseYear}</div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {formData.title && (
                        <>
                            {formData.poster && (
                                <div style={{ marginBottom: '16px', textAlign: 'center' }}>
                                    <Image
                                        src={formData.poster}
                                        alt={formData.title}
                                        width={200}
                                        height={300}
                                        style={{ borderRadius: 'var(--radius-md)', objectFit: 'cover' }}
                                        unoptimized
                                    />
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label">Title</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="Movie title"
                                    required
                                    readOnly={!editingMovie}
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Status</label>
                                    <select
                                        className="form-select"
                                        value={formData.status}
                                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as Movie['status'] }))}
                                    >
                                        <option value="to-watch">To Watch</option>
                                        <option value="watching">Watching</option>
                                        <option value="watched">Watched</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Genre</label>
                                    <select
                                        className="form-select"
                                        value={formData.genre}
                                        onChange={(e) => setFormData(prev => ({ ...prev, genre: e.target.value }))}
                                    >
                                        <option value="">Select Genre</option>
                                        {MOVIE_GENRES.map(g => (
                                            <option key={g} value={g}>{g}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Your Notes (Optional)</label>
                                <textarea
                                    className="form-input"
                                    value={formData.notes}
                                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                    placeholder="Add your review or thoughts..."
                                    rows={3}
                                    style={{ resize: 'vertical' }}
                                />
                            </div>
                        </>
                    )}
                </form>
            </Modal>
        </div>
    );
}


