// src/adapters/index.ts
import { RaceDataAdapter, AdapterConfig } from './types';
// We import the class directly from api.ts
import { RealRaceDataAdapter } from './api'; 

// You can comment this out if you don't have a mockAdapter file yet
// import { createMockAdapter } from './mockAdapter'; 

// Re-export types so hooks can use them
export * from './types';

export type AdapterMode = 'mock' | 'live';

/**
 * Factory to create the requested adapter
 */
export function createAdapter(mode: AdapterMode, config?: AdapterConfig): RaceDataAdapter {
  if (mode === 'live') {
    // Instantiate the class we created in api.ts
    return new RealRaceDataAdapter();
  }
  
  // Fallback: If you don't have a mock adapter, just return the live one for now
  // return createMockAdapter();
  return new RealRaceDataAdapter();
}