import numpy as np
import pandas as pd
from multiprocessing import Pool, cpu_count
import fastf1

def _process_single_driver(args):
    """Worker function for Multiprocessing"""
    driver_no, session, total_distance = args
    try:
        laps = session.laps.pick_drivers(driver_no)
        if laps.empty: return None
        
        # Resample to a fixed 10Hz (100ms) for perfect synchronization
        t = laps.pick_fastest().get_telemetry()
        t = t.set_index('Time').resample('100ms').first().interpolate(method='linear').reset_index(drop=True)
        
        # Calculate distance if missing
        if 'Distance' not in t.columns:
            t['Distance'] = (t['Speed'] / 3.6 * 0.1).cumsum().fillna(0)
            
        return {
            "driver_no": driver_no,
            "telemetry": t,
            "max_lap": laps.LapNumber.max()
        }
    except Exception:
        return None

def load_synchronized_telemetry(session):
    """Loads all 20 drivers in parallel"""
    drivers = session.drivers
    fastest_lap = session.laps.pick_fastest()
    total_distance = fastest_lap.get_telemetry()['Distance'].max()
    
    # Prepare arguments for the CPU pool
    args = [(d, session, total_distance) for d in drivers]
    
    # Use Multiprocessing Pool
    with Pool(processes=min(cpu_count(), len(drivers))) as pool:
        results = pool.map(_process_single_driver, args)
    
    # Filter out None results and return as a dict
    return {r['driver_no']: r for r in results if r is not None}