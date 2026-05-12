# Hybrid Water Leak Detection System - Vercel AI Deployment

This project is optimized for deployment on Vercel using a hybrid Python (FastAPI) + React (Vite) architecture.

## 🚀 Deployment Steps

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/aaryan980-AV/water-leak-detection
    cd water-leak-detection
    ```

2.  **Install Vercel CLI**:
    ```bash
    npm install -g vercel
    ```

3.  **Deploy**:
    ```bash
    vercel --prod
    ```

## 🛠️ Architecture Highlights

-   **Backend**: FastAPI server running in Vercel Serverless Functions (`api/index.py`).
-   **Inference**: Uses **ONNX Runtime** for high-speed, lightweight inference of the CNN-Dense hybrid model. This avoids the large memory footprint of TensorFlow.
-   **Frontend**: React + Vite application with Tailwind CSS and Framer Motion.
-   **Fusion Logic**: Combines acoustic Mel-Spectrogram features with real-time sensor telemetry.

## 📡 API Endpoints

-   `POST /api/predict`: Accepts a `.wav` file and sensor values (pressure, vibration, etc.).
-   `GET /api/health`: Check if the AI backend is online.

## 🧪 Testing Locally

1.  **Backend**:
    ```bash
    pip install -r requirements.txt
    python api/index.py
    ```

2.  **Frontend**:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```
