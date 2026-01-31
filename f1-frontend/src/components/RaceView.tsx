import { useState } from 'react';
import { TrackMap } from './TrackMap';
import { Leaderboard } from './Leaderboard';
import { BottomHUD } from './BottomHUD';
import { WeatherIndicator } from './WeatherIndicator';
import { ArrowLeft, Loader2 } from 'lucide-react';

// --- IMPORT CORE TRUTH FROM RACE.TS ---
import type { 
  RaceSnapshot,  
  Driver, 
  BattleZone,
  WeatherInfo
} from '@/types/race';

// --- IMPORT INTERFACE FROM ADAPTER TYPES ---
import type { RaceDataAdapter } from '../adapters/types';

interface RaceViewProps {
  onBack: () => void;
  sessionName?: string;
  snapshot: RaceSnapshot | null;
  adapter: RaceDataAdapter | null;
}

export function RaceView({ onBack, sessionName, snapshot, adapter }: RaceViewProps) {
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

  // 1. Data extraction with safe fallbacks and explicit typing
  const drivers: Driver[] = snapshot?.drivers ?? [];
  
  const weather: WeatherInfo = snapshot?.weather ?? { 
    condition: 'clear', 
    trackTemp: 0, 
    airTemp: 0, 
    humidity: 0, 
    windSpeed: 0,
    windDirection: 0, // Added to match WeatherInfo interface
    rain_state: 'DRY' 
  };

  const battleZones: BattleZone[] = snapshot?.battleZones ?? [];
  const currentLap = snapshot?.session?.currentLap ?? 0;
  const totalLaps = snapshot?.session?.totalLaps ?? 0;

  const selectedDriver = drivers.find(d => d.id === selectedDriverId) || null;
  const isChaseMode = selectedDriverId !== null;

  const handleSelectDriver = (driverId: string) => {
    setSelectedDriverId(prev => prev === driverId ? null : driverId);
  };

  // 2. Connection/Loading Screen
  if (!snapshot) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-4 z-50">
        <Loader2 className="w-10 h-10 animate-spin text-red-600" />
        <div className="flex flex-col items-center">
            <span className="font-mono text-sm text-white tracking-[0.3em] uppercase">
                Synchronizing Live Feed
            </span>
            <span className="font-mono text-[10px] text-white/30 uppercase mt-2">
                {sessionName || 'Race Session'}
            </span>
        </div>
        <button 
            onClick={onBack} 
            className="mt-6 px-4 py-2 border border-white/10 rounded font-mono text-[10px] text-white/40 hover:text-white transition-all"
        >
          ABORT_CONNECTION
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden">
      {/* HEADER HUD */}
      <header className="h-14 flex items-center justify-between px-6 border-b border-white/10 bg-zinc-950/50 backdrop-blur-md z-30 font-mono">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-white/40 hover:text-white transition-all group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] tracking-widest font-bold uppercase">Disconnect Terminal</span>
        </button>
        
        <div className="flex items-center gap-8">
          <WeatherIndicator weather={weather} />
          <div className="w-px h-6 bg-white/10" />
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end leading-none">
                <span className="text-[9px] text-white/30 uppercase mb-1">Session Data</span>
                <span className="text-sm tracking-tighter text-white font-black uppercase">
                  {snapshot.session?.name || sessionName}
                </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-red-600/10 border border-red-600/30">
              <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse shadow-[0_0_8px_red]" />
              <span className="text-[9px] font-black text-red-600 tracking-widest uppercase">Live</span>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN DATA PANELS */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-6 relative">
          <TrackMap 
            drivers={drivers}
            selectedDriverId={selectedDriverId}
            onSelectDriver={handleSelectDriver}
            isChaseMode={isChaseMode}
            battleZones={battleZones}
            adapter={adapter}
            year={snapshot.session?.year ?? 2024}
            round={snapshot.session?.round ?? 1}
          />
        </div>

        <div className="w-80 xl:w-[400px] p-6 pl-0">
          <Leaderboard 
            drivers={drivers}
            selectedDriverId={selectedDriverId}
            onSelectDriver={handleSelectDriver}
            currentLap={currentLap}
            totalLaps={totalLaps}
          />
        </div>
      </div>

      <BottomHUD selectedDriver={selectedDriver} />
    </div>
  );
}