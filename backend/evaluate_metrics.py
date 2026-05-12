import pandas as pd
import numpy as np
import os
import joblib
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, roc_curve, auc

def plot_roc_curve(y_test, y_probs, model_name, save_path):
    fpr, tpr, _ = roc_curve(y_test, y_probs)
    roc_auc = auc(fpr, tpr)

    plt.figure(figsize=(8, 6))
    plt.plot(fpr, tpr, color='darkorange', lw=2, label=f'ROC curve (area = {roc_auc:.2f})')
    plt.plot([0, 1], [0, 1], color='navy', lw=2, linestyle='--')
    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    plt.xlabel('False Positive Rate')
    plt.ylabel('True Positive Rate')
    plt.title(f'ROC Curve - {model_name}')
    plt.legend(loc="lower right")
    plt.grid(alpha=0.3)
    plt.savefig(save_path)
    plt.close()
    print(f"ROC Curve saved to {save_path}")

def evaluate():
    # 1. Load Dataset
    backend_dir = os.path.dirname(__file__)
    data_path = os.path.join(backend_dir, "data", "water_leak_detection_dataset.csv")
    if not os.path.exists(data_path):
        print(f"Dataset not found at {data_path}")
        return

    df = pd.read_csv(data_path)
    
    # 2. Extract Features and Target
    feature_cols = ['Pressure', 'Flow_Rate', 'Temperature', 'Vibration', 'RPM', 'Operational_Hours']
    X = df[feature_cols]
    y = df['Leakage_Flag']

    # 3. Split Data (same random state as in training script)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # 4. Load Model and Scaler
    models_dir = os.path.join(backend_dir, "models")
    scaler_path = os.path.join(models_dir, "scaler.joblib")
    model_path = os.path.join(models_dir, "ml_model.joblib")

    if not os.path.exists(scaler_path) or not os.path.exists(model_path):
        print("Model or Scaler not found.")
        return

    scaler = joblib.load(scaler_path)
    model = joblib.load(model_path)

    # 5. Preprocess Test Data
    X_test_scaled = scaler.transform(X_test)
    
    # 6. Predict ML
    y_pred_ml = model.predict(X_test_scaled)
    y_probs_ml = model.predict_proba(X_test_scaled)[:, 1]
    
    # 7. Calculate ML Metrics
    accuracy_ml = accuracy_score(y_test, y_pred_ml)
    conf_matrix_ml = confusion_matrix(y_test, y_pred_ml)
    class_report_ml = classification_report(y_test, y_pred_ml, target_names=['No Leak', 'Leak'])

    print("--- Random Forest (ML) Performance Metrics ---")
    print(f"Accuracy: {accuracy_ml:.4f}")
    print("\nConfusion Matrix:")
    print(conf_matrix_ml)
    print("\nClassification Report:")
    print(class_report_ml)

    roc_path_ml = os.path.join(backend_dir, "data", "roc_curve_rf.png")
    plot_roc_curve(y_test, y_probs_ml, "Random Forest", roc_path_ml)

    # 8. Evaluate CNN Model
    cnn_model_path = os.path.join(models_dir, "cnn_model.keras")
    if os.path.exists(cnn_model_path):
        try:
            import tensorflow as tf
            cnn_model = tf.keras.models.load_model(cnn_model_path)
            
            # Reshape for CNN
            X_test_cnn = X_test_scaled.reshape((X_test_scaled.shape[0], X_test_scaled.shape[1], 1))
            
            y_pred_cnn_prob = cnn_model.predict(X_test_cnn, verbose=0)
            y_pred_cnn = (y_pred_cnn_prob > 0.5).astype(int).flatten()
            
            accuracy_cnn = accuracy_score(y_test, y_pred_cnn)
            conf_matrix_cnn = confusion_matrix(y_test, y_pred_cnn)
            class_report_cnn = classification_report(y_test, y_pred_cnn, target_names=['No Leak', 'Leak'])

            print("\n" + "="*40 + "\n")
            print("--- CNN (Deep Learning) Performance Metrics ---")
            print(f"Accuracy: {accuracy_cnn:.4f}")
            print("\nConfusion Matrix:")
            print(conf_matrix_cnn)
            print("\nClassification Report:")
            print(class_report_cnn)

            roc_path_cnn = os.path.join(backend_dir, "data", "roc_curve_cnn.png")
            plot_roc_curve(y_test, y_pred_cnn_prob, "1D-CNN", roc_path_cnn)
        except Exception as e:
            print(f"\nError evaluating CNN model: {e}")

    # 9. Evaluate Acoustic CNN Model
    acoustic_model_path = os.path.join(models_dir, "acoustic_cnn_model.keras")
    X_acoustic_path = os.path.join(backend_dir, "data", "X_acoustic.npy")
    y_acoustic_path = os.path.join(backend_dir, "data", "y_acoustic.npy")

    if os.path.exists(acoustic_model_path) and os.path.exists(X_acoustic_path):
        try:
            print("\n" + "="*40 + "\n")
            print("--- Acoustic CNN Performance Metrics ---")
            
            X_ac = np.load(X_acoustic_path)
            y_ac = np.load(y_acoustic_path)
            
            # Normalization
            X_ac = (X_ac - np.min(X_ac)) / (np.max(X_ac) - np.min(X_ac))
            
            # Split
            _, X_ac_test, _, y_ac_test = train_test_split(X_ac, y_ac, test_size=0.2, random_state=42)
            
            import tensorflow as tf
            ac_model = tf.keras.models.load_model(acoustic_model_path)
            
            y_pred_ac_prob = ac_model.predict(X_ac_test, verbose=0)
            y_pred_ac = (y_pred_ac_prob > 0.5).astype(int).flatten()
            
            accuracy_ac = accuracy_score(y_ac_test, y_pred_ac)
            conf_matrix_ac = confusion_matrix(y_ac_test, y_pred_ac)
            class_report_ac = classification_report(y_ac_test, y_pred_ac, target_names=['No Leak', 'Leak'])

            print(f"Accuracy: {accuracy_ac:.4f}")
            print("\nConfusion Matrix:")
            print(conf_matrix_ac)
            print("\nClassification Report:")
            print(class_report_ac)

            roc_path_ac = os.path.join(backend_dir, "data", "roc_curve_acoustic.png")
            plot_roc_curve(y_ac_test, y_pred_ac_prob, "Acoustic CNN", roc_path_ac)
        except Exception as e:
            print(f"\nError evaluating Acoustic CNN model: {e}")

if __name__ == "__main__":
    evaluate()


if __name__ == "__main__":
    evaluate()
