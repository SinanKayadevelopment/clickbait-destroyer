import { Trash2, Clock, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

interface ResultCardProps {
    videoId: string;
    truth: string;
    timeSaved: number;
}

export default function ResultCard({ videoId, truth, timeSaved }: ResultCardProps) {
    return (
        <div className="w-full max-w-2xl mt-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="relative group">
                {/* Glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-[#e63946] to-[#ff4d6d] rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>

                <div className="relative bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden">
                    {/* YouTube Thumbnail Preview (Small) */}
                    <div className="flex gap-4 p-4 border-b border-white/5 bg-black/20">
                        <div className="relative w-32 h-20 bg-white/5 rounded-lg overflow-hidden border border-white/10">
                            <Image
                                src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                                alt="Video Thumbnail"
                                fill
                                className="object-cover w-full h-full"
                            />
                        </div>
                        <div className="flex flex-col justify-center">
                            <span className="text-[10px] font-mono text-[#e63946] uppercase tracking-widest mb-1">Target Identified</span>
                            <h3 className="text-white font-medium line-clamp-2 text-sm">VIDEO ID: {videoId}</h3>
                        </div>
                    </div>

                    <div className="p-8">
                        <div className="flex items-center gap-2 mb-4 text-[#e63946]">
                            <Trash2 className="w-5 h-5" />
                            <span className="text-xs font-mono font-black uppercase tracking-[0.2em]">De-Clickbaiting Complete</span>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-mono text-white/30 uppercase tracking-widest block mb-2">The Truth</label>
                                <p className="text-2xl md:text-3xl font-bold text-white leading-tight">
                                    {truth}
                                </p>
                            </div>

                            <div className="pt-6 flex items-center justify-between border-t border-white/5">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#e63946]/10 border border-[#e63946]/20 rounded-full">
                                    <Clock className="w-4 h-4 text-[#e63946]" />
                                    <span className="text-xs font-bold text-[#e63946] uppercase">~{timeSaved} MIN SAVED</span>
                                </div>

                                <div className="flex items-center gap-1.5 text-white/40">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span className="text-[10px] font-mono uppercase tracking-widest">Verified by AI</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
