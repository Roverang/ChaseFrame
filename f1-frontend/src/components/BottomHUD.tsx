import { Driver } from '@/types/race';
import { SectorTiming } from './SectorTiming';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BottomHUDProps {
  selectedDriver: Driver | null;
}

function ThrottleBar({ value }: { value: number }) {
  // Guard against NaN or undefined
  const safeValue = isNaN(value) ? 0 : value;
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Throttle</span>
      <div className="relative w-32 h-2.5 bg-zinc-800 rounded-full overflow-hidden border border-white/5">
        <motion.div 
          className="absolute inset-y-0 left-0 bg-emerald-500 shadow-[0_0_10px_#10b981]"
          initial={false}
          animate={{ width: `${safeValue}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
        />
      </div>
      <span className="text-xs font-mono text-emerald-500 font-bold">{safeValue}%</span>
    </div>
  );
}

function BrakeIndicator({ value }: { value: number }) {
  const isActive = value > 0;
  return (
    <div className="flex flex-col gap-1 items-center">
      <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Brake</span>
      <div 
        className={cn(
          "w-16 h-8 rounded flex flex-col items-center justify-center transition-all duration-75 border",
          isActive ? 'bg-red-600 border-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]' : 'bg-zinc-900 border-white/5 text-white/20'
        )}
      >
        <span className="text-[10px] font-black">{isActive ? 'ACTIVE' : 'OFF'}</span>
        {isActive && <span className="text-[8px] font-mono leading-none">{value}%</span>}
      </div>
    </div>
  );
}

function SpeedDisplay({ speed, gear }: { speed: number; gear: number }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-baseline gap-2 leading-none">
        <span className="font-mono text-6xl font-black italic tracking-tighter text-white tabular-nums">
          {speed || 0}
        </span>
        <span className="text-xs text-muted-foreground font-black uppercase italic tracking-widest">km/h</span>
      </div>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Gear</span>
        <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center border border-white/10">
            <span className="font-mono text-xl font-black text-white">
                {gear === 0 ? 'N' : gear}
            </span>
        </div>
      </div>
    </div>
  );
}

function DRSIndicator({ active }: { active: boolean }) {
  return (
    <div className="flex flex-col gap-1 items-center">
      <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">DRS</span>
      <div className={cn(
        "font-mono text-[10px] font-black tracking-widest px-2 py-0.5 rounded border transition-colors",
        active ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'bg-zinc-900 border-white/5 text-white/10'
      )}>
        {active ? 'AVAILABLE' : 'LOCKED'}
      </div>
    </div>
  );
}

export function BottomHUD({ selectedDriver }: BottomHUDProps) {
  if (!selectedDriver) {
    return (
      <div className="h-32 bg-zinc-950 border-t border-white/10 flex items-center justify-center">
        <p className="text-white/20 font-mono text-xs tracking-[0.4em] uppercase animate-pulse">
          Waiting for Pilot Selection...
        </p>
      </div>
    );
  }

  // --- QUALIFYING FIX: Fallback objects prevent "undefined" crashes ---
  const physics = selectedDriver.physics || { throttle: 0, brake: 0, speed: 0, gear: 0, drs: false };
  const strategy = selectedDriver.strategy || { tyreHealth: 100, compound: 'MEDIUM' };
  const sectors = selectedDriver.sectors || [];
  const compoundName = strategy.compound || 'MEDIUM';

  return (
    <div className="h-32 bg-zinc-950/90 backdrop-blur-xl border-t border-white/10 flex items-stretch z-50 overflow-hidden font-mono">
      
      {/* 1. Driver Identity */}
      <div className="w-64 flex items-center gap-4 px-8 border-r border-white/5">
        <div className="w-1.5 h-12 rounded-full" style={{ backgroundColor: selectedDriver.teamColor }} />
        <div className="flex flex-col">
            <span className="text-[9px] text-white/30 uppercase font-black tracking-widest">Live Telemetry</span>
            <span className="text-xl font-black text-white italic truncate uppercase">{selectedDriver.name}</span>
        </div>
      </div>

      {/* 2. Inputs */}
      <div className="flex-1 flex items-center justify-center gap-10 px-6 border-r border-white/5">
        <ThrottleBar value={physics.throttle} />
        <BrakeIndicator value={physics.brake} />
      </div>

      {/* 3. Performance */}
      <div className="flex-[1.5] flex items-center justify-center gap-12 px-6 border-r border-white/5">
        <SpeedDisplay speed={physics.speed} gear={physics.gear} />
        <DRSIndicator active={physics.drs} />
        
        <div className="flex flex-col gap-2 items-center text-white">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Sectors</span>
          <div className="flex gap-2">
            {sectors.map((s, i) => (
               <div key={i} className={cn(
                 "w-3 h-3 rounded-sm border",
                 s.status === 'purple' ? 'bg-purple-500 border-purple-400' :
                 s.status === 'green' ? 'bg-emerald-500 border-emerald-400' :
                 'bg-zinc-800 border-white/5'
               )} />
            ))}
          </div>
        </div>
      </div>

      {/* 4. Strategy (Tyres) */}
      <div className="flex-1 flex items-center justify-center gap-8 px-8">
        <div className="flex flex-col items-end">
            <span className="text-[10px] text-white/30 uppercase font-black tracking-widest mb-1 text-white">Grip Estimate</span>
            <div className="flex items-center gap-3">
                <div className="flex flex-col items-end leading-none text-white">
                    <span className="text-2xl font-black">{strategy.tyreHealth}%</span>
                    <span className="text-[10px] text-white/40 uppercase">Bayesian</span>
                </div>
                {/* SAFE CHARAT CALL */}
                <div className={cn(
                  "w-10 h-10 rounded-full border-4 flex items-center justify-center font-black text-sm text-white",
                  compoundName.includes('SOFT') ? 'border-red-600 text-red-600' : 
                  compoundName.includes('MEDIUM') ? 'border-yellow-400 text-yellow-400' : 'border-zinc-400 text-zinc-400'
                )}>
                    {compoundName.charAt(0)}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}