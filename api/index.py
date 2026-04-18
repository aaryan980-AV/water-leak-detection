"""
AquaSense AI — Vercel Serverless Entry Point (Mumbai Version)
"""

from __future__ import annotations
import math
import random
import uuid
import os
import csv
from datetime import datetime, timezone
from typing import Any, List, Optional
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import joblib
import numpy as np

# Try to import TensorFlow for CNN support
try:
    import tensorflow as tf
    HAS_TF = True
except ImportError:
    HAS_TF = False

# ---------------- GEO HELPERS ----------------
def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
    return 2*r*math.asin(math.sqrt(a))

# ---------------- MUMBAI CONFIG ----------------
BASE_LAT, BASE_LON = 19.0760, 72.8777

SENSORS = [
    {"id":"sens101","name":"Dadar Acoustic Node","lat":BASE_LAT+0.014,"lon":BASE_LON+0.007,"status":"online","last_update":"2026-04-12T10:22:01Z"},
    {"id":"sens102","name":"Andheri East Junction","lat":BASE_LAT+0.011,"lon":BASE_LON-0.005,"status":"online","last_update":"2026-04-12T10:21:58Z"},
    {"id":"sens103","name":"Bandra Railway Feeder","lat":BASE_LAT-0.007,"lon":BASE_LON+0.011,"status":"degraded","last_update":"2026-04-12T10:15:40Z"},
    {"id":"sens104","name":"Ghatkopar East Line","lat":BASE_LAT-0.013,"lon":BASE_LON-0.003,"status":"online","last_update":"2026-04-12T10:22:00Z"},
    {"id":"sens105","name":"Powai Sector Grid","lat":BASE_LAT+0.005,"lon":BASE_LON+0.014,"status":"online","last_update":"2026-04-12T10:21:55Z"},
    {"id":"sens106","name":"Kurla West Pipeline","lat":BASE_LAT+0.003,"lon":BASE_LON-0.011,"status":"online","last_update":"2026-04-12T10:21:52Z"},
    {"id":"sens107","name":"Sion Junction Node","lat":BASE_LAT-0.005,"lon":BASE_LON+0.006,"status":"online","last_update":"2026-04-12T10:21:50Z"},
    {"id":"sens108","name":"Colaba Grid Station","lat":BASE_LAT+0.017,"lon":BASE_LON+0.002,"status":"online","last_update":"2026-04-12T10:21:48Z"},
]

WATER_SOURCES = [
    {"id":"wtr-01","name":"Tansa Lake Reservoir Intake","type":"reservoir","lat":BASE_LAT+0.006,"lon":BASE_LON+0.004},
    {"id":"wtr-02","name":"Vaitarna Water Supply Tap","type":"canal_tap","lat":BASE_LAT-0.004,"lon":BASE_LON+0.016},
]

TEAMS = [
    {"id":"team-01","name":"Mumbai Rapid Response (North)","lat":BASE_LAT+0.016,"lon":BASE_LON+0.005,"availability":"available"},
    {"id":"team-02","name":"BMC Jal Squad — Ghatkopar","lat":BASE_LAT-0.012,"lon":BASE_LON+0.002,"availability":"available"},
    {"id":"team-03","name":"Hydrotech Field Alpha — Bandra","lat":BASE_LAT+0.007,"lon":BASE_LON-0.009,"availability":"busy"},
]

# ---------------- APP INIT ----------------
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- MODELS ----------------
# Vercel path logic: backend is one level up from api/
MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "backend", "models")
rf_model = None
scaler = None
cnn_model = None

def load_models():
    global rf_model, scaler, cnn_model
    try:
        scaler_path = os.path.join(MODELS_DIR, "scaler.joblib")
        rf_path = os.path.join(MODELS_DIR, "ml_model.joblib")
        cnn_path = os.path.join(MODELS_DIR, "cnn_model.keras")
        
        if os.path.exists(scaler_path):
            scaler = joblib.load(scaler_path)
        if os.path.exists(rf_path):
            rf_model = joblib.load(rf_path)
        if HAS_TF and os.path.exists(cnn_path):
            cnn_model = tf.keras.models.load_model(cnn_path)
    except Exception as e:
        print(f"Error loading models: {e}")

@app.on_event("startup")
async def startup_event():
    load_models()

