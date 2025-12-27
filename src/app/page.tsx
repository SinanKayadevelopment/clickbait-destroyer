'use client';

import { useState } from 'react';
import { Youtube, Zap, ShieldAlert, Loader2 } from 'lucide-react';
import ResultCard from '@/components/ResultCard';

export default function Home() {
  const [url, setUrl] = useState('');
  const [language, setLanguage] = useState<'English' | 'Turkish'>('English');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    truth: string;
    videoId: string;
    timeSaved: number;
  } | null>(null);

  const handleDestroy = async () => {
    if (!url) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    const apiKey = localStorage.getItem('gemini_api_key');

    try {
      const response = await fetch('/api/destroy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, apiKey, language }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0f0f0f] text-white flex flex-col items-center justify-center p-6 selection:bg-[#e63946] selection:text-white">
      {/* Hero Section */}
      <div className={`w-full max-w-4xl flex flex-col items-center transition-all duration-1000 ${result ? 'mb-12' : 'mt-[-10vh]'}`}>
        <div className="flex items-center gap-3 mb-6 animate-pulse">
          <div className="bg-[#e63946] p-2 rounded-lg">
            <Zap className="w-8 h-8 text-white fill-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter italic uppercase">
            De-Clickbaiter
          </h1>
        </div>

        <p className="text-white/40 font-mono text-sm mb-8 uppercase tracking-[0.3em]">
          Liberating your time from YouTube bait.
        </p>

        {/* Language Selector */}
        <div className="flex gap-2 mb-8 bg-white/5 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setLanguage('English')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${language === 'English' ? 'bg-[#e63946] text-white' : 'text-white/30 hover:text-white/60'}`}
          >
            English
          </button>
          <button
            onClick={() => setLanguage('Turkish')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${language === 'Turkish' ? 'bg-[#e63946] text-white' : 'text-white/30 hover:text-white/60'}`}
          >
            Turkish
          </button>
        </div>

        {/* Search Bar Container */}
        <div className="w-full max-w-2xl relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#e63946] to-transparent rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-500"></div>

          <div className="relative flex flex-col md:flex-row gap-2 bg-[#1a1a1a] border border-white/10 p-2 rounded-2xl shadow-2xl">
            <div className="flex-1 flex items-center px-4 gap-3">
              <Youtube className="w-6 h-6 text-[#e63946]" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste YouTube Link (e.g., MrBeast, TEDx)..."
                className="w-full bg-transparent border-none text-white placeholder:text-white/20 focus:outline-none py-4 text-lg"
                onKeyDown={(e) => e.key === 'Enter' && handleDestroy()}
              />
            </div>
            <button
              onClick={handleDestroy}
              disabled={isLoading || !url}
              className="bg-[#e63946] hover:bg-[#cc323d] disabled:bg-white/5 disabled:text-white/20 text-white font-black px-8 py-4 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Destroy Clickbait'
              )}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-6 flex items-center gap-2 text-[#e63946] bg-[#e63946]/10 px-4 py-2 rounded-lg border border-[#e63946]/20 animate-in fade-in zoom-in-95">
            <ShieldAlert className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">{error}</span>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="w-full max-w-2xl mt-12 space-y-4 animate-pulse">
            <div className="h-24 bg-white/5 border border-white/10 rounded-2xl flex gap-4 p-4">
              <div className="w-32 h-full bg-white/5 rounded-lg"></div>
              <div className="flex-1 space-y-2 py-2">
                <div className="h-3 w-1/4 bg-white/10 rounded"></div>
                <div className="h-4 w-3/4 bg-white/10 rounded"></div>
              </div>
            </div>
            <div className="h-40 bg-white/5 border border-white/10 rounded-2xl p-8 space-y-4">
              <div className="h-3 w-20 bg-white/10 rounded"></div>
              <div className="h-8 w-full bg-white/10 rounded"></div>
              <div className="h-8 w-2/3 bg-white/10 rounded"></div>
            </div>
          </div>
        )}

        {/* Result Display */}
        {result && (
          <ResultCard
            videoId={result.videoId}
            truth={result.truth}
            timeSaved={result.timeSaved}
          />
        )}
      </div>

      {/* Footer / Info */}
      <footer className="fixed bottom-6 text-center">
        <p className="text-[10px] font-mono text-white/20 uppercase tracking-[0.4em]">
          Vigilante Tech &copy; 2025 // No Bait Left Behind
        </p>
      </footer>
    </main>
  );
}
