import os
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models
from sklearn.model_selection import train_test_split

def train_acoustic_cnn():
    base_dir = os.path.join(os.path.dirname(__file__), "data")
    X_path = os.path.join(base_dir, "X_acoustic.npy")
    y_path = os.path.join(base_dir, "y_acoustic.npy")

    if not os.path.exists(X_path) or not os.path.exists(y_path):
        print("Preprocessed data not found. Run preprocess_acoustic.py first.")
        return

    # Load data
    print("Loading preprocessed data...")
    X = np.load(X_path)
    y = np.load(y_path)

    # Normalize X to [0, 1] range (db values are negative)
    X = (X - np.min(X)) / (np.max(X) - np.min(X))

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Build 2D CNN
    print("Building 2D CNN architecture...")
    model = models.Sequential([
        layers.Conv2D(32, (3, 3), activation='relu', input_shape=(X.shape[1], X.shape[2], 1)),
        layers.MaxPooling2D((2, 2)),
        layers.Conv2D(64, (3, 3), activation='relu'),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.25),
        layers.Flatten(),
        layers.Dense(64, activation='relu'),
        layers.Dense(1, activation='sigmoid')
    ])

    model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
    
    # Train
    print("Starting training...")
    model.fit(X_train, y_train, epochs=25, batch_size=32, validation_split=0.1)

    # Evaluate
    loss, acc = model.evaluate(X_test, y_test)
    print(f"Test Accuracy: {acc:.4f}")

    # Save
    models_dir = os.path.join(os.path.dirname(__file__), "models")
    os.makedirs(models_dir, exist_ok=True)
    model_path = os.path.join(models_dir, "acoustic_cnn_model.keras")
    model.save(model_path)
    print(f"Model saved to {model_path}")

if __name__ == "__main__":
    train_acoustic_cnn()
