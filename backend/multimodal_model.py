import tensorflow as tf
from tensorflow.keras import layers, models

def build_multimodal_model(audio_shape=(64, 16, 1), sensor_dim=6):
    # Audio Branch (CNN)
    audio_input = layers.Input(shape=audio_shape, name="audio_input")
    x_audio = layers.Conv2D(32, (3, 3), activation='relu', padding='same')(audio_input)
    x_audio = layers.MaxPooling2D((2, 2))(x_audio)
    x_audio = layers.Conv2D(64, (3, 3), activation='relu', padding='same')(x_audio)
    x_audio = layers.MaxPooling2D((2, 2))(x_audio)
    x_audio = layers.Flatten()(x_audio)
    # Penultimate layer: 64-dimensional feature vector
    audio_features = layers.Dense(64, activation='relu', name="audio_features")(x_audio)

    # Sensor Branch
    sensor_input = layers.Input(shape=(sensor_dim,), name="sensor_input")
    
    # Feature Fusion: Concatenate CNN audio features with sensor feature vector
    merged = layers.concatenate([audio_features, sensor_input])

    # Final Classifier
    x = layers.Dense(128, activation='relu')(merged)
    x = layers.Dropout(0.3)(x)
    x = layers.Dense(64, activation='relu')(x)
    output = layers.Dense(1, activation='sigmoid', name="prediction")(x)

    model = models.Model(inputs=[audio_input, sensor_input], outputs=output)
    
    model.compile(optimizer='adam',
                  loss='binary_crossentropy',
                  metrics=['accuracy', tf.keras.metrics.Precision(), tf.keras.metrics.Recall()])
    
    return model

if __name__ == "__main__":
    model = build_multimodal_model()
    model.summary()
