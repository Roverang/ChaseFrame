import { useState } from 'react';
import { LandingPage } from '@/components/LandingPage';
import { RaceView } from '@/components/RaceView';
import { SessionChooser } from '@/components/SessionChooser';
import { useRaceData } from '@/hooks/useRaceData';

type ViewState = 'landing' | 'session' | 'race';

const Index = () => {
  const [currentView, setCurrentView] = useState<ViewState>('landing');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // Initialize the hook
  const { 
    snapshot, 
    status, 
    sessions, 
    loadingSessions, 
    connect, 
    disconnect, 
    adapter 
  } = useRaceData({ mode: 'live' });

  const handleEnterRace = async (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setCurrentView('race');
    await connect(sessionId);
  };

  const handleLeaveRace = () => {
    disconnect();
    setCurrentView('landing');
    setSelectedSessionId(null);
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono selection:bg-red-500/30">
      
      {/* 1. LANDING VIEW */}
      {currentView === 'landing' && (
        <LandingPage
          onEnterRace={() => handleEnterRace('monza-2024-race')}
          onChooseSession={() => setCurrentView('session')}
        />
      )}

      {/* 2. SESSION SELECTION VIEW */}
      {currentView === 'session' && (
        <SessionChooser
          onBack={() => setCurrentView('landing')}
          onSelect={(id) => handleEnterRace(id)}
          // Pass the sessions from our hook to the chooser
          sessions={sessions}
          isLoading={loadingSessions}
        />
      )}

      {/* 3. LIVE RACE COMMANDER VIEW - FIXED PROPS */}
      {currentView === 'race' && (
        <RaceView 
          onBack={handleLeaveRace}
          sessionName={selectedSessionId || ''}
          // Pass the whole snapshot object as expected by RaceView.tsx
          snapshot={snapshot}
          adapter={adapter}
        />
      )}

      {/* Connection Overlay */}
      {status === 'connecting' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-12 h-12 border-2 border-red-600 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(220,38,38,0.3)]" />
            <div className="space-y-1">
                <span className="block text-[10px] tracking-[0.5em] text-red-600 font-black uppercase">
                  Establishing Data Link
                </span>
                <span className="block text-[8px] tracking-[0.2em] text-white/30 font-mono uppercase">
                  Synchronizing Bayesian Strategy Engine
                </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;