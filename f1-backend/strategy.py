import logging
from typing import TypedDict, Optional, Dict, Union
import pandas as pd
from constants import TYRE_SETTINGS
# Ensure this file exists as discussed
from bayesian_engine import BayesianTyreDegradationModel 

logger = logging.getLogger("f1-backend")

# --- TYPE DEFINITIONS ---
class StrategyUpdate(TypedDict):
    health: float
    compound: str
    laps_on_tyre: int
    status: str

class StrategyEngine:
    def __init__(self, session):
        self.session = session
        self.model = BayesianTyreDegradationModel()
        self.initialized = False
        self._fit_model()

    def _fit_model(self) -> None:
        """Pre-calculate race parameters using the Bayesian Model"""
        try:
            if self.session.laps.empty:
                logger.warning("StrategyEngine: No laps found to fit model.")
                return
            
            # Fit the model to the session history
            self.model.fit(self.session.laps)
            self.initialized = True
            logger.info(f"StrategyEngine: Bayesian Model fitted. Abrasion: {self.model.track_abrasion:.3f}")
        except Exception as e:
            logger.error(f"StrategyEngine: Fitting failed: {e}")

    def get_driver_health(self, driver_code: str, current_lap: int) -> StrategyUpdate:
        """
        Calculates real-time health. 
        Returns a dictionary compatible with the frontend's StrategyData interface.
        """
        # 1. Fallback if model isn't ready
        if not self.initialized:
            return self._default_health("UNKNOWN")
        
        try:
            # 2. Query the Bayesian Engine
            # predict_next_lap returns (expected_time, uncertainty, metadata_dict)
            _, _, info = self.model.predict_next_lap(
                driver_code, 
                current_lap, 
                self.session.laps
            )
            
            if info and 'health' in info:
                health_val = float(info['health'])
                return {
                    "health": round(health_val, 1),
                    "compound": str(info.get('compound', 'MEDIUM')),
                    "laps_on_tyre": int(info.get('laps_on_tyre', 0)),
                    "status": self._get_status_string(health_val)
                }
        except Exception as e:
            logger.debug(f"StrategyEngine: Prediction failed for {driver_code}: {e}")
        
        return self._default_health("MEDIUM")

    def _get_status_string(self, health: float) -> str:
        """Maps health percentage to UI status strings"""
        if health < 25: return "critical"
        if health < 60: return "stressed"
        return "good"

    def _default_health(self, compound: str) -> StrategyUpdate:
        return {
            "health": 100.0, 
            "compound": compound, 
            "laps_on_tyre": 0,
            "status": "good"
        }