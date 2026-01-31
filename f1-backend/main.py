import asyncio
import json
import logging
import pandas as pd
import fastf1
import os
import time
from multiprocessing import Pool

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from transformer import TrackTransformer 
from strategy import StrategyEngine 
from constants import TEAM_COLORS 

# --- CONFIGURATION ---
PORT = int(os.environ.get("PORT", 8000))
CACHE_DIR = os.path.join(os.getcwd(), 'cache')
if not os.path.exists(CACHE_DIR):
    os.makedirs(CACHE_DIR)

fastf1.Cache.enable_cache(CACHE_DIR)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("f1-backend")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MULTIPROCESSING HELPER ---
def _process_driver_telemetry(args):
    drv_no, year, round_num, session_type = args
    try:
        session = fastf1.get_session(year, round_num, session_type)
        session.load(laps=True, telemetry=True, weather=False)
        laps = session.laps.pick_drivers(drv_no)
        if laps.empty: return None

        tel = laps.pick_fastest().get_telemetry()
        tel = tel.set_index('Time').resample('100ms').first()
        tel = tel.infer_objects(copy=False) 
        tel = tel.interpolate(method='linear').fillna(0).reset_index(drop=True)
        
        return {"drv": drv_no, "tel": tel}
    except Exception as e:
        logger.error(f"Worker Error: {e}")
        return None

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try: await connection.send_text(message)
            except Exception: pass

manager = ConnectionManager()

# --- QUALIFYING FIX: DYNAMIC SESSION INFO ---
def get_session_info(session_id: str):
    """Parses ID format: 2024-16-R"""
    try:
        parts = session_id.split('-')
        return int(parts[0]), int(parts[1]), parts[2]
    except:
        return 2024, 16, 'R'

# --- NEW: DYNAMIC HISTORY SELECTOR ---
@app.get("/api/sessions")
async def get_sessions():
    """Generates a list of all races for chosen years."""
    sessions = []
    # You can add 2023, 2022, etc., to this list to see more history
    for year in [2024, 2025]:
        try:
            schedule = fastf1.get_event_schedule(year)
            # Filter out testing events
            races = schedule[schedule['EventFormat'] != 'testing']
            
            for _, race in races.iterrows():
                sessions.append({
                    "id": f"{year}-{race['RoundNumber']}-R",
                    "year": year,
                    "round": int(race['RoundNumber']),
                    "name": f"{year} {race['EventName']}",
                    "type": "Race",
                    "date": str(race['EventDate']).split(' ')[0]
                })
        except Exception as e:
            logger.error(f"Error loading schedule for {year}: {e}")

    # Return newest races first
    return sorted(sessions, key=lambda x: x['date'], reverse=True)

@app.get("/api/sessions/{session_id}/snapshot")
def get_snapshot(session_id: str):
    year, round_num, s_type = get_session_info(session_id)
    try:
        session = fastf1.get_session(year, round_num, s_type)
        session.load(laps=True, telemetry=False, weather=True)
        drivers = []
        # Load real results from the selected session
        for _, driver in session.results.iloc[:15].iterrows():
            team_name = driver['TeamName']
            drivers.append({
                "id": driver['Abbreviation'],
                "code": driver['Abbreviation'],
                "number": int(driver['DriverNumber']),
                "name": f"{driver['FirstName']} {driver['LastName']}",
                "team": team_name,
                "teamColor": TEAM_COLORS.get(team_name, TEAM_COLORS['DEFAULT']),
                "position": int(driver['Position']),
                "lap": 1,
                "strategy": {"tyreHealth": 100, "tyreAge": 0, "compound": "MEDIUM"},
                "physics": {"speed": 0, "gear": 0, "drs": False},
                "sectors": []
            })
        return {
            "drivers": drivers, 
            "session": {"id": session_id, "name": session.event['EventName'], "year": year, "round": round_num, "currentLap": 1, "totalLaps": int(session.total_laps)},
            "timestamp": int(time.time() * 1000)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws/race/{session_id}")
async def race_socket(websocket: WebSocket, session_id: str):
    await manager.connect(websocket)
    year, round_num, s_type = get_session_info(session_id)
    try:
        logger.info(f"--> [WS] Initializing Session {session_id}")
        session = fastf1.get_session(year, round_num, s_type)
        session.load(laps=True, telemetry=True, weather=False)
        
        # Load top 5 drivers for the specific historical session
        driver_list = session.drivers[:5] 
        pool_args = [(d, year, round_num, s_type) for d in driver_list]
        with Pool(processes=2) as pool: 
            results = pool.map(_process_driver_telemetry, pool_args)

        driver_telemetry = {r["drv"]: r["tel"] for r in results if r}
        driver_static_info = {
            row['Abbreviation']: {
                "team": row['TeamName'],
                "teamColor": TEAM_COLORS.get(row['TeamName'], TEAM_COLORS['DEFAULT'])
            } for _, row in session.results.iterrows()
        }

        transformer = TrackTransformer(session.get_circuit_info())
        fastest_tel = session.laps.pick_fastest().get_telemetry()
        transformer.fit(fastest_tel['X'].values, fastest_tel['Y'].values)
        total_distance = fastest_tel['Distance'].max()
        strategy = StrategyEngine(session)

        driver_laps = {d: 1 for d in driver_telemetry}
        driver_sector_data = {d: [{"sector": i+1, "time": 0.0, "status": "none"} for i in range(3)] for d in driver_telemetry}
        
        frame_counter = 0
        while True:
            snapshot_drivers = []
            for drv, df in driver_telemetry.items():
                idx = frame_counter % len(df)
                drv_code = session.get_driver(drv)['Abbreviation']
                static = driver_static_info.get(drv_code, {"team": "Unknown", "teamColor": "#FFF"})
                row = df.iloc[idx]
                norm_x, norm_y = transformer.transform(row['X'], row['Y'])
                track_pos = (float(row['Distance']) % total_distance) / total_distance
                tyre_insight = strategy.get_driver_health(drv_code, driver_laps[drv])

                snapshot_drivers.append({
                    "id": drv_code, "teamColor": static["teamColor"], "team": static["team"],
                    "x": norm_x, "y": norm_y, "lap": driver_laps[drv], "trackPosition": track_pos,
                    "sectors": driver_sector_data[drv],
                    "strategy": {"tyreHealth": tyre_insight['health'], "tyreAge": tyre_insight['laps_on_tyre'], "compound": tyre_insight['compound']},
                    "physics": {"speed": int(row['Speed']), "gear": int(row.get('nGear', 1)), "drs": bool(row['DRS'] > 8)}
                })

            await manager.broadcast(json.dumps({"type": "RACE_SNAPSHOT", "timestamp": int(time.time() * 1000), "data": snapshot_drivers}))
            frame_counter += 1
            await asyncio.sleep(0.1)
    except Exception as e:
        logger.error(f"WS Error: {e}")
    finally:
        manager.disconnect(websocket)

@app.get("/api/tracks/{year}/{round}")
async def get_track(year: int, round: int):
    try:
        session = fastf1.get_session(year, round, 'R')
        session.load(laps=True, telemetry=True, weather=False)
        t = TrackTransformer(session.get_circuit_info())
        lap = session.laps.pick_fastest()
        pos = lap.get_pos_data()
        t.fit(pos['X'].values, pos['Y'].values)
        points = [{"x": t.transform(row['X'], row['Y'])[0], "y": t.transform(row['X'], row['Y'])[1]} for _, row in pos.iterrows()]
        return {"year": year, "round": round, "points": points}
    except:
        return {"points": []}