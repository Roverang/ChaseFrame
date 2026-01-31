// src/adapters/types.ts
import { 
  Driver, 
  RaceSnapshot, 
  WeatherInfo, 
  TrackPoint, 
  RaceSession 
} from '@/types/race';

// --- 1. CONFIGURATION ---
export interface AdapterConfig {
  apiUrl?: string;
  wsUrl?: string;
  pollInterval?: number;
  autoReconnect?: boolean;
}

// --- 2. ADAPTER SPECIFIC TYPES ---
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

// We map RaceSession to SessionInfo for the selection menu
export interface SessionInfo {
  id: string;
  year: number;
  round: number;
  name: string;
  type: string;
  date: string;
  currentLap: number;
  totalLaps: number;
  status: string;
}

export interface TrackData {
  points: TrackPoint[];
  sectorIndices: number[];
  sectors: number[];
  drsZones: { start: number; end: number }[];
}

// --- 3. CALLBACK SIGNATURES (Using types from race.ts) ---
export type RaceDataCallback = (snapshot: RaceSnapshot) => void;
export type StatusCallback = (status: ConnectionStatus, error?: string) => void;

// --- 4. THE INTERFACE ---
export interface RaceDataAdapter {
  readonly status: ConnectionStatus;
  getSessions(): Promise<SessionInfo[]>;
  getTrackData(year: number, round: number): Promise<TrackData>;
  getRaceSnapshot(sessionId: string): Promise<RaceSnapshot>;
  connect(sessionId: string): Promise<void>;
  disconnect(): void;
  onData(callback: RaceDataCallback): () => void;
  onStatus(callback: StatusCallback): () => void;
  requestDriverTelemetry?(driverId: string): Promise<void>;
  dispose(): void;
}