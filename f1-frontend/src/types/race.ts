/**
 * F1 RACE COMMANDER - CORE TYPE DEFINITIONS
 * Synchronized with FastAPI Backend & Bayesian Strategy Engine
 */

export type TyreCompound = 'SOFT' | 'MEDIUM' | 'HARD' | 'INTERMEDIATE' | 'WET' | 'UNKNOWN' | string;

export type CarHealthStatus = 'good' | 'stressed' | 'critical';

export type SectorStatus = 'none' | 'green' | 'purple' | 'yellow';

export type WeatherCondition = 'clear' | 'cloudy' | 'light-rain' | 'heavy-rain' | string;

export interface SectorTime {
  sector: 1 | 2 | 3;
  time: number;       // Actual time in seconds
  status: SectorStatus;
}

export interface TelemetryPhysics {
  speed: number;      // KPH
  gear: number;       // 1-8, 0 for Neutral/Reverse
  rpm: number;        // Current engine RPM
  throttle: number;   // 0-100 percentage
  brake: number;      // 0-100 percentage
  drs: boolean;       // Active or Inactive
}

export interface StrategyData {
  tyreHealth: number;       // Bayesian Estimated Grip (0-100)
  tyreAge: number;          // Laps completed on this set
  compound: TyreCompound;   // Current compound string
  isPitStoppping: boolean;  // Calculated state
  expectedPaceDelta: number; // Seconds lost due to degradation
}

export interface Driver {
  // Static Identifiers
  id: string;               // Abbreviation (e.g., VER)
  code: string;             // Duplicate of ID for UI components
  number: number;           // Racing Number (e.g., 1)
  name: string;             // Full name
  team: string;             // Team name
  teamColor: string;        // Hex code (e.g., #3671C6)

  // Race Standings
  position: number;         // Current P1-P20
  gap: string;              // Gap to car ahead or leader
  interval: string;         // Time interval
  lap: number;              // Current lap of this driver

  // Map Positioning (Normalized 0.0 - 1.0)
  x: number;                
  y: number;                
  trackPosition: number;    // Progress around the current lap (0-1)

  // Real-time Data Objects
  physics: TelemetryPhysics;
  strategy: StrategyData;
  sectors: SectorTime[];
  
  // UI Meta
  isDead?: boolean;          // DNF/DNS state
}

export interface TrackPoint {
  x: number;                // Normalized 0.0 - 1.0
  y: number;                // Normalized 0.0 - 1.0
}

export interface WeatherInfo {
  condition: WeatherCondition;
  rain_state: 'DRY' | 'RAINING';
  trackTemp: number; 
  airTemp: number; 
  humidity: number; 
  windSpeed: number; 
  windDirection: number;    // Degrees
}

export interface RaceSession {
  id: string;               // Unique session ID
  name: string;             // Grand Prix Name
  year: number;
  round: number;
  type: 'practice' | 'qualifying' | 'race' | 'sprint' | string;
  status: 'green' | 'yellow' | 'red' | 'safety-car' | 'vsc';
  currentLap: number;
  totalLaps: number;
  timeLeft?: string;        // Used for Practice/Quali
}

export interface BattleZone {
  leadDriverId: string;
  chasingDriverId: string;
  gapSeconds: number;
  intensity: 'low' | 'medium' | 'high'; // Calculated based on gap < 1.0s
}

/**
 * WebSocket Master Payload
 * The snapshot sent from FastAPI every 100ms
 */
export interface RaceSnapshot {
  type: 'RACE_SNAPSHOT';
  timestamp: number;
  session: RaceSession;
  weather: WeatherInfo;
  drivers: Driver[];
  battleZones: BattleZone[];
}