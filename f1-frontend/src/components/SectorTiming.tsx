import { SectorTime } from '@/types/race';
import { cn } from '@/lib/utils';

interface SectorTimingProps {
  sectors?: SectorTime[];
  // Use number to avoid strict 1|2|3 errors if the backend sends 0
  currentSector?: number; 
}

export function SectorTiming({ sectors = [], currentSector = 1 }: SectorTimingProps) {
  
  const formatSectorTime = (time: number) => {
    return time > 0 ? time.toFixed(3) : '-.---';
  };

  const getSectorStyles = (sector: SectorTime) => {
    const isActive = sector.sector === currentSector;
    const isPast = sector.sector < currentSector;
    
    // Default style for upcoming sectors
    if (!isPast && !isActive) {
      return 'bg-zinc-900 text-white/20 border border-white/5';
    }

    // MATCHING YOUR SectorStatus from race.ts: 'purple' | 'green' | 'yellow' | 'none'
    switch (sector.status) {
      case 'purple':
        return 'bg-purple-600/20 text-purple-400 border border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.2)]';
      case 'green':
        return 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/50';
      case 'yellow':
        return 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/50';
      default:
        return isPast 
          ? 'bg-zinc-800 text-white/60 border border-white/10' 
          : 'bg-zinc-900 text-white/20 border border-white/5';
    }
  };

  if (!sectors || !Array.isArray(sectors)) return null;

  return (
    <div className="flex items-center gap-1.5 font-mono">
      {sectors.map((sector) => (
        <div
          key={sector.sector}
          className={cn(
            'px-2 py-0.5 rounded-sm text-[10px] tracking-tighter transition-all duration-500 flex flex-col items-center min-w-[50px]',
            getSectorStyles(sector),
            sector.sector === currentSector && 'ring-1 ring-white/30 animate-pulse'
          )}
        >
          <span className="text-[8px] uppercase opacity-40 font-black">S{sector.sector}</span>
          <span className="font-bold">
            {sector.time > 0 ? formatSectorTime(sector.time) : 'IN PROG'}
          </span>
        </div>
      ))}
    </div>
  );
}