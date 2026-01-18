'use client';

import { useState, useRef, useEffect } from 'react';
import {
    IoMicOutline,
    IoMicOffOutline,
    IoSendOutline,
    IoSparklesOutline,
    IoCloseOutline,
    IoImageOutline,
    IoTrashOutline,
    IoSyncOutline
} from 'react-icons/io5';
import { Transaction, Movie, Note, Password, Stock } from '@/types';
import { generateId, getMonthFromDate } from '@/hooks/useLocalStorage';
import Image from 'next/image';

interface AIInputProps {
    onDataCreated: (type: string, data: unknown) => void;
}

export default function AIInput({ onDataCreated }: AIInputProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const recognitionRef = useRef<any>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Initialize speech recognition
        if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-IN';

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInput(prev => prev + ' ' + transcript);
                setIsListening(false);
            };

            recognitionRef.current.onerror = () => {
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            setMessage({ type: 'error', text: 'Speech recognition not supported in this browser' });
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                setMessage({ type: 'error', text: 'Image size should be less than 5MB' });
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result as string);
                setMessage(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const clearImage = () => {
        setSelectedImage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async () => {
        if ((!input.trim() && !selectedImage) || isLoading) return;

        setIsLoading(true);
        setMessage(null);

        try {
            const response = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    input: input.trim(),
                    image: selectedImage
                }),
            });

            const result = await response.json();

            if (result.error) {
                setMessage({ type: 'error', text: result.message });
            } else {
                // Process the data based on type
                let processedData: unknown;

                switch (result.dataType) {
                    case 'transaction':
                        processedData = {
                            id: generateId(),
                            source: result.data.source,
                            amount: result.data.amount,
                            tags: result.data.tags || [],
                            date: result.data.date || new Date().toISOString().split('T')[0],
                            month: getMonthFromDate(result.data.date || new Date().toISOString().split('T')[0]),
                            type: result.data.type,
                        } as Transaction & { forcedBalance?: number };

                        // Attach forced balance if present
                        if (result.data.forcedBalance) {
                            (processedData as any).forcedBalance = Number(result.data.forcedBalance);
                        }
                        break;
                    case 'movie':
                        processedData = {
                            id: generateId(),
                            title: result.data.title,
                            status: result.data.status || 'to-watch',
                            rating: result.data.rating,
                            notes: result.data.notes,
                            genre: result.data.genre,
                            addedDate: new Date().toISOString(),
                        } as Movie;
                        break;
                    case 'note':
                        processedData = {
                            id: generateId(),
                            title: result.data.title,
                            content: result.data.content,
                            category: result.data.category || 'General',
                            createdAt: new Date().toISOString(),
                        } as Note;
                        break;
                    case 'password':
                        processedData = {
                            id: generateId(),
                            site: result.data.site,
                            username: result.data.username,
                            password: result.data.password,
                            category: result.data.category || 'Other',
                            createdAt: new Date().toISOString(),
                        } as Password;
                        break;
                    case 'investment':
                        processedData = {
                            id: generateId(),
                            symbol: result.data.symbol || 'UNKNOWN',
                            name: result.data.name || result.data.symbol,
                            type: result.data.type || 'MF',
                            quantity: Number(result.data.quantity) || 0,
                            buyPrice: Number(result.data.buyPrice) || 0,
                            currentPrice: Number(result.data.currentPrice) || Number(result.data.buyPrice) || 0,
                            totalInvested: Number(result.data.totalInvested) || undefined,
                            sipAmount: Number(result.data.sipAmount) || undefined,
                            sipDate: Number(result.data.sipDate) || 5, // Default to 5th if not found
                        } as Stock;

                        // Fallback logic for missing quantity
                        if ((processedData as Stock).quantity === 0) {
                            (processedData as Stock).quantity = 1;
                            // If we forced quantity to 1, ensure prices make sense relative to totals
                            if ((processedData as Stock).totalInvested && (processedData as Stock).buyPrice === 0) {
                                (processedData as Stock).buyPrice = (processedData as Stock).totalInvested!;
                            }
                        }
                        break;
                    case 'balance_update':
                        processedData = {
                            balance: Number(result.data.balance)
                        };
                        break;
                    default:
                        throw new Error('Unknown data type returned');
                }

                onDataCreated(result.dataType, processedData);
                setInput('');
                setSelectedImage(null); // Clear image after success
                setIsOpen(false);
                setMessage({ type: 'success', text: result.message });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to process request' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* FAB Button */}
            <button
                className="ai-fab"
                onClick={() => {
                    setIsOpen(!isOpen);
                    // Focus input when opening
                    if (!isOpen) setTimeout(() => inputRef.current?.focus(), 100);
                }}
                title="AI Assistant"
            >
                {isOpen ? <IoCloseOutline size={24} /> : <IoSparklesOutline size={24} />}
            </button>

            {/* AI Panel */}
            <div className={`ai-panel ${isOpen ? 'open' : ''}`}>
                <div className="ai-header">
                    <h3>Brain</h3>
                    <button className="close-btn" onClick={() => setIsOpen(false)}>
                        <IoCloseOutline size={20} />
                    </button>
                </div>

                <div className="ai-content">
                    {message && (
                        <div className={`ai-message ${message.type}`}>
                            {message.text}
                        </div>
                    )}

                    <p className="ai-hint">
                        Describe what to add or upload a screenshot (transaction, movie, note, etc.)
                    </p>

                    {/* Image Preview */}
                    {selectedImage && (
                        <div className="image-preview" style={{ position: 'relative', marginBottom: '10px', borderRadius: '8px', overflow: 'hidden' }}>
                            <img src={selectedImage} alt="Preview" style={{ maxWidth: '100%', maxHeight: '150px', objectFit: 'cover' }} />
                            <button
                                onClick={clearImage}
                                style={{
                                    position: 'absolute',
                                    top: '4px',
                                    right: '4px',
                                    background: 'rgba(0,0,0,0.6)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    padding: '4px',
                                    cursor: 'pointer',
                                    color: 'white'
                                }}
                            >
                                <IoCloseOutline size={16} />
                            </button>
                        </div>
                    )}

                    <div className="ai-input-group">
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Type or speak... (Ctrl+V to paste image)"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                            onPaste={(e) => {
                                const items = e.clipboardData.items;
                                for (let i = 0; i < items.length; i++) {
                                    if (items[i].type.indexOf('image') !== -1) {
                                        const file = items[i].getAsFile();
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                setSelectedImage(reader.result as string);
                                                setMessage(null);
                                            };
                                            reader.readAsDataURL(file);
                                            e.preventDefault(); // Prevent pasting the image filename as text
                                        }
                                    }
                                }
                            }}
                            disabled={isLoading}
                        />

                        <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/*"
                            onChange={handleImageSelect}
                            style={{ display: 'none' }}
                        />

                        <button
                            className={`icon-btn ${selectedImage ? 'active' : ''}`}
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isLoading}
                            title="Upload Image"
                        >
                            <IoImageOutline size={20} />
                        </button>

                        <button
                            className={`icon-btn ${isListening ? 'listening' : ''}`}
                            onClick={toggleListening}
                            disabled={isLoading}
                            title="Voice Input"
                        >
                            {isListening ? <IoMicOffOutline size={20} /> : <IoMicOutline size={20} />}
                        </button>

                        <button
                            className="send-btn"
                            onClick={handleSubmit}
                            disabled={(!input.trim() && !selectedImage) || isLoading}
                            title="Send"
                        >
                            {isLoading ? <IoSyncOutline size={20} className="spin" /> : <IoSendOutline size={20} />}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
