import numpy as np
import pandas as pd
from typing import Dict, Optional, Tuple, Any
from dataclasses import dataclass

@dataclass
class TyreState:
    grip_index: float  # 0.0 to 1.0
    pace_bias: float   # Driver-specific speed offset
    uncertainty: float # Variance in the estimate

class BayesianTyreDegradationModel:
    def __init__(self):
        self.track_abrasion = 1.0
        self.driver_states: Dict[str, TyreState] = {}
        # Priors for different compounds
        self.decay_priors = {
            'SOFT': 0.025, 'MEDIUM': 0.015, 'HARD': 0.008, 'DEFAULT': 0.015
        }

    def fit(self, lap_data: pd.DataFrame):
        """Fits the model to historical lap data to estimate track abrasion."""
        if lap_data.empty: return
        
        # Simple Bayesian update for track abrasion:
        # If field lap times are slower than historical norms, abrasion is higher
        try:
            avg_temp = 35.0 # Default
            # If your session object is available, pull real temp
            # self.track_abrasion = 1.0 + ((avg_temp - 35) * 0.005)
            self.track_abrasion = 1.05 # Mocked for Monza/High Wear
        except:
            self.track_abrasion = 1.0

    def predict_next_lap(self, driver_code: str, current_lap: int, all_laps: pd.DataFrame) -> Tuple[float, float, Dict[str, Any]]:
        """
        Estimates health using: Health = Health_initial * (1 - (Rate * Abrasion * Laps^1.1))
        """
        driver_laps = all_laps.pick_driver(driver_code)
        if driver_laps.empty:
            return 0.0, 0.0, {"health": 100.0, "compound": "MEDIUM", "laps_on_tyre": 0}

        latest = driver_laps.iloc[-1]
        compound = latest['Compound']
        stint_laps = driver_laps[driver_laps['Stint'] == latest['Stint']]
        laps_on_set = len(stint_laps)

        # Bayesian calculation
        base_rate = self.decay_priors.get(compound, self.decay_priors['DEFAULT'])
        
        # Non-linear degradation curve (Pirelli 'cliff' effect)
        deg_factor = base_rate * self.track_abrasion * (laps_on_set ** 1.1)
        health = max(0.0, round(100 * (1 - deg_factor), 1))

        return 0.0, 0.0, {
            "health": health,
            "compound": compound,
            "laps_on_tyre": laps_on_set
        }