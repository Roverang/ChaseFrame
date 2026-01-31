import type { BattleZone, Driver } from '@/types/race';

export type DrsZone = { start: number; end: number };

function inWrappedRange(pos: number, start: number, end: number) {
  // Supports ranges that may wrap past 1.0 (e.g. 0.95 -> 0.05)
  if (start <= end) return pos >= start && pos <= end;
  return pos >= start || pos <= end;
}

export function isInDrsZone(trackPosition: number, zones: DrsZone[]) {
  const p = ((trackPosition % 1) + 1) % 1;
  return zones.some((z) => inWrappedRange(p, z.start, z.end));
}

export function computeDrsBattles(
  drivers: Driver[],
  zones: DrsZone[],
  options?: {
    /** Rough normalized distance on the lap (0..1). */
    maxDelta?: number;
  },
): BattleZone[] {
  const maxDelta = options?.maxDelta ?? 0.02;

  const active = drivers.filter((d) => d.gap !== 'DNF');
  const byPos = [...active].sort((a, b) => a.position - b.position);

  const battles: BattleZone[] = [];

  for (let i = 1; i < byPos.length; i++) {
    const chasing = byPos[i];
    const lead = byPos[i - 1];

    const delta = (lead.trackPosition - chasing.trackPosition + 1) % 1;
    if (delta > maxDelta) continue;
    if (!isInDrsZone(chasing.trackPosition, zones)) continue;

    const intensity: BattleZone['intensity'] =
      delta < 0.008 ? 'high' : delta < 0.014 ? 'medium' : 'low';

    battles.push({
      leadDriver: lead.id,
      chasingDriver: chasing.id,
      gap: delta,
      intensity,
    });
  }

  return battles;
}
