# 🛡️ QuantumShield — AI-Powered Identity Verification Engine

Real-time deepfake detection and multi-factor risk analysis system that verifies users using AI models to prevent unauthorized access.

## 🏗️ Architecture

```
SecurityEngine/
├── api/                        # Flask Backend
│   ├── index.py                # App entry point
│   ├── database.py             # SQLite database layer
│   ├── config.py               # Environment config
│   ├── routes/
│   │   ├── auth_routes.py      # Login, Register, User logs
│   │   ├── admin_routes.py     # Admin panel APIs
│   │   └── detect_routes.py    # Deepfake detection endpoints
│   ├── services/
│   │   ├── auth_service.py     # JWT auth, password hashing
│   │   ├── face_service.py     # XceptionNet CNN deepfake detection
│   │   ├── device_service.py   # Device fingerprinting & geolocation
│   │   ├── behavior_service.py # Typing speed & behavioral analysis
│   │   └── risk_engine.py      # Risk scoring engine (0-100)
│   └── utils/
│       └── helpers.py          # JWT decorators, validation
├── src/                        # React Frontend (Vite)
│   ├── App.jsx                 # Role-based routing
│   ├── App.css                 # Complete design system
│   ├── components/
│   │   └── Navbar.jsx          # Role-aware navigation
│   ├── pages/
│   │   ├── LoginPage.jsx       # User login + face verification
│   │   ├── RegisterPage.jsx    # User registration + face baseline
│   │   ├── DashboardPage.jsx   # User security dashboard
│   │   ├── DetectPage.jsx      # Image/webcam deepfake detector
│   │   ├── AdminLoginPage.jsx  # Secret admin login
│   │   └── AdminDashboardPage.jsx # Admin command center
│   └── services/
│       └── api.js              # Axios API layer
├── index.html
├── vite.config.js
├── package.json
└── requirements.txt
```

## 🔐 Features

### AI Identity & Deepfake Protection
- **XceptionNet CNN** model for real-time deepfake detection during login
- **Identity Baseline**: Registration photo is stored as a baseline for future comparisons
- **Live Identity Verification**: Real-time matching of login faces against the baseline
- **Face Quality Check**: Automated blur and lighting analysis to ensure verification accuracy
- **Audit Trails**: All login attempt faces are captured and stored for security auditing
- **Risk Score (0-30)**: High quality faces reduce risk; deepfakes or mismatch = BLOCK

### Multi-Factor Risk Engine (0-100 score)
| Factor | Weight | Analysis |
|--------|--------|----------|
| Device Risk | 0-20 | New device fingerprint detection |
| Location Risk | 0-25 | Geolocation anomaly detection |
| Behavior Risk | 0-30 | Typing speed deviation from baseline |
| Face AI Risk | 0-30 | CNN deepfake probability score |

**Decision Logic:**
- `ALLOW` (0-30) → Access granted
- `FLAG` (31-70) → OTP verification required
- `BLOCK` (71-100) → Access denied

### Separate Admin/User System
| | User | Admin |
|--|----|-------|
| **Login** | `/login` with face verification | `/quantum-admin` (secret) |
| **Dashboard** | Own login history | Full analytics + user management |
| **Features** | Deepfake detector tool | Block/unblock users, all logs |

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 16+

### Setup

```bash
# Clone
git clone https://github.com/varunkumarcs22055/SecurityEngine.git
cd SecurityEngine

# Backend
pip install -r requirements.txt

# Frontend
npm install

# Download AI models (place in project root)
# - new_xception.h5 (XceptionNet for image deepfake detection)
# - deepfake_detection_model.h5 (LSTM for video detection)
```

### Run

```bash
# Terminal 1: Backend (port 5000)
python api/index.py

# Terminal 2: Frontend (port 5173)
npm run dev
```

Open `http://localhost:5173` → User login
Open `http://localhost:5173/quantum-admin` → Admin login

### Admin Credentials
```
Email:    admin@quantumshield.io
Password: QS@dmin2024!
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Axios, React Webcam |
| Backend | Flask, Flask-CORS |
| Database | SQLite (zero-config, embedded) |
| AI Model | XceptionNet CNN (TensorFlow/Keras) |
| Auth | JWT (PyJWT), bcrypt |
| Risk Analysis | Custom multi-factor engine |

## 📡 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/register` | — | Register user with face baseline |
| POST | `/api/login` | — | Login with AI risk analysis |
| POST | `/api/admin/login` | — | Admin authentication |
| GET | `/api/user/logs` | JWT | User's own login history |
| GET | `/api/admin/stats` | Admin | Security analytics |
| GET | `/api/admin/logs` | Admin | All login logs |
| GET | `/api/admin/users` | Admin | User management |
| POST | `/api/admin/users/:id/block` | Admin | Block/unblock user |
| POST | `/api/detect/image` | JWT | Upload image deepfake detection |
| POST | `/api/detect/webcam` | JWT | Webcam deepfake detection |
| GET | `/api/health` | — | Server health check |

## 📄 License

MIT
