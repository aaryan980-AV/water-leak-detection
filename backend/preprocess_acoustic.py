import os
import numpy as np
import librosa
import glob

def preprocess_audio():
    base_dir = os.path.join(os.path.dirname(__file__), "data")
    leak_dir = os.path.join(base_dir, "leak acoustic data", "leak acoustic data")
    no_leak_dir = os.path.join(base_dir, "no leak acoustic data")

    # Parameters
    sample_rate = 8000
    duration = 1.0
    n_mels = 64
    hop_length = 512

    X = []
    y = []

    # Helper to process a directory
    def process_dir(directory, label):
        print(f"Processing {directory}...")
        files = glob.glob(os.path.join(directory, "*.wav"))
        for f in files:
            try:
                audio, _ = librosa.load(f, sr=sample_rate, duration=duration)
                # Pad if too short
                if len(audio) < sample_rate * duration:
                    audio = np.pad(audio, (0, int(sample_rate * duration) - len(audio)))
                
                # Mel-spectrogram
                mel_spec = librosa.feature.melspectrogram(y=audio, sr=sample_rate, n_mels=n_mels, hop_length=hop_length)
                mel_spec_db = librosa.power_to_db(mel_spec, ref=np.max)
                X.append(mel_spec_db)
                y.append(label)
            except Exception as e:
                print(f"Error processing {f}: {e}")

    # Load data
    process_dir(leak_dir, 1)
    process_dir(no_leak_dir, 0)

    X = np.array(X)
    y = np.array(y)

    # Add channel dimension: (samples, height, width, 1)
    X = X.reshape(X.shape[0], X.shape[1], X.shape[2], 1)

    # Save to disk
    np.save(os.path.join(base_dir, "X_acoustic.npy"), X)
    np.save(os.path.join(base_dir, "y_acoustic.npy"), y)
    print(f"Acoustic preprocessing complete. Shape: {X.shape}")

if __name__ == "__main__":
    preprocess_audio()
