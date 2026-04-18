"""
AI Underground Water Leak Detection — FastAPI backend (Mumbai Version)
"""

from __future__ import annotations
import math
import random
import uuid
import os
import csv
import json
from datetime import datetime, timezone, timedelta
from typing import Any, List, Optional

from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from sqlalchemy.orm import Session
import joblib
import numpy as np

# Database and Auth imports
from database import engine, get_db
import models
import schemas
import auth

# Initialize database
models.Base.metadata.create_all(bind=engine)

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
BASE_LAT, BASE_LON = 19.0760, 72.8777   # Mumbai Central

SENSORS = [
    {"id":"sens101","name":"Dadar Acoustic Node","lat":BASE_LAT+0.014,"lon":BASE_LON+0.007,"status":"online","last_update":"2026-04-12T10:22:01Z"},
    {"id":"sens102","name":"Andheri East Junction","lat":BASE_LAT+0.011,"lon":BASE_LON-0.005,"status":"online","last_update":"2026-04-12T10:21:58Z"},
    {"id":"sens103","name":"Bandra Railway Feeder","lat":BASE_LAT-0.007,"lon":BASE_LON+0.011,"status":"degraded","last_update":"2026-04-12T10:15:40Z"},
    {"id":"sens104","name":"Ghatkopar East Line","lat":BASE_LAT-0.013,"lon":BASE_LON-0.003,"status":"online","last_update":"2026-04-12T10:22:00Z"},
    {"id":"sens105","name":"Powai Sector Grid","lat":BASE_LAT+0.005,"lon":BASE_LON+0.014,"status":"online","last_update":"2026-04-12T10:21:55Z"},
    {"id":"sens106","name":"Kurla West Pipeline","lat":BASE_LAT+0.003,"lon":BASE_LON-0.011,"status":"online","last_update":"2026-04-12T10:21:52Z"},
    {"id":"sens107","name":"Sion Junction Node","lat":BASE_LAT-0.005,"lon":BASE_LON+0.006,"status":"online","last_update":"2026-04-12T10:21:50Z"},
    {"id":"sens108","name":"Colaba Grid Station","lat":BASE_LAT+0.017,"lon":BASE_LON+0.002,"status":"online","last_update":"2026-04-12T10:21:48Z"},
    {"id":"sens109","name":"Byculla Control Point","lat":BASE_LAT-0.018,"lon":BASE_LON+0.008,"status":"degraded","last_update":"2026-04-12T10:12:00Z"},
    {"id":"sens110","name":"Malad Loop System","lat":BASE_LAT+0.004,"lon":BASE_LON+0.018,"status":"online","last_update":"2026-04-12T10:21:45Z"},
    {"id":"sens111","name":"Lower Parel Trunk Line","lat":BASE_LAT-0.011,"lon":BASE_LON-0.012,"status":"online","last_update":"2026-04-12T10:21:42Z"},
    {"id":"sens112","name":"Jogeshwari Pipeline","lat":BASE_LAT+0.008,"lon":BASE_LON-0.016,"status":"online","last_update":"2026-04-12T10:21:40Z"},
    {"id":"sens113","name":"Western Express Node","lat":BASE_LAT+0.019,"lon":BASE_LON-0.008,"status":"online","last_update":"2026-04-12T10:21:38Z"},
    {"id":"sens114","name":"Chembur Field Sensor","lat":BASE_LAT-0.016,"lon":BASE_LON+0.014,"status":"online","last_update":"2026-04-12T10:21:35Z"},
]

WATER_SOURCES = [
    {"id":"wtr-01","name":"Tansa Lake Reservoir Intake","type":"reservoir","lat":BASE_LAT+0.006,"lon":BASE_LON+0.004},
    {"id":"wtr-02","name":"Vaitarna Water Supply Tap","type":"canal_tap","lat":BASE_LAT-0.004,"lon":BASE_LON+0.016},
    {"id":"wtr-03","name":"BMC Pump Station — Andheri","type":"pump_station","lat":BASE_LAT+0.012,"lon":BASE_LON-0.012},
]

