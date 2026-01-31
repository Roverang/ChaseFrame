// Monza Circuit - Simplified SVG path for 2D visualization
// The path is designed for a viewBox of 0 0 800 600

export const monzaTrackPath = `
  M 650 350
  C 700 300, 720 250, 700 180
  C 680 120, 620 80, 550 70
  L 400 60
  C 350 55, 300 60, 250 80
  C 180 110, 140 160, 120 220
  L 100 300
  C 90 350, 100 400, 130 450
  C 170 510, 240 540, 320 550
  L 480 560
  C 550 555, 600 530, 640 480
  C 680 430, 680 380, 650 350
`;

// Track points for driver positioning (normalized 0-1 around the lap)
export const trackPositions: { position: number; x: number; y: number }[] = [
  { position: 0.00, x: 650, y: 350 },
  { position: 0.05, x: 690, y: 300 },
  { position: 0.10, x: 710, y: 230 },
  { position: 0.15, x: 690, y: 160 },
  { position: 0.20, x: 620, y: 100 },
  { position: 0.25, x: 550, y: 70 },
  { position: 0.30, x: 450, y: 62 },
  { position: 0.35, x: 350, y: 60 },
  { position: 0.40, x: 280, y: 75 },
  { position: 0.45, x: 200, y: 120 },
  { position: 0.50, x: 150, y: 180 },
  { position: 0.55, x: 115, y: 250 },
  { position: 0.60, x: 100, y: 320 },
  { position: 0.65, x: 105, y: 390 },
  { position: 0.70, x: 140, y: 460 },
  { position: 0.75, x: 210, y: 520 },
  { position: 0.80, x: 320, y: 550 },
  { position: 0.85, x: 430, y: 558 },
  { position: 0.90, x: 530, y: 545 },
  { position: 0.95, x: 610, y: 500 },
  { position: 1.00, x: 650, y: 350 },
];

// Interpolate position on track
export function getTrackCoordinates(trackPosition: number): { x: number; y: number } {
  const normalizedPos = trackPosition % 1;
  
  // Find the two points to interpolate between
  let prev = trackPositions[0];
  let next = trackPositions[1];
  
  for (let i = 0; i < trackPositions.length - 1; i++) {
    if (normalizedPos >= trackPositions[i].position && normalizedPos <= trackPositions[i + 1].position) {
      prev = trackPositions[i];
      next = trackPositions[i + 1];
      break;
    }
  }
  
  // Linear interpolation
  const t = (normalizedPos - prev.position) / (next.position - prev.position || 1);
  
  return {
    x: prev.x + (next.x - prev.x) * t,
    y: prev.y + (next.y - prev.y) * t,
  };
}

// DRS Zones (track positions where DRS is available)
export const drsZones = [
  { start: 0.70, end: 0.85 }, // Main straight
  { start: 0.20, end: 0.30 }, // Back straight
];

// Corner names
export const corners = [
  { position: 0.10, name: 'Variante del Rettifilo' },
  { position: 0.30, name: 'Curva Grande' },
  { position: 0.45, name: 'Variante della Roggia' },
  { position: 0.55, name: 'Lesmo 1' },
  { position: 0.60, name: 'Lesmo 2' },
  { position: 0.70, name: 'Ascari' },
  { position: 0.90, name: 'Parabolica' },
];
