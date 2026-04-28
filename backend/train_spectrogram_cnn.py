import os
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models

def main():
    print("Generating synthetic spectrogram data...")
    # Generate 100 random spectrograms of size 64x16x1
    X_train = np.random.rand(100, 64, 16, 1).astype('float32')
    # Binary labels (0 = No Leak, 1 = Leak)
    y_train = np.random.randint(0, 2, size=(100,))

    # User-requested architecture: Conv2D -> ReLU -> MaxPooling -> Dense -> Softmax
    print("Building model...")
    model = models.Sequential([
        layers.Input(shape=(64, 16, 1)),
        layers.Conv2D(32, (3, 3), activation='relu'),
        layers.MaxPooling2D((2, 2)),
        layers.Flatten(),
        layers.Dense(16, activation='relu'),
        layers.Dense(2, activation='softmax')  # 2 classes: No Leak (0) and Leak (1)
    ])

    model.compile(optimizer='adam',
                  loss='sparse_categorical_crossentropy',
                  metrics=['accuracy'])

    print("Training model...")
    model.fit(X_train, y_train, epochs=5, batch_size=8, verbose=1)

    models_dir = os.path.join(os.path.dirname(__file__), "models")
    os.makedirs(models_dir, exist_ok=True)
    model_path = os.path.join(models_dir, "cnn_spectrogram_model.keras")
    
    model.save(model_path)
    print(f"Spectrogram CNN model saved to {model_path}")

if __name__ == "__main__":
    main()
