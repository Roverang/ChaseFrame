# ChaseFrame 🏎️

**ChaseFrame** is a high-performance, real-time Formula 1 telemetry and strategy dashboard designed for deep-dive race analysis. It provides broadcast-quality driver tracking and predictive technical insights directly from the official F1 data feeds.

## 🚀 Key Features

- **Dynamic Chase Mode:** Ultra-smooth, SVG-interpolated camera tracking that follows selected drivers across the circuit layout.
- **Full Historical Access:** Dynamic session selection allowing you to load any Grand Prix from the 2018–2025+ seasons.
- **Live Telemetry Dashboard:** Real-time visualization of Speed, RPM, Throttle, Brake pressure, Gear selection, and DRS status.
- **Bayesian Strategy Engine:** Predictive probabilistic models that estimate tire health, grip levels, and pit window opportunities.
- **High-Frequency Data:** Backend resampling and linear interpolation at 10Hz (100ms intervals) for fluid visual performance.

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite, Framer Motion (Animations), Tailwind CSS, shadcn/ui.
- **Backend:** FastAPI (Python), FastF1 Data Library.
- **Data Processing:** Pandas & NumPy for high-speed telemetry resampling.
- **Communication:** Real-time bi-directional WebSockets.

## 📦 Installation & Local Setup

### 1. Backend Setup (Python)
```bash
cd f1-backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000



### 2. Frontend Setup (React)
cd f1-frontend
npm install
npm run dev