import { SessionInfo } from '@/adapters/types';
import { Calendar, ChevronRight, Loader2, PlayCircle } from 'lucide-react';

interface SessionChooserProps {
  onBack: () => void;
  onSelect: (id: string) => void;
  // FIX: Must be an array []
  sessions: SessionInfo[]; 
  isLoading: boolean;
}

export function SessionChooser({ onBack, onSelect, sessions, isLoading }: SessionChooserProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-red-600 mb-4" />
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/30">
          Accessing Race Archives...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-black italic uppercase tracking-tighter">
          Select <span className="text-red-600">Session</span>
        </h2>
        <button 
          onClick={onBack}
          className="text-[10px] font-mono text-white/40 hover:text-white transition-colors"
        >
          [ RETURN ]
        </button>
      </div>

      <div className="space-y-3">
        {sessions.length > 0 ? (
          sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => onSelect(session.id)}
              className="w-full group flex items-center justify-between p-4 bg-zinc-900/50 border border-white/5 hover:border-red-600/50 transition-all rounded-sm"
            >
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-center min-w-[40px] border-r border-white/10 pr-6">
                  <span className="text-xl font-black text-white/20 group-hover:text-red-600 transition-colors">
                    {session.round}
                  </span>
                  <span className="text-[8px] font-bold text-white/10 uppercase">RND</span>
                </div>

                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white uppercase tracking-tight">
                      {session.name}
                    </span>
                    <span className="text-[8px] bg-white/5 text-white/40 px-1 rounded font-bold uppercase border border-white/10">
                      {session.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[10px] font-mono text-white/30 uppercase">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {session.year}
                    </span>
                    <span>{session.date}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                 <span className="text-[9px] font-mono text-white/0 group-hover:text-red-600 transition-all uppercase tracking-widest translate-x-2 group-hover:translate-x-0">
                   Link Start
                 </span>
                 <PlayCircle className="w-5 h-5 text-white/10 group-hover:text-red-600 transition-colors" />
              </div>
            </button>
          ))
        ) : (
          <div className="p-12 text-center border border-dashed border-white/10 rounded">
            <p className="font-mono text-xs text-white/20 uppercase">No active data streams found</p>
          </div>
        )}
      </div>
    </div>
  );
}