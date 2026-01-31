import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BattleZone, Driver } from '@/types/race';
import type { RaceDataAdapter } from '@/adapters/types';

interface TrackMapProps {
  drivers: Driver[];
  selectedDriverId: string | null;
  onSelectDriver: (driverId: string) => void;
  isChaseMode: boolean;
  battleZones: BattleZone[];
  adapter: RaceDataAdapter | null;
  year?: number;
  round?: number;
}

export function TrackMap({ 
  drivers, 
  selectedDriverId, 
  onSelectDriver, 
  isChaseMode, 
  battleZones = [], 
  adapter,
  year,
  round 
}: TrackMapProps) {
  const [trackPath, setTrackPath] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const WIDTH = 800;
  const HEIGHT = 600;

  useEffect(() => {
    if (!adapter || !year || !round) return;

    async function loadTrack() {
      setIsLoading(true);
      try {
        const data = await adapter!.getTrackData(year, round);
        if (data?.points && data.points.length > 0) {
          const d = data.points.map((p: any, idx: number) => 
            `${idx === 0 ? 'M' : 'L'} ${p.x * WIDTH} ${p.y * HEIGHT}`
          ).join(' ');
          setTrackPath(d);
        }
      } catch (e) {
        console.error("Track load failed", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadTrack();
  }, [adapter, year, round]);

  // --- QUALIFYING CAMERA LOGIC ---
  const selectedDriver = useMemo(() => 
    drivers.find(d => d.id === selectedDriverId), 
    [drivers, selectedDriverId]
  );

  // Dynamic ViewBox Calculation
  const vBox = useMemo(() => {
    if (isChaseMode && selectedDriver) {
      const zoomSize = 180; // Size of the zoom area (smaller = more zoom)
      // Safety check: fall back to default if coordinates are missing
      const cx = (Number(selectedDriver.x) || 0.5) * WIDTH;
      const cy = (Number(selectedDriver.y) || 0.5) * HEIGHT;
      
      return `${cx - zoomSize / 2} ${cy - zoomSize / 2} ${zoomSize} ${zoomSize}`;
    }
    return `0 0 ${WIDTH} ${HEIGHT}`;
  }, [isChaseMode, selectedDriver, WIDTH, HEIGHT]);

  return (
    <div className="relative w-full h-full overflow-hidden rounded-xl bg-black border border-white/5 shadow-2xl">
      {/* HUD OVERLAY */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none flex flex-col gap-1">
        <span className="font-mono text-[9px] tracking-[0.4em] text-white/20 uppercase">
          Tactical Map / R{round}
        </span>
        <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-[10px] text-emerald-500/80 font-bold uppercase tracking-widest">
                {isChaseMode ? `CHASE_MODE: ${selectedDriver?.id}` : 'GLOBAL_VIEW'}
            </span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center w-full h-full gap-3">
          <div className="w-8 h-8 border-2 border-white/5 border-t-white/40 rounded-full animate-spin" />
          <span className="font-mono text-[9px] text-white/30 tracking-[0.2em] uppercase text-center">Syncing Circuit<br/>Geometry</span>
        </div>
      ) : (
        <motion.svg 
          // QUALIFYING FIX: Animate the viewBox attribute directly for ultra-smooth zoom
          animate={{ viewBox: vBox }}
          transition={{ type: "tween", ease: "circOut", duration: 0.8 }}
          className="w-full h-full block touch-none"
        >
          {/* TRACK LAYOUT */}
          <path d={trackPath} stroke="rgba(255,255,255,0.04)" strokeWidth="12" fill="none" strokeLinecap="round" />
          <path d={trackPath} stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" fill="none" strokeLinecap="round" />

          {/* BATTLE ZONES */}
          <AnimatePresence>
            {battleZones.map((zone) => {
              const chaser = drivers.find(d => d.id === zone.chasingDriverId);
              if (!chaser) return null;
              return (
                <motion.circle
                  key={`battle-${zone.chasingDriverId}`}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  cx={chaser.x * WIDTH}
                  cy={chaser.y * HEIGHT}
                  r="12"
                  className="fill-red-600/10 stroke-red-600/30 stroke-[0.5] animate-pulse"
                />
              );
            })}
          </AnimatePresence>

          {/* DRIVERS */}
          {drivers.map((driver) => {
            const isSelected = driver.id === selectedDriverId;
            const isUnderAttack = battleZones.some(b => b.leadDriverId === driver.id);

            return (
              <motion.g
                key={driver.id}
                initial={false}
                // QUALIFYING FIX: Linear tween with 0.1s duration matches 10Hz backend perfectly
                animate={{ 
                    x: (Number(driver.x) || 0) * WIDTH, 
                    y: (Number(driver.y) || 0) * HEIGHT 
                }}
                transition={{ type: 'tween', ease: 'linear', duration: 0.1 }}
                onClick={() => onSelectDriver(driver.id)}
                className="cursor-pointer group"
              >
                {/* Ping effect for battles */}
                {isUnderAttack && (
                  <circle r="8" fill="none" stroke="#ef4444" strokeWidth="1" className="animate-ping opacity-40" />
                )}

                {isSelected && (
                  <motion.circle layoutId="aura" r="10" fill={driver.teamColor} initial={{ opacity: 0 }} animate={{ opacity: 0.15 }} className="blur-sm" />
                )}
                
                <circle 
                  r={isSelected ? 5 : 3.5} 
                  fill={driver.teamColor} 
                  className="stroke-black/60 stroke-1 shadow-xl transition-all duration-300"
                />

                <text
                  y="-10"
                  fill="white"
                  className="font-mono font-black text-[8px] uppercase tracking-tighter pointer-events-none"
                  textAnchor="middle"
                  style={{ opacity: isSelected ? 1 : 0.4 }}
                >
                  {driver.id}
                </text>
              </motion.g>
            );
          })}
        </motion.svg>
      )}

      {/* FOOTER INFO */}
      <div className="absolute bottom-4 right-4 z-10 pointer-events-none opacity-20">
        <span className="font-mono text-[7px] uppercase tracking-[0.3em] text-white">
            Render: SVG_PATH_INTERPOLATED
        </span>
      </div>
    </div>
  );
}