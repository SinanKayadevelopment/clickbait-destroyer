'use client';

import { useState, useEffect } from 'react';
import { Settings, X } from 'lucide-react';

export default function SettingsModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [apiKey, setApiKey] = useState('');

    useEffect(() => {
        const savedKey = localStorage.getItem('gemini_api_key');
        if (savedKey) {
            // Use setTimeout to avoid synchronous setState during render/effect
            const timer = setTimeout(() => {
                setApiKey(savedKey);
            }, 0);
            return () => clearTimeout(timer);
        }
    }, []);

    const saveKey = () => {
        localStorage.setItem('gemini_api_key', apiKey);
        setIsOpen(false);
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="fixed top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
            >
                <Settings className="w-6 h-6 text-white" />
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#1a1a1a] border border-white/10 p-8 rounded-2xl w-full max-w-md relative">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 text-white/50 hover:text-white"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
                            <Settings className="w-6 h-6 text-[#e63946]" />
                            SETTINGS
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-mono text-white/50 mb-2 uppercase tracking-widest">
                                    Google Gemini API Key
                                </label>
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="Paste your key here..."
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#e63946] transition-colors"
                                />
                            </div>
                            <p className="text-sm text-white/40">
                                Your key is stored locally in your browser. Get a free key at{' '}
                                <a
                                    href="https://aistudio.google.com/app/apikey"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#e63946] hover:underline"
                                >
                                    Google AI Studio
                                </a>
                            </p>
                            <button
                                onClick={saveKey}
                                className="w-full bg-[#e63946] hover:bg-[#cc323d] text-white font-bold py-3 rounded-lg transition-colors uppercase tracking-widest"
                            >
                                Save Configuration
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
