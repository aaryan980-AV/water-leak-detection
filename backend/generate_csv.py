import pandas as pd
import numpy as np
import os

def generate_dataset():
    data_dir = os.path.join(os.path.dirname(__file__), "data")
    os.makedirs(data_dir, exist_ok=True)
    
    num_samples = 500
    
    pressure = np.random.normal(70, 10, num_samples)
    flow_rate = np.random.normal(50, 15, num_samples)
    temperature = np.random.normal(25, 5, num_samples)
    vibration = np.random.normal(2.5, 0.5, num_samples)
    rpm = np.random.normal(1500, 200, num_samples)
    operational_hours = np.random.uniform(100, 10000, num_samples)
    
    # Introduce leaks based on pressure drops and vibration spikes
    leakage_flag = np.where((pressure < 60) & (vibration > 3.0), 1, 0)
    
    df = pd.DataFrame({
        'Pressure': pressure,
        'Flow_Rate': flow_rate,
        'Temperature': temperature,
        'Vibration': vibration,
        'RPM': rpm,
        'Operational_Hours': operational_hours,
        'Leakage_Flag': leakage_flag
    })
    
    # Add a few certain leaks
    for i in range(50):
        df.loc[i, 'Pressure'] = np.random.uniform(30, 50)
        df.loc[i, 'Vibration'] = np.random.uniform(4.0, 6.0)
        df.loc[i, 'Leakage_Flag'] = 1
        
    df = df.sample(frac=1).reset_index(drop=True)
    
    csv_path = os.path.join(data_dir, "water_leak_detection_dataset.csv")
    df.to_csv(csv_path, index=False)
    print(f"Generated {num_samples} samples at {csv_path}")

if __name__ == "__main__":
    generate_dataset()
