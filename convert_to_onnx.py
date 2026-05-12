import os
import tensorflow as tf
import tf2onnx
import onnx

def convert_to_onnx():
    model_path = "backend/models/multimodal_leak_detector.h5"
    onnx_path = "api/multimodal_leak_detector.onnx"
    
    if not os.path.exists("api"):
        os.makedirs("api")
        
    print(f"Loading model from {model_path}...")
    model = tf.keras.models.load_model(model_path)
    
    print("Converting to ONNX...")
    # Define the input signature based on the model's inputs
    # [audio_input, sensor_input]
    spec = (
        tf.TensorSpec((None, 64, 16, 1), tf.float32, name="audio_input"),
        tf.TensorSpec((None, 6), tf.float32, name="sensor_input")
    )
    
    model_proto, _ = tf2onnx.convert.from_keras(model, input_signature=spec, opset=13)
    
    with open(onnx_path, "wb") as f:
        f.write(model_proto.SerializeToString())
        
    print(f"Model successfully converted to ONNX: {onnx_path}")

if __name__ == "__main__":
    convert_to_onnx()
