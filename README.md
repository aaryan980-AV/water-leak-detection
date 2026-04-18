# 💧 AquaSense AI: Intelligent Water Leak Detection

> **Next-Generation Underground Pipeline Monitoring & Geospatial Response System**

AquaSense AI is a mission-critical geospatial platform designed for municipal water departments and utility companies. It integrates high-frequency acoustic sensor data, machine learning-driven leak detection, and real-time field crew orchestration to minimize water loss and infrastructure damage.

---

## ✨ Key Features

- **📍 Real-time Geospatial Intelligence**: interactive Mumbai MMR map with live sensor telemetry, water supply nodes, and maintenance team locations using **Leaflet** & **CartoDB**.
* **🧠 AI-Powered Detection**: Backend logic simulates CNN inference on acoustic streams to identify anomalous leak signatures with high precision.
- **🏗️ Crew Orchestration**: Automated routing using **Haversine** geospatial algorithms to assign the nearest maintenance team to active incidents.
- **🔐 Enterprise Auth**: Secure multi-role authentication (Supervisor, Maintenance, Water Supplier) powered by **JWT** and **FastAPI Security**.
- **📊 Analytics & Insights**: High-fidelity data visualization for flow trends, sensor health, and system performance using **Recharts**.
- **🎨 Premium UI/UX**: Ultra-modern, high-performance interface with **Glassmorphism**, **Framer Motion** animations, and adaptive **Dark/Light** modes.

---

## 🛠️ Technology Stack

| Domain | Technology |
|--------|------------|
| **Frontend** | React 18, Vite, Tailwind CSS (v4), Framer Motion, Recharts, Leaflet |
| **Backend** | FastAPI (Python 3.11+), Pydantic v2, SQLAlchemy |
| **Database** | **Neon PostgreSQL** (Serverless) |
| **Icons & Assets** | Lucide React, Custom SVG Asset Engine |

---

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- Neon.tech account (PostgreSQL)

### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: .\venv\Scripts\activate
pip install -r requirements.txt
```
Create a `.env` file in the `backend/` directory:
```env
DATABASE_URL=your_neon_postgres_url
SECRET_KEY=your_secure_random_string
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```
Start the server:
```bash
uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
```
Start the development server:
```bash
npm run dev
```

---

## 🗺️ Project Architecture

```bash
├── backend/
│   ├── auth/            # JWT & Security logic
│   ├── database.py      # Neon DB connection & session
│   ├── main.py          # FastAPI Entry & API Routes
│   ├── models.py        # SQLAlchemy Schema
│   └── schemas.py       # Pydantic Validation
└── frontend/
    ├── src/
    │   ├── auth/        # React AuthContext & Protected Routes
    │   ├── components/  # SystemMap, HeroViz, Analytics UI
    │   ├── pages/       # Dashboard, Live Map, Login/Signup
    │   └── theme/       # Design System tokens
```

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/signup` | Register new municipal staff |
| `POST` | `/auth/login` | Secure JWT-based access |
| `GET`  | `/status` | Real-time system leak status & GPS |
| `GET`  | `/locations` | Fetch all sensor, supply & team nodes |
| `POST` | `/simulate-leak`| Trigger high-priority alert (Demo) |
| `POST` | `/clear-leak` | Resolve active incident |

---

## ⚖️ License

Distributed under the MIT License. See `LICENSE` for more information.

---

**Built with ❤️ for the future of Smart Cities.**
