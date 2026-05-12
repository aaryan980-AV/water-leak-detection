import pandas as pd
import numpy as np
import os

def generate_dataset():
    data_dir = os.path.join(os.path.dirname(__file__), "data")
    os.makedirs(data_dir, exist_ok=True)
    
    # Matching audio counts
    num_leaks = 500
    num_no_leaks = 386
    num_samples = num_leaks + num_no_leaks
    
    # Requested features: pressure, vibration, flow_rate, humidity, temperature, pipe_velocity
    pressure = np.concatenate([
        np.random.normal(40, 5, num_leaks),   # Lower pressure for leaks
        np.random.normal(70, 10, num_no_leaks) # Normal pressure
    ])
    
    vibration = np.concatenate([
        np.random.normal(5.0, 1.0, num_leaks),  # Higher vibration for leaks
        np.random.normal(2.0, 0.5, num_no_leaks) # Normal vibration
    ])
    
    flow_rate = np.random.normal(50, 15, num_samples)
    humidity = np.random.normal(60, 10, num_samples)
    temperature = np.random.normal(25, 5, num_samples)
    pipe_velocity = np.random.normal(1.5, 0.3, num_samples)
    
    leakage_flag = np.concatenate([
        np.ones(num_leaks),
        np.zeros(num_no_leaks)
    ])
    
    df = pd.DataFrame({
        'pressure': pressure,
        'vibration': vibration,
        'flow_rate': flow_rate,
        'humidity': humidity,
        'temperature': temperature,
        'pipe_velocity': pipe_velocity,
        'leakage_flag': leakage_flag
    })
    
    # Shuffle to avoid ordered labels
    df = df.sample(frac=1).reset_index(drop=True)
    
    csv_path = os.path.join(data_dir, "water_leak_detection_dataset.csv")
    df.to_csv(csv_path, index=False)
    print(f"Generated {num_samples} samples at {csv_path} (500 leaks, 386 no-leaks)")

if __name__ == "__main__":
    generate_dataset()
