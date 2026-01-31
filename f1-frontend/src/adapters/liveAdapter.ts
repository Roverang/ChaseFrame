import { Driver, RaceSession, WeatherInfo, BattleZone } from '@/types/race';
import type { 
  RaceDataAdapter, 
  SessionInfo, 
  ConnectionStatus, 
  RaceDataCallback, 
  StatusCallback, 
  AdapterConfig, 
  TrackData, 
} from './types';

import { 
  RaceSnapshot,  
} from '@/types/race';

export class LiveRaceDataAdapter implements RaceDataAdapter {
  private _status: ConnectionStatus = 'disconnected';
  private dataCallbacks = new Set<RaceDataCallback>();
  private statusCallbacks = new Set<StatusCallback>();
  private ws: WebSocket | null = null;
  private currentSessionId: string | null = null;
  private config: Required<AdapterConfig>;
  private currentSnapshot: RaceSnapshot | null = null;

  constructor(config: AdapterConfig = {}) {
    this.config = {
      apiUrl: config.apiUrl ?? 'http://localhost:8000/api',
      wsUrl: config.wsUrl ?? 'ws://localhost:8000/ws/race',
      pollInterval: config.pollInterval ?? 1000,
      autoReconnect: config.autoReconnect ?? true,
    };
  }

  get status(): ConnectionStatus {
    return this._status;
  }

  async getSessions(): Promise<SessionInfo[]> {
    const response = await fetch(`${this.config.apiUrl}/sessions`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  async getTrackData(year: number, round: number): Promise<TrackData> {
    try {
      const response = await fetch(`${this.config.apiUrl}/tracks/${year}/${round}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    } catch (e) {
      console.error("Failed to fetch track data", e);
      return { points: [], sectorIndices: [], sectors: [], drsZones: [] };
    }
  }

  async getRaceSnapshot(sessionId: string): Promise<RaceSnapshot> {
    const response = await fetch(`${this.config.apiUrl}/sessions/${sessionId}/snapshot`);
    
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
    }

    const data = await response.json();
    
    if (!data.drivers || !Array.isArray(data.drivers)) {
        data.drivers = [];
    }

    return data;
  }

  async connect(sessionId: string): Promise<void> {
    if (this._status === 'connected') this.disconnect();
    this.currentSessionId = sessionId;
    this.setStatus('connecting');

    try {
      this.currentSnapshot = await this.getRaceSnapshot(sessionId);
      this.emitData(this.currentSnapshot);
      await this.connectWebSocket(sessionId);
    } catch (e) {
      console.error('[LiveAdapter] Connection failed', e);
      this.setStatus('error', 'Connection Failed');
      
      if (this.config.autoReconnect) {
          setTimeout(() => this.connect(sessionId), 3000);
      }
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.currentSessionId = null;
    this.setStatus('disconnected');
  }

  onData(callback: RaceDataCallback): () => void {
    this.dataCallbacks.add(callback);
    return () => this.dataCallbacks.delete(callback);
  }

  onStatus(callback: StatusCallback): () => void {
    this.statusCallbacks.add(callback);
    callback(this._status);
    return () => this.statusCallbacks.delete(callback);
  }

  async requestDriverTelemetry(driverId: string): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'subscribe', driverId }));
    }
  }

  dispose(): void {
    this.disconnect();
    this.dataCallbacks.clear();
    this.statusCallbacks.clear();
  }

  private setStatus(status: ConnectionStatus, error?: string): void {
    this._status = status;
    this.statusCallbacks.forEach(cb => cb(status, error));
  }

  private emitData(snapshot: RaceSnapshot) {
      this.dataCallbacks.forEach(cb => cb(snapshot));
  }

  private async connectWebSocket(sessionId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = `${this.config.wsUrl}/${sessionId}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.setStatus('connected');
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.type === 'RACE_SNAPSHOT' && this.currentSnapshot) {
            const liveDataArray = message.data; 
            
            liveDataArray.forEach((update: any) => {
              const driver = this.currentSnapshot!.drivers.find(d => d.id === update.id);
              
              if (driver) {
                // 1. Core positioning and lap
                driver.x = update.x;
                driver.y = update.y;
                driver.trackPosition = update.trackPosition;
                driver.lap = update.lap; // Matches 'lap' in race.ts
                driver.gap = update.gap || driver.gap;

                // 2. Map Nested Physics Object
                driver.physics = {
                  speed: update.physics.speed,
                  gear: update.physics.gear,
                  drs: update.physics.drs,
                  rpm: update.physics.rpm || 0,
                  throttle: update.physics.throttle || 0,
                  brake: update.physics.brake || 0
                };

                // 3. Map Nested Strategy Object
                driver.strategy = {
                  tyreHealth: update.tyreHealth,
                  tyreAge: update.tyreAge,
                  compound: update.compound,
                  isPitStoppping: update.isPitStoppping || false,
                  expectedPaceDelta: update.expectedPaceDelta || 0
                };

                // 4. Map Sectors
                driver.sectors = update.sectors || [];
              }
            });

            // Synchronize the Global Session Lap (Header display)
            if (liveDataArray.length > 0) {
              const leadLap = Math.max(...liveDataArray.map((d: any) => d.lap));
              if (this.currentSnapshot.session && leadLap > this.currentSnapshot.session.currentLap) {
                this.currentSnapshot.session.currentLap = leadLap;
              }
            }

            this.emitData({ ...this.currentSnapshot }); 
          } 
          else if (message.type === 'SNAPSHOT' || message.type === 'INITIAL_STATE') {
            this.currentSnapshot = message.data;
            if (this.currentSnapshot) this.emitData(this.currentSnapshot);
          }
        } catch (error) {
          console.error('[LiveAdapter] Sync Error:', error);
        }
      };

      this.ws.onerror = (event) => {
        console.error('[LiveAdapter] WS Error:', event);
      };

      this.ws.onclose = () => {
        if (this.config.autoReconnect && this.currentSessionId) {
          this.setStatus('connecting');
          setTimeout(() => {
             if (this.currentSessionId) this.connect(this.currentSessionId);
          }, 2000);
        } else {
          this.setStatus('disconnected');
        }
      };
    });
  }
}

export function createLiveAdapter(config?: AdapterConfig): RaceDataAdapter {
  return new LiveRaceDataAdapter(config);
}