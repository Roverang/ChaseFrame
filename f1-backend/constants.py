# --- TEAM COLOR MAPPINGS ---
# High-fidelity hex codes for the 2024/2025 grid
TEAM_COLORS = {
    'Red Bull Racing': '#3671C6',
    'Ferrari': '#E80020',
    'Mercedes': '#27F4D2',
    'McLaren': '#FF8000',
    'Aston Martin': '#229971',
    'Alpine': '#0093CC',
    'Williams': '#64C4FF',
    'RB': '#6692FF',
    'Sauber': '#52E252',
    'Haas F1 Team': '#B6BABD',
    'DEFAULT': '#FFFFFF'
}

# --- TYRE COMPOUND SETTINGS ---
# Maps FastF1 strings to UI labels and degradation baselines
# 'prior' is the expected seconds-per-lap loss used by the Bayesian model
TYRE_SETTINGS = {
    'SOFT': {
        'label': 'S',
        'color': '#FF3333',
        'prior': 0.05
    },
    'MEDIUM': {
        'label': 'M',
        'color': '#FFFF33',
        'prior': 0.03
    },
    'HARD': {
        'label': 'H',
        'color': '#FFFFFF',
        'prior': 0.01
    },
    'INTERMEDIATE': {
        'label': 'I',
        'color': '#33FF33',
        'prior': 0.04
    },
    'WET': {
        'label': 'W',
        'color': '#3333FF',
        'prior': 0.02
    }
}

# --- TRACK CONFIGURATION ---
# Normalized UI constants
UI_PADDING = 0.05  # 5% margin around the track map
WEBSOCKET_HZ = 10  # 10 updates per second