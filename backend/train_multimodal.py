import os
import numpy as np
import tensorflow as tf
import matplotlib.pyplot as plt
from sklearn.metrics import confusion_matrix, classification_report, f1_score
import seaborn as sns
from multimodal_model import build_multimodal_model

def train():
    data_dir = os.path.join(os.path.dirname(__file__), "data")
    models_dir = os.path.join(os.path.dirname(__file__), "models")
    os.makedirs(models_dir, exist_ok=True)

    # Load data
    print("Loading preprocessed data...")
    X_audio_train = np.load(os.path.join(data_dir, "X_audio_train.npy"))
    X_audio_test = np.load(os.path.join(data_dir, "X_audio_test.npy"))
    X_sensor_train = np.load(os.path.join(data_dir, "X_sensor_train.npy"))
    X_sensor_test = np.load(os.path.join(data_dir, "X_sensor_test.npy"))
    y_train = np.load(os.path.join(data_dir, "y_train.npy"))
    y_test = np.load(os.path.join(data_dir, "y_test.npy"))

    print(f"Training on {len(y_train)} samples, testing on {len(y_test)} samples.")

    # Build model
    model = build_multimodal_model(audio_shape=X_audio_train.shape[1:], sensor_dim=X_sensor_train.shape[1])
    model.summary()

    # Train
    print("Starting training...")
    history = model.fit(
        [X_audio_train, X_sensor_train],
        y_train,
        epochs=30,
        batch_size=32,
        validation_split=0.2,
        verbose=1
    )

    # Save model
    model_path = os.path.join(models_dir, "multimodal_leak_detector.h5")
    model.save(model_path)
    print(f"Model saved to {model_path}")

    # Evaluation
    print("Evaluating model...")
    y_pred_prob = model.predict([X_audio_test, X_sensor_test])
    y_pred = (y_pred_prob > 0.5).astype(int)

    # Metrics
    f1 = f1_score(y_test, y_pred)
    print(f"F1-Score: {f1:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))

    # Visualizations
    # 1. Training History
    plt.figure(figsize=(12, 4))
    plt.subplot(1, 2, 1)
    plt.plot(history.history['accuracy'], label='Train Accuracy')
    plt.plot(history.history['val_accuracy'], label='Val Accuracy')
    plt.title('Model Accuracy')
    plt.legend()

    plt.subplot(1, 2, 2)
    plt.plot(history.history['loss'], label='Train Loss')
    plt.plot(history.history['val_loss'], label='Val Loss')
    plt.title('Model Loss')
    plt.legend()
    plt.savefig(os.path.join(data_dir, "training_graphs.png"))
    plt.close()

    # 2. Confusion Matrix
    cm = confusion_matrix(y_test, y_pred)
    plt.figure(figsize=(6, 5))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=['No Leak', 'Leak'], yticklabels=['No Leak', 'Leak'])
    plt.xlabel('Predicted')
    plt.ylabel('Actual')
    plt.title('Confusion Matrix')
    plt.savefig(os.path.join(data_dir, "confusion_matrix.png"))
    plt.close()

    print("Graphs and confusion matrix saved to data directory.")

if __name__ == "__main__":
    train()
