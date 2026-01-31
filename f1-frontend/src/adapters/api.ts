import { 
  RaceDataAdapter, 
  SessionInfo, 
  TrackData, 
  RaceSnapshot, 
  ConnectionStatus,
  RaceDataCallback,
  StatusCallback,
  Sector,         // Import Sector interface
  SectorStatus    // Import SectorStatus type
} from './types';

const API_BASE_URL = 'http://localhost:8000';
const WS_BASE_URL = 'ws://localhost:8000'; 

export class RealRaceDataAdapter implements RaceDataAdapter {
  private _status: ConnectionStatus = 'disconnected';
  private ws: WebSocket | null = null;
  private dataCallbacks: RaceDataCallback[] = [];
  private statusCallbacks: StatusCallback[] = [];
  
  private currentSnapshot: RaceSnapshot | null = null;

  get status(): ConnectionStatus {
    return this._status;
  }

  private setStatus(newStatus: ConnectionStatus, error?: string) {
    this._status = newStatus;
    this.statusCallbacks.forEach(cb => cb(newStatus, error));
  }

  // --- REST API METHODS ---

  async getSessions(): Promise<SessionInfo[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions`);
      if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
      return [];
    }
  }

  async getTrackData(year: number, round: number): Promise<TrackData> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tracks/${year}/${round}`);
      if (!response.ok) {
        throw new Error(`Track Data Error: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch track data:", error);
      return { 
        points: [], 
        sectorIndices: [], 
        sectors: [], 
        drsZones: [] 
      };
    }
  }

  async getRaceSnapshot(sessionId: string): Promise<RaceSnapshot> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/snapshot`);
      if (!response.ok) {
        throw new Error(`Snapshot Error: ${response.statusText}`);
      }
      const data = await response.json();
      this.currentSnapshot = data; 
      return data;
    } catch (error) {
      console.error("Failed to fetch session snapshot:", error);
      throw error;
    }
  }

  // --- WEBSOCKET CONNECTION METHODS ---

  async connect(sessionId: string): Promise<void> {
    if (this.ws) {
      this.disconnect();
    }

    this.setStatus('connecting');

    try {
      if (!this.currentSnapshot) {
        await this.getRaceSnapshot(sessionId);
      }

      this.ws = new WebSocket(`${WS_BASE_URL}/ws/race/${sessionId}`);

      this.ws.onopen = () => {
        this.setStatus('connected');
        console.log(`Connected to Race Session: ${sessionId}`);
      };

      this.ws.onclose = () => {
        this.setStatus('disconnected');
        this.ws = null;
      };

      this.ws.onerror = (err) => {
        console.error("WebSocket Error:", err);
        this.setStatus('error', "Connection failed");
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

    } catch (error) {
      this.setStatus('error', String(error));
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setStatus('disconnected');
  }

  // --- EVENT HANDLING ---

  private handleMessage(payload: string) {
    if (!this.currentSnapshot) return;

    try {
      const message = JSON.parse(payload);

      if (message.type === 'TELEMETRY_UPDATE') {
        const update = message.data; 
        
        // 1. UPDATE SESSION LAP
        if (update.sessionLap && update.sessionLap > this.currentSnapshot.session.currentLap) {
          this.currentSnapshot.session.currentLap = update.sessionLap;
        }

        // 2. UPDATE DRIVER DETAILS
        const driverIndex = this.currentSnapshot.drivers.findIndex(d => d.code === update.driver);
        
        if (driverIndex !== -1) {
          const driver = this.currentSnapshot.drivers[driverIndex];
          
          // --- TYPE SAFE SECTOR UPDATE (No 'any' needed now) ---
          const updatedSectors: Sector[] = driver.sectors.map((sector, index) => {
            let newStatus: SectorStatus = sector.status; 
            
            // Logic: 
            // - If in Sector 2 (index 1), Sector 1 (index 0) is Green
            // - If in Sector 3 (index 2), Sector 2 (index 1) is Green
            if (update.sector > 1 && index === 0) newStatus = 'green';
            if (update.sector > 2 && index === 1) newStatus = 'green';
            
            // Reset ALL sectors to 'none' when starting Lap 1 (Sector 1)
            if (update.sector === 1) newStatus = 'none';

            return {
              ...sector,
              status: newStatus
            };
          });

          // Merge physics data
          this.currentSnapshot.drivers[driverIndex] = {
            ...driver,
            trackPosition: update.trackPosition,
            speed: update.physics.speed,
            rpm: update.physics.rpm,
            gear: update.physics.gear,
            throttle: update.physics.throttle,
            brake: update.physics.brake,
            drs: update.physics.drs,
            sectors: updatedSectors, 
          };
          
          this.currentSnapshot.timestamp = Date.now();
          this.notifyDataListeners();
        }
      }
    } catch (e) {
      console.error("Error parsing WS message", e);
    }
  }

  private notifyDataListeners() {
    if (this.currentSnapshot) {
      this.dataCallbacks.forEach(cb => cb(this.currentSnapshot!));
    }
  }

  onData(callback: RaceDataCallback): () => void {
    this.dataCallbacks.push(callback);
    return () => {
      this.dataCallbacks = this.dataCallbacks.filter(cb => cb !== callback);
    };
  }

  onStatus(callback: StatusCallback): () => void {
    this.statusCallbacks.push(callback);
    return () => {
      this.statusCallbacks = this.statusCallbacks.filter(cb => cb !== callback);
    };
  }

  async requestDriverTelemetry(driverId: string): Promise<void> {
    return Promise.resolve();
  }

  dispose(): void {
    this.disconnect();
    this.dataCallbacks = [];
    this.statusCallbacks = [];
    this.currentSnapshot = null;
  }
}