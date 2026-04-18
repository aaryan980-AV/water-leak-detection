import pandas as pd
import numpy as np
import os
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score

# Deep Learning imports (will work once pip install completes)
try:
    import tensorflow as tf
    from tensorflow.keras import layers, models
    HAS_TF = True
except ImportError:
    HAS_TF = False
    print("TensorFlow not found. CNN training will be skipped.")

def train_models():
    # 1. Load Dataset
    data_path = os.path.join(os.path.dirname(__file__), "data", "water_leak_detection_dataset.csv")
    if not os.path.exists(data_path):
        print(f"Dataset not found at {data_path}")
        return

    print("Loading dataset...")
    df = pd.read_csv(data_path)
    
    # 2. Extract Features and Target
    # Features: Pressure, Flow_Rate, Temperature, Vibration, RPM, Operational_Hours
    feature_cols = ['Pressure', 'Flow_Rate', 'Temperature', 'Vibration', 'RPM', 'Operational_Hours']
    X = df[feature_cols]
    y = df['Leakage_Flag']

    # 3. Split Data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # 4. Standardize Features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Create models directory if it doesn't exist
    models_dir = os.path.join(os.path.dirname(__file__), "models")
    if not os.path.exists(models_dir):
        os.makedirs(models_dir)

    # Save the scaler for inference
    joblib.dump(scaler, os.path.join(models_dir, "scaler.joblib"))
    print("Scaler saved.")

    # 5. Train Random Forest (ML Model)
    print("Training Random Forest model...")
    rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
    rf_model.fit(X_train_scaled, y_train)
    
    y_pred_rf = rf_model.predict(X_test_scaled)
    print(f"Random Forest Accuracy: {accuracy_score(y_test, y_pred_rf):.4f}")
    
    # Save RF model
    models_dir = os.path.join(os.path.dirname(__file__), "models")
    if not os.path.exists(models_dir):
        os.makedirs(models_dir)
    joblib.dump(rf_model, os.path.join(models_dir, "ml_model.joblib"))
    print("ML model saved.")

    # 6. Train CNN Model (using 1D-CNN)
    if HAS_TF:
        print("Training CNN model...")
        # Reshape data for 1D-CNN: (samples, time_steps, features)
        # Here we treat the 6 features as a sequence of length 6
        X_train_cnn = X_train_scaled.reshape((X_train_scaled.shape[0], X_train_scaled.shape[1], 1))
        X_test_cnn = X_test_scaled.reshape((X_test_scaled.shape[0], X_test_scaled.shape[1], 1))

        cnn_model = models.Sequential([
            layers.Conv1D(32, kernel_size=3, activation='relu', input_shape=(X_train_cnn.shape[1], 1)),
            layers.MaxPooling1D(pool_size=2),
            layers.Flatten(),
            layers.Dense(64, activation='relu'),
            layers.Dropout(0.2),
            layers.Dense(1, activation='sigmoid')
        ])

        cnn_model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
        
        cnn_model.fit(X_train_cnn, y_train, epochs=20, batch_size=32, validation_split=0.1, verbose=0)
        
        loss, accuracy = cnn_model.evaluate(X_test_cnn, y_test, verbose=0)
        print(f"CNN Model Accuracy: {accuracy:.4f}")
        
        # Save CNN model
        cnn_model.save(os.path.join(models_dir, "cnn_model.keras"))
        print("CNN model saved.")
    else:
        print("Skipping CNN training (TensorFlow not available).")

if __name__ == "__main__":
    train_models()