TEAMS = [
    {"id":"team-01","name":"Mumbai Rapid Response (North)","lat":BASE_LAT+0.016,"lon":BASE_LON+0.005,"availability":"available"},
    {"id":"team-02","name":"BMC Jal Squad — Ghatkopar","lat":BASE_LAT-0.012,"lon":BASE_LON+0.002,"availability":"available"},
    {"id":"team-03","name":"Hydrotech Field Alpha — Bandra","lat":BASE_LAT+0.007,"lon":BASE_LON-0.009,"availability":"busy"},
    {"id":"team-04","name":"Western Line Maintenance Crew","lat":BASE_LAT-0.006,"lon":BASE_LON-0.010,"availability":"available"},
    {"id":"team-05","name":"Mumbai Smart Water OSS","lat":BASE_LAT+0.002,"lon":BASE_LON+0.012,"availability":"available"},
    {"id":"team-06","name":"Express Highway Emergency Unit","lat":BASE_LAT+0.018,"lon":BASE_LON-0.004,"availability":"available"},
    {"id":"team-07","name":"Chembur Field Crew","lat":BASE_LAT-0.014,"lon":BASE_LON+0.011,"availability":"busy"},
]

# ---------------- APP INIT ----------------
app = FastAPI(title="AquaSense AI Backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# ---------------- MODELS ----------------
MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
rf_model = None
scaler = None
cnn_model = None
acoustic_cnn_model = None

def load_models():
    global rf_model, scaler, cnn_model, acoustic_cnn_model
    try:
        os.makedirs(MODELS_DIR, exist_ok=True)
        scaler_path = os.path.join(MODELS_DIR, "scaler.joblib")
        rf_path = os.path.join(MODELS_DIR, "ml_model.joblib")
        cnn_path = os.path.join(MODELS_DIR, "cnn_model.keras")
        acoustic_cnn_path = os.path.join(MODELS_DIR, "acoustic_cnn_model.keras")
        
        if os.path.exists(scaler_path):
            scaler = joblib.load(scaler_path)
            print(f"Loaded scaler from {scaler_path}")
        if os.path.exists(rf_path):
            rf_model = joblib.load(rf_path)
            print(f"Loaded RF model from {rf_path}")
        if HAS_TF and os.path.exists(cnn_path):
            cnn_model = tf.keras.models.load_model(cnn_path)
            print(f"Loaded 1D-CNN model from {cnn_path}")
        if HAS_TF and os.path.exists(acoustic_cnn_path):
            acoustic_cnn_model = tf.keras.models.load_model(acoustic_cnn_path)
            print(f"Loaded Acoustic 2D-CNN model from {acoustic_cnn_path}")
    except Exception as e:
        print(f"Error loading models: {e}")

@app.on_event("startup")
async def startup_event():
    load_models()

# ---------------- ACOUSTIC HELPERS ----------------
def extract_acoustic_features(audio_bytes: bytes):
    """Convert raw wav bytes into a Mel-spectrogram for the CNN."""
    import librosa
    import io
    audio, _ = librosa.load(io.BytesIO(audio_bytes), sr=8000, duration=1.0)
    if len(audio) < 8000:
        audio = np.pad(audio, (0, 8000 - len(audio)))
    mel_spec = librosa.feature.melspectrogram(y=audio, sr=8000, n_mels=64, hop_length=512)
    mel_spec_db = librosa.power_to_db(mel_spec, ref=np.max)
    # Normalize to [0, 1] as per training script
    feat = (mel_spec_db - (-80.0)) / (80.0) # Simple normalization
    return feat.reshape(1, 64, 16, 1)

# ---------------- AUTH ENDPOINTS ----------------

# ---------------- AUTH ENDPOINTS ----------------

@app.post("/auth/signup", response_model=schemas.Token)
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pwd = auth.get_password_hash(user.password)
    new_user = models.User(
        email=user.email,
        name=user.name,
        hashed_password=hashed_pwd,
        role=user.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = auth.create_access_token(data={"sub": new_user.email})
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": new_user
    }

@app.post("/auth/login", response_model=schemas.Token)
def login(user_data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if not user or not auth.verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = auth.create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": user
    }

# ---------------- GLOBAL STATE ----------------
state = {
    "overall": "No Leak",
    "active_leak_gps": None,
    "assigned_team": None,
    "events": [
        {"time": datetime.now(timezone.utc).isoformat(), "sensor_id": "sens101", "endpoint": "System Initialized", "prediction": "Normal", "confidence": 0.99}
    ],
    "history": [
        {"id": "LK-901", "date": "2026-04-10", "location": "Dadar West", "severity": "Medium", "resolved": True},
        {"id": "LK-902", "date": "2026-04-11", "location": "Andheri Road", "severity": "High", "resolved": True},
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

# ---------------- CORE LOGIC ----------------
def get_nearest_team(lat: float, lon: float):
    best, best_d = None, 1e9
    for t in TEAMS:
        if t["availability"] != "available": continue
        d = haversine_km(lat, lon, t["lat"], t["lon"])
        if d < best_d:
            best, best_d = t, d
    return best, best_d

# ---------------- ENDPOINTS ----------------

@app.get("/")
def home():
    return {
        "status": "online",
        "service": "AquaSense AI API",
        "location": "Mumbai, IN",
        "version": "v1.2.0"
    }

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
    return {
        "sensors": SENSORS,
        "water_sources": WATER_SOURCES,
        "teams": TEAMS
    }

@app.get("/history")
def get_history():
    return {"items": state["history"]}

@app.get("/alerts")
def get_alerts():
    # Dynamic alerts based on state
    alerts = []
    if state["overall"] == "Leak":
        alerts.append({
            "id": str(uuid.uuid4())[:8],
            "severity": "critical",
            "message": f"Active leak detected at {state['active_leak_gps']}",
            "time": datetime.now(timezone.utc).isoformat()
        })
    return {"items": alerts}

@app.get("/events")
def get_events():
    return {"items": state["events"][-15:]} # Latest 15 events

@app.get("/pipeline-stats")
def get_pipeline_stats():
    return {
        "ingest_hz": 1200 + random.randint(-50, 50),
        "cnn_inferences_per_sec": 42.5 + random.random() * 5,
        "train_buffer_pct": 85.0 + random.random() * 10,
        "model_version": "cnn-v3.2.0-mumbai"
    }

@app.post("/simulate-leak")
def simulate_leak(lat: Optional[float] = None, lon: Optional[float] = None):
    # If no coords provided, pick a random sensor's location
    if lat is None or lon is None:
        target = random.choice(SENSORS)
        lat, lon = target["lat"], target["lon"]
    
    state["overall"] = "Leak"
    state["active_leak_gps"] = [lat, lon]
    
    # Auto-assign nearest team
    team, dist = get_nearest_team(lat, lon)
    if team:
        state["assigned_team"] = team["name"]
    
    # Add to event feed
    state["events"].append({
        "time": datetime.now(timezone.utc).isoformat(),
        "sensor_id": "SYS-SIM",
        "endpoint": "Manual Trigger",
        "prediction": "Leak",
        "confidence": 1.0
    })
    
    return {"status": "Leak Simulated", "lat": lat, "lon": lon, "team": state["assigned_team"]}

@app.post("/clear-leak")
def clear_leak():
    state["overall"] = "No Leak"
    state["active_leak_gps"] = None
    state["assigned_team"] = None
    
    state["events"].append({
        "time": datetime.now(timezone.utc).isoformat(),
        "sensor_id": "SYS",
        "endpoint": "Status Clear",
        "prediction": "Normal",
        "confidence": 1.0
    })
    return {"status": "Cleared"}

@app.post("/predict")
def predict_leak(body: PredictBody):
    global rf_model, scaler, cnn_model
    
    # Check if dependencies are loaded
    if scaler is None or (rf_model is None and cnn_model is None):
        # High-performance fallback logic
        is_leak = body.pressure > 80.0 or body.vibration > 4.2
        confidence = 0.88 if is_leak else 0.94
        return {
            "is_leak": bool(is_leak),
            "confidence": confidence,
            "model_used": "heuristic_fallback_v2",
            "details": "ML models not loaded, using fallback thresholds."
        }

    try:
        features = np.array([[
            body.pressure, body.flow_rate, body.temperature, 
            body.vibration, body.rpm, body.operational_hours
        ]])
        features_scaled = scaler.transform(features)

        if body.use_cnn and cnn_model is not None and HAS_TF:
            # Reshape for 1D-CNN: (1, 6, 1)
            features_cnn = features_scaled.reshape((1, features_scaled.shape[1], 1))
            prob = float(cnn_model.predict(features_cnn, verbose=0)[0][0])
            model_name = "CNN (Deep Learning)"
        else:
            # Fallback to RF if CNN not requested or TF not available
            if rf_model:
                prob = float(rf_model.predict_proba(features_scaled)[0][1])
                model_name = "Random Forest (ML)"
            else:
                raise ValueError("Random Forest model not available")

        is_leak = prob > 0.5
        confidence = prob if is_leak else (1 - prob)

        # Update event feed on real predictions
        state["events"].append({
            "time": datetime.now(timezone.utc).isoformat(),
            "sensor_id": "API-INFER",
            "endpoint": "/predict",
            "prediction": "Leak" if is_leak else "Normal",
            "confidence": round(confidence, 4)
        })

        return {
            "is_leak": bool(is_leak),
            "confidence": round(confidence, 4),
            "model_used": model_name
        }
    except Exception as e:
        return {"error": str(e)}

@app.post("/predict-acoustic")
async def predict_acoustic(file: UploadFile = File(...)):
    global acoustic_cnn_model
    if acoustic_cnn_model is None or not HAS_TF:
        return {"error": "Acoustic CNN model not loaded"}
    
    try:
        content = await file.read()
        features = extract_acoustic_features(content)
        prob = float(acoustic_cnn_model.predict(features, verbose=0)[0][0])
        
        is_leak = prob > 0.5
        confidence = prob if is_leak else (1 - prob)
        
        # Log event
        state["events"].append({
            "time": datetime.now(timezone.utc).isoformat(),
            "sensor_id": "AUDIO-NODE",
            "endpoint": "/predict-acoustic",
            "prediction": "Leak" if is_leak else "Normal",
            "confidence": round(confidence, 4)
        })
        
        return {
            "is_leak": bool(is_leak),
            "confidence": round(confidence, 4),
            "filename": file.filename
        }
    except Exception as e:
        return {"error": str(e)}

@app.post("/assign-team")
def assign_team(body: AssignBody):
    team, dist = get_nearest_team(body.leak_lat, body.leak_lon)
    if not team:
        return {"error": "No available teams"}
    
    state["assigned_team"] = team["name"]
    return {
        "assigned_team": team["name"],
        "distance_km": round(dist, 3),
        "status": "In Transit"
    }

@app.get("/dataset")
def get_dataset(limit: int = 50):
    data = []
    data_dir = os.path.join(os.path.dirname(__file__), "data")
    csv_path = os.path.join(data_dir, "water_leak_detection_dataset.csv")
    
    if not os.path.exists(csv_path):
        csv_path = os.path.join(data_dir, "leak_dataset.csv")
        
    if not os.path.exists(csv_path):
        return {"items": []}
        
    try:
        with open(csv_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for i, row in enumerate(reader):
                if i >= limit: break
                data.append(row)
    except Exception as e:
        return {"error": f"Failed to read dataset: {e}"}
        
    return {"items": data}

@app.get("/download-dataset")
def download_dataset():
    data_dir = os.path.join(os.path.dirname(__file__), "data")
    csv_path = os.path.join(data_dir, "water_leak_detection_dataset.csv")
    if not os.path.exists(csv_path):
        csv_path = os.path.join(data_dir, "leak_dataset.csv")
    if not os.path.exists(csv_path):
        return {"error": "Dataset not found"}
    return FileResponse(csv_path, media_type='text/csv', filename='leak_dataset_mumbai.csv')

# ---------------- SERVER ----------------
if __name__ == "__main__":
    import uvicorn
    # Pre-load models before starting server
    load_models()
    uvicorn.run(app, host="0.0.0.0", port=8000)