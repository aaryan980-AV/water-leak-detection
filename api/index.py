import os
import io
import numpy as np
import librosa
import joblib
import onnxruntime as ort
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Model and Scaler
MODEL_PATH = os.path.join(os.path.dirname(__file__), "multimodal_leak_detector.onnx")
SCALER_PATH = os.path.join(os.path.dirname(__file__), "sensor_scaler.pkl")

ort_session = None
scaler = None

def load_resources():
    global ort_session, scaler
    if ort_session is None:
        ort_session = ort.InferenceSession(MODEL_PATH)
    if scaler is None:
        scaler = joblib.load(SCALER_PATH)

def preprocess_audio(audio_bytes):
    # Parameters must match training
    sample_rate = 8000
    duration = 1.0
    n_mels = 64
    hop_length = 512
    
    audio, _ = librosa.load(io.BytesIO(audio_bytes), sr=sample_rate, duration=duration)
    if len(audio) < sample_rate * duration:
        audio = np.pad(audio, (0, int(sample_rate * duration) - len(audio)))
    
    mel_spec = librosa.feature.melspectrogram(y=audio, sr=sample_rate, n_mels=n_mels, hop_length=hop_length)
    mel_spec_db = librosa.power_to_db(mel_spec, ref=np.max)
    
    # Input shape: (1, 64, 16, 1)
    feat_input = mel_spec_db.reshape(1, 64, 16, 1).astype(np.float32)
    return feat_input

@app.get("/api/health")
def health():
    return {"status": "healthy"}

@app.post("/api/predict")
async def predict(
    pressure: float = Form(...),
    vibration: float = Form(...),
    flow_rate: float = Form(...),
    humidity: float = Form(...),
    temperature: float = Form(...),
    pipe_velocity: float = Form(...),
    audio_file: UploadFile = File(...)
):
    load_resources()
    
    try:
        # Process Audio
        audio_content = await audio_file.read()
        audio_input = preprocess_audio(audio_content)
        
        # Process Sensor
        sensor_data = np.array([[pressure, vibration, flow_rate, humidity, temperature, pipe_velocity]])
        sensor_scaled = scaler.transform(sensor_data).astype(np.float32)
        
        # Inference using ONNX
        # Inputs: [audio_input, sensor_input]
        # Check input names of your ONNX model
        input_names = [i.name for i in ort_session.get_inputs()]
        # Usually 'audio_input' and 'sensor_input' if defined in conversion
        
        outputs = ort_session.run(None, {
            input_names[0]: audio_input,
            input_names[1]: sensor_scaled
        })
        
        prob_leak = float(outputs[0][0][0])
        prediction = "LEAK" if prob_leak > 0.5 else "NO LEAK"
        confidence = prob_leak * 100 if prob_leak > 0.5 else (1 - prob_leak) * 100
        
        return {
            "prediction": prediction,
            "confidence": round(confidence, 2),
            "leak_probability": round(prob_leak, 4)
        }
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