# ---------------- STATE (Ephemeral for Serverless) ----------------
# Note: On Vercel, this state resets frequently. Production apps should use Redis/DB.
state = {
    "overall": "No Leak",
    "active_leak_gps": None,
    "assigned_team": None,
    "events": [
        {"time": datetime.now(timezone.utc).isoformat(), "sensor_id": "sens101", "endpoint": "System Initialized", "prediction": "Normal", "confidence": 0.99}
    ],
    "history": [
        {"id": "LK-901", "date": "2026-04-10", "location": "Dadar West", "severity": "Medium", "resolved": True},
    ]
}

# ---------------- MODELS (PYDANTIC) ----------------
class PredictBody(BaseModel):
    pressure: float
    flow_rate: float
    temperature: float
    vibration: float
    rpm: float
    operational_hours: float
    use_cnn: bool = False

class AssignBody(BaseModel):
    leak_lat: float
    leak_lon: float

# ---------------- ENDPOINTS ----------------

@app.get("/")
def home():
    return {"message": "AquaSense AI API is active"}

@app.get("/status")
def get_status():
    return {
        "overall": state["overall"],
        "active_leak_gps": state["active_leak_gps"],
        "assigned_team": state["assigned_team"],
        "updated_at": datetime.now(timezone.utc).isoformat()
    }

@app.get("/locations")
def get_locations():
    return {"sensors": SENSORS, "water_sources": WATER_SOURCES, "teams": TEAMS}

@app.get("/history")
def get_history():
    return {"items": state["history"]}

@app.get("/alerts")
def get_alerts():
    alerts = []
    if state["overall"] == "Leak":
        alerts.append({"id":"al-1","severity":"critical","message":"Leak active","time":datetime.now().isoformat()})
    return {"items": alerts}

@app.get("/events")
def get_events():
    return {"items": state["events"]}

@app.get("/pipeline-stats")
def get_pipeline_stats():
    return {
        "ingest_hz": 1200,
        "cnn_inferences_per_sec": 45.2,
        "train_buffer_pct": 88.5,
        "model_version": "cnn-v3.2"
    }

@app.post("/simulate-leak")
def simulate_leak(lat: Optional[float] = None, lon: Optional[float] = None):
    if lat is None: lat = BASE_LAT + 0.01
    if lon is None: lon = BASE_LON + 0.01
    state["overall"] = "Leak"
    state["active_leak_gps"] = [lat, lon]
    return {"status": "Leak Simulated"}

@app.post("/clear-leak")
def clear_leak():
    state["overall"] = "No Leak"
    state["active_leak_gps"] = None
    return {"status": "Cleared"}

@app.post("/predict")
def predict_leak(body: PredictBody):
    global rf_model, scaler, cnn_model
    if scaler is None or (rf_model is None and cnn_model is None):
        is_leak = body.pressure > 80 or body.vibration > 4.0
        return {"is_leak": is_leak, "confidence": 0.88, "model": "fallback"}
    try:
        feat = np.array([[body.pressure, body.flow_rate, body.temperature, body.vibration, body.rpm, body.operational_hours]])
        feat_sc = scaler.transform(feat)
        if body.use_cnn and cnn_model:
            prob = float(cnn_model.predict(feat_sc.reshape(1, 6, 1), verbose=0)[0][0])
            model = "CNN"
        else:
            prob = float(rf_model.predict_proba(feat_sc)[0][1])
            model = "Random Forest"
        is_leak = prob > 0.5
        return {"is_leak": bool(is_leak), "confidence": round(prob if is_leak else 1-prob, 4), "model": model}
    except Exception as e:
        return {"error": str(e)}

@app.get("/dataset")
def get_dataset():
    data = []
    p = os.path.join(MODELS_DIR, "..", "data", "water_leak_detection_dataset.csv")
    if not os.path.exists(p): p = os.path.join(MODELS_DIR, "..", "data", "leak_dataset.csv")
    if not os.path.exists(p): return {"items": []}
    with open(p, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            if i > 50: break
            data.append(row)
    return {"items": data}

@app.get("/download-dataset")
def download_dataset():
    p = os.path.join(MODELS_DIR, "..", "data", "water_leak_detection_dataset.csv")
    if not os.path.exists(p): p = os.path.join(MODELS_DIR, "..", "data", "leak_dataset.csv")
    if not os.path.exists(p): return {"error": "Not found"}
    return FileResponse(p, media_type='text/csv', filename='leak_dataset.csv')
