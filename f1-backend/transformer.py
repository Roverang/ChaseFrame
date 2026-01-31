import numpy as np
from typing import Tuple
from constants import UI_PADDING

class TrackTransformer:
    def __init__(self, circuit_info):
        # Convert FastF1 degrees to Radians
        self.angle = np.radians(circuit_info.rotation)
        
        # 2D Rotation Matrix
        self.rotation_matrix = np.array([
            [np.cos(self.angle), -np.sin(self.angle)],
            [np.sin(self.angle),  np.cos(self.angle)]
        ])
        
        self.min_x, self.max_x = 0.0, 1.0
        self.min_y, self.max_y = 0.0, 1.0
        self.padding = UI_PADDING # Pull from your constants file

    def fit(self, x_coords: np.ndarray, y_coords: np.ndarray):
        """Pre-calculates the bounding box after track rotation."""
        points = np.vstack([x_coords, y_coords])
        rotated_points = self.rotation_matrix @ points
        
        rotated_x = rotated_points[0, :]
        rotated_y = rotated_points[1, :]
        
        self.min_x, self.max_x = rotated_x.min(), rotated_x.max()
        self.min_y, self.max_y = rotated_y.min(), rotated_y.max()
        
        # Prevent DivisionByZero for static/corrupt data
        if self.min_x == self.max_x: self.max_x += 1
        if self.min_y == self.max_y: self.max_y += 1
        
        return self

    def transform(self, x: float, y: float) -> Tuple[float, float]:
        """Rotates and normalizes a point to 0.0-1.0 with SVG-inverted Y axis."""
        point = np.array([x, y])
        rotated = self.rotation_matrix @ point
        
        # Normalize with inversion for Web (SVG Y-axis is Top-Down)
        norm_x = (rotated[0] - self.min_x) / (self.max_x - self.min_x)
        norm_y = 1.0 - ((rotated[1] - self.min_y) / (self.max_y - self.min_y))
        
        # Scale into the padded UI safe-zone
        final_x = self.padding + norm_x * (1 - 2 * self.padding)
        final_y = self.padding + norm_y * (1 - 2 * self.padding)
        
        return float(final_x), float(final_y)