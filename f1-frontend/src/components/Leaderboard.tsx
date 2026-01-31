import { motion, AnimatePresence } from 'framer-motion';
import { Driver, BattleZone } from '@/types/race'; 
import { Flag, Gauge, Activity, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeaderboardProps {
  drivers: Driver[];
  selectedDriverId: string | null;
  onSelectDriver: (id: string) => void;
  currentLap: number;
  totalLaps: number;
  battleZones?: BattleZone[];
}

export function Leaderboard({ 
  drivers = [], // Default empty array
  selectedDriverId, 
  onSelectDriver, 
  currentLap,
  totalLaps
}: LeaderboardProps) {
  
  // 1. Safety Sort: Handle potential undefined drivers or positions
  const sortedDrivers = [...drivers].sort((a, b) => (a.position || 0) - (b.position || 0));

  return (
    <div className="flex flex-col h-full bg-black/60 backdrop-blur-xl border-l border-white/10 select-none overflow-hidden font-mono">
      
      {/* --- HEADER --- */}
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-zinc-900/80 text-white">
        <div className="flex items-center gap-3">
          <Flag className="w-4 h-4 text-red-600" />
          <div className="flex flex-col">
            <span className="text-[10px] text-white/40 uppercase tracking-tighter leading-none mb-1">Race Progress</span>
            <span className="text-sm font-black tracking-tighter">
              LAP <span className="text-xl text-red-600 ml-1">{currentLap}</span>
              <span className="text-white/20 mx-1">/</span>
              <span className="text-white/60">{totalLaps}</span>
            </span>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2 px-2 py-1 rounded bg-red-600/10 border border-red-600/20">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-600"></span>
            </span>
            <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Live Signal</span>
          </div>
          <span className="text-[8px] text-white/20 uppercase tracking-tighter">Monza / 2026</span>
        </div>
      </div>

      {/* --- DRIVER LIST --- */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
        <AnimatePresence initial={false}>
          {sortedDrivers.map((driver) => {
            const isSelected = selectedDriverId === driver.id;
            
            // --- CRASH PREVENTION DEFAULTS ---
            const health = driver.strategy?.tyreHealth ?? 100;
            const compound = driver.strategy?.compound || 'MEDIUM';
            const age = driver.strategy?.tyreAge ?? 0;
            const physics = driver.physics || { speed: 0, drs: false, gear: 0 };
            const gap = driver.gap || '---'; // Prevent .includes() on undefined
            const sectors = driver.sectors || [];

            const healthColor = 
              health > 70 ? "bg-emerald-500" : 
              health > 40 ? "bg-orange-500" : 
              "bg-red-600 animate-pulse";

            return (
              <motion.div
                key={driver.id}
                layout
                onClick={() => onSelectDriver(driver.id)}
                className={cn(
                  "relative flex items-center justify-between p-2 rounded transition-all cursor-pointer border border-transparent",
                  isSelected ? "bg-white/10 border-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]" : "hover:bg-white/5"
                )}
              >
                {/* 1. IDENTITY BLOCK */}
                <div className="flex items-center gap-3 min-w-[120px]">
                  <span className={cn(
                    "w-5 text-right text-xs font-bold transition-colors",
                    isSelected ? "text-white" : "text-white/30"
                  )}>
                    {driver.position}
                  </span>
                  <div className="h-9 w-1 rounded-full shadow-lg" style={{ backgroundColor: driver.teamColor }} />
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 text-white">
                        <span className="font-black text-sm tracking-tight uppercase">{driver.code || driver.id}</span>
                        {physics.drs && (
                            <motion.span 
                              animate={{ opacity: [1, 0.5, 1] }}
                              transition={{ duration: 0.5, repeat: Infinity }}
                              className="bg-emerald-500 text-[8px] text-black px-1 rounded font-black leading-tight"
                            >
                              DRS
                            </motion.span>
                        )}
                    </div>
                    <span className="text-[8px] text-white/40 uppercase font-bold truncate max-w-[80px]">
                      {driver.team}
                    </span>
                  </div>
                </div>

                {/* 2. STRATEGY BLOCK */}
                <div className="flex flex-col items-center gap-1.5 flex-1 px-4 max-w-[110px]">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center text-[7px] font-black",
                      compound.includes('SOFT') ? "border-red-500 text-red-500" :
                      compound.includes('MEDIUM') ? "border-yellow-400 text-yellow-400" :
                      compound.includes('HARD') ? "border-white text-white" :
                      "border-emerald-400 text-emerald-400"
                    )}>
                      {compound.charAt(0)}
                    </div>
                    <span className="text-[9px] text-white/50 font-bold">L{age}</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                      className={cn("h-full transition-colors duration-500", healthColor)}
                      initial={{ width: 0 }}
                      animate={{ width: `${health}%` }}
                    />
                  </div>
                </div>

                {/* 3. TIMING BLOCK */}
                <div className="flex flex-col items-end gap-1 min-w-[85px]">
                  <span className={cn(
                    "text-[11px] font-bold tracking-tighter",
                    gap.includes('+0.') || gap === 'INTERVAL' ? "text-yellow-400" : "text-white/90"
                  )}>
                    {gap}
                  </span>
                  <div className="flex gap-1.5">
                    {sectors.map((s, idx) => (
                      <div key={idx} className="flex flex-col items-center">
                        <div 
                            className={cn(
                            "w-1.5 h-1.5 rounded-full mb-0.5 transition-all duration-300",
                            s.status === 'purple' ? "bg-purple-500 shadow-[0_0_8px_#a855f7] scale-125" :
                            s.status === 'green' ? "bg-emerald-500 scale-110" :
                            s.status === 'yellow' ? "bg-yellow-500" :
                            "bg-white/10"
                            )}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {isSelected && (
                    <motion.div 
                      layoutId="active-pill"
                      className="absolute -left-1 top-1 bottom-1 w-1 bg-red-600 rounded-full shadow-[0_0_15px_rgba(220,38,38,0.8)]" 
                    />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* --- FOOTER: MASTER HUD --- */}
      <div className="p-4 border-t border-white/10 bg-zinc-900/90 flex justify-between items-center px-4">
        <div className="flex flex-col gap-1.5 text-white">
          <div className="flex items-center gap-4 text-[9px] font-black text-white/30 uppercase tracking-widest">
            <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Fastest</span>
            <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Personal</span>
          </div>
          <div className="flex items-center gap-2 text-[8px] text-white/10 font-bold tracking-widest uppercase">
            <Activity className="w-3 h-3" /> Signal: 10Hz
          </div>
        </div>
        
        <AnimatePresence mode="wait">
          {selectedDriverId ? (
            <motion.div 
              key="selected-hud"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center gap-4 text-white"
            >
               <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2 font-black text-sm">
                    <Gauge className="w-4 h-4 text-red-600" />
                    <span>{drivers.find(d => d.id === selectedDriverId)?.physics?.speed ?? 0}</span>
                    <span className="text-[10px] text-white/30">KM/H</span>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] text-white/40 uppercase">
                    <Timer className="w-3 h-3" />
                    <span>Pos {drivers.find(d => d.id === selectedDriverId)?.position ?? '-'}</span>
                  </div>
               </div>
               <div className="flex items-center justify-center w-10 h-10 bg-white/5 rounded-lg border border-white/10 relative overflow-hidden">
                  <span className="text-xl font-black z-10">
                    {drivers.find(d => d.id === selectedDriverId)?.physics?.gear ?? 'N'}
                  </span>
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-red-600 shadow-[0_0_10px_red]" />
               </div>
            </motion.div>
          ) : (
            <motion.div 
              key="no-selection"
              className="text-[9px] text-white/10 uppercase tracking-widest font-black"
            >
              Select Telemetry
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}