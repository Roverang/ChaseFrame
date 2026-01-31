import { useState, useEffect, useCallback, useRef } from 'react';
import type { 
  RaceDataAdapter,
  SessionInfo, 
  ConnectionStatus,
  AdapterConfig
} from '@/adapters/types';
import type { 
  RaceSnapshot
} from '@/types/race';



import { createLiveAdapter } from '@/adapters/liveAdapter';
import { createMockAdapter } from '@/adapters/mockAdapter';

interface UseRaceDataOptions {
  mode?: 'mock' | 'live';
  autoConnect?: boolean;
  initialSessionId?: string;
}

export interface UseRaceDataReturn {
  adapter: RaceDataAdapter | null;
  snapshot: RaceSnapshot | null;
  status: ConnectionStatus;
  error: string | null;
  sessions: SessionInfo[];
  loadingSessions: boolean;
  connect: (sessionId: string) => Promise<void>;
  disconnect: () => void;
  refreshSessions: () => Promise<void>;
}

export function useRaceData(options: UseRaceDataOptions = {}): UseRaceDataReturn {
  const { mode = 'live', autoConnect = false, initialSessionId } = options;

  const [adapter, setAdapter] = useState<RaceDataAdapter | null>(null);
  const [snapshot, setSnapshot] = useState<RaceSnapshot | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Initialize Adapter based on mode
  useEffect(() => {
    const config: AdapterConfig = {
        apiUrl: 'http://localhost:8000/api',
        wsUrl: 'ws://localhost:8000/ws/race'
    };
    
    const newAdapter = mode === 'live' 
        ? createLiveAdapter(config) 
        : createMockAdapter(config);

    setAdapter(newAdapter);

    // --- SNAPSHOT HANDLER ---
    // This updates the entire state (Drivers + Strategy + Physics) in one go
    const unsubData = newAdapter.onData((newSnapshot: RaceSnapshot) => {
      setSnapshot(newSnapshot);
    });

    const unsubStatus = newAdapter.onStatus((s, e) => {
      setStatus(s);
      setError(e || null);
    });

    // Auto-connect if initialSessionId is provided
    if (autoConnect && initialSessionId) {
      newAdapter.connect(initialSessionId);
    }

    return () => {
      unsubData();
      unsubStatus();
      newAdapter.disconnect();
      newAdapter.dispose();
    };
  }, [mode, initialSessionId, autoConnect]);

  // Fetch Session List (Year/Round chooser)
  const refreshSessions = useCallback(async () => {
    if (!adapter) return;
    setLoadingSessions(true);
    try {
      const s = await adapter.getSessions();
      setSessions(s);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingSessions(false);
    }
  }, [adapter]);

  useEffect(() => {
    if (adapter) refreshSessions();
  }, [refreshSessions, adapter]);

  const connect = useCallback(async (sid: string) => {
    if (adapter) {
      setSnapshot(null); // Clear old data before new connection
      await adapter.connect(sid);
    }
  }, [adapter]);

  const disconnect = useCallback(() => {
    if (adapter) adapter.disconnect();
  }, [adapter]);

  return {
    adapter,
    snapshot,
    status,
    error,
    sessions,
    loadingSessions,
    connect,
    disconnect,
    refreshSessions,
  };
}