import os
import numpy as np
import pandas as pd
import librosa
import glob
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split

def load_audio_data(sample_rate=8000, duration=1.0, n_mels=64, hop_length=512):
    base_dir = os.path.join(os.path.dirname(__file__), "data")
    leak_dir = os.path.join(base_dir, "leak acoustic data", "leak acoustic data")
    no_leak_dir = os.path.join(base_dir, "no leak acoustic data")

    leak_files = sorted(glob.glob(os.path.join(leak_dir, "*.wav")))
    no_leak_files = sorted(glob.glob(os.path.join(no_leak_dir, "*.wav")))

    def process_files(files, label):
        X, y = [], []
        for f in files:
            try:
                audio, _ = librosa.load(f, sr=sample_rate, duration=duration)
                if len(audio) < sample_rate * duration:
                    audio = np.pad(audio, (0, int(sample_rate * duration) - len(audio)))
                
                mel_spec = librosa.feature.melspectrogram(y=audio, sr=sample_rate, n_mels=n_mels, hop_length=hop_length)
                mel_spec_db = librosa.power_to_db(mel_spec, ref=np.max)
                X.append(mel_spec_db)
                y.append(label)
            except Exception as e:
                print(f"Error processing {f}: {e}")
        return X, y

    X_leak, y_leak = process_files(leak_files, 1)
    X_no_leak, y_no_leak = process_files(no_leak_files, 0)

    return X_leak, y_leak, X_no_leak, y_no_leak

def preprocess_multimodal():
    print("Loading sensor data...")
    data_dir = os.path.join(os.path.dirname(__file__), "data")
    df = pd.read_csv(os.path.join(data_dir, "water_leak_detection_dataset.csv"))
    
    print("Loading audio data...")
    X_l, y_l, X_nl, y_nl = load_audio_data()
    
    # We need to match the sensor records with the audio records.
    # Since we generated the CSV to match the counts, we can just split by label.
    leak_sensor = df[df['leakage_flag'] == 1].copy()
    no_leak_sensor = df[df['leakage_flag'] == 0].copy()
    
    # Ensure matching lengths
    leak_sensor = leak_sensor.iloc[:len(X_l)]
    no_leak_sensor = no_leak_sensor.iloc[:len(X_nl)]
    
    X_audio = np.array(X_l + X_nl)
    X_audio = X_audio.reshape(X_audio.shape[0], X_audio.shape[1], X_audio.shape[2], 1)
    
    X_sensor_raw = pd.concat([leak_sensor, no_leak_sensor]).drop(columns=['leakage_flag'])
    y = np.array(y_l + y_nl)
    
    print("Normalizing sensor data...")
    scaler = StandardScaler()
    X_sensor = scaler.fit_transform(X_sensor_raw)
    
    # Save the scaler for inference
    import joblib
    joblib.dump(scaler, os.path.join(data_dir, "sensor_scaler.pkl"))
    
    print(f"Preprocessing complete. Audio shape: {X_audio.shape}, Sensor shape: {X_sensor.shape}")
    
    # Train/Test Split
    indices = np.arange(len(y))
    idx_train, idx_test = train_test_split(indices, test_size=0.2, random_state=42, stratify=y)
    
    X_audio_train, X_audio_test = X_audio[idx_train], X_audio[idx_test]
    X_sensor_train, X_sensor_test = X_sensor[idx_train], X_sensor[idx_test]
    y_train, y_test = y[idx_train], y[idx_test]
    
    # Save processed data
    np.save(os.path.join(data_dir, "X_audio_train.npy"), X_audio_train)
    np.save(os.path.join(data_dir, "X_audio_test.npy"), X_audio_test)
    np.save(os.path.join(data_dir, "X_sensor_train.npy"), X_sensor_train)
    np.save(os.path.join(data_dir, "X_sensor_test.npy"), X_sensor_test)
    np.save(os.path.join(data_dir, "y_train.npy"), y_train)
    np.save(os.path.join(data_dir, "y_test.npy"), y_test)
    
    print("Processed data saved to disk.")

if __name__ == "__main__":
    preprocess_multimodal()
