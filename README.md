# ⚛️ QuantumShield — AI-Based Secure Authentication System

> **Production-ready full-stack authentication** powered by XceptionNet deepfake detection, real-time face liveness verification, impossible-travel anomaly detection, and a rich admin command center.

---

## 🗂️ Project Structure

```
QuantumShieldExtension/
├── api/                          # Flask Backend (Python)
│   ├── index.py                  # App factory & entry point
│   ├── database.py               # SQLite init + schema migrations
│   ├── config.py                 # Risk thresholds & env config
│   ├── routes/
│   │   ├── auth_routes.py        # Register, Login, Profile, Admin login
│   │   ├── admin_routes.py       # Admin stats, logs, user management
│   │   └── detect_routes.py      # Standalone deepfake detection
│   ├── services/
│   │   ├── auth_service.py       # bcrypt, JWT, user CRUD, profile
│   │   ├── face_service.py       # XceptionNet model inference + fallback
│   │   ├── device_service.py     # Device fingerprint + Nominatim geocoding
│   │   ├── behavior_service.py   # Typing speed anomaly scoring
│   │   └── risk_engine.py        # Aggregate risk + ALLOW/FLAG/BLOCK decision
│   └── utils/
│       └── helpers.py            # JWT decorators, IP extraction, validators
├── src/                          # React Frontend (Vite)
│   ├── pages/
│   │   ├── RegisterPage.jsx      # 2-step: account details + face biometrics
│   │   ├── LoginPage.jsx         # Email/pass + live face scan + risk result
│   │   ├── DashboardPage.jsx     # Profile hero, security ring, login history
│   │   ├── AdminDashboardPage.jsx# Command center: stats, logs, user mgmt
│   │   ├── AdminLoginPage.jsx    # Admin-only login at /quantum-admin
│   │   └── DetectPage.jsx        # Standalone deepfake image detector
│   ├── components/
│   │   └── Navbar.jsx            # Glass navbar with avatar + role badge
│   ├── services/
│   │   └── api.js                # Axios client with JWT interceptor
│   └── App.css                   # Premium dark glassmorphism UI
├── deepfake_detection_model.h5   # Primary deepfake detection model
├── new_xception.h5               # XceptionNet model (used by system)
├── quantumshield.db              # SQLite database (auto-created)
├── requirements.txt              # Python dependencies
├── package.json                  # Node dependencies
└── vite.config.js                # Vite dev server with /api proxy
```

---

## ⚙️ Tech Stack

| Layer       | Technology |
|-------------|------------|
| Frontend    | React 18 + Vite + Axios + react-webcam |
| Styling     | Vanilla CSS (glassmorphism, Inter font, CSS variables) |
| Backend     | Python 3.10+ · Flask 3 · Flask-CORS |
| AI Model    | TensorFlow/Keras · XceptionNet `.h5` (299×299 input) |
| Database    | SQLite 3 (WAL mode, FK constraints) |
| Auth        | JWT (PyJWT) · bcrypt (rounds=12) |
| Face/Vision | OpenCV · NumPy |
| Geocoding   | OpenStreetMap Nominatim (GPS → city/country) |

---

## 🚀 Setup & Running

### Prerequisites
- Python 3.10+
- Node.js 18+
- `.h5` model files in project root (already present)

### 1️⃣ Backend Setup

```bash
cd "c:\Users\DELL\OneDrive\Desktop\QuantumShieldExtension"

# Create virtual environment (recommended)
python -m venv venv
venv\Scripts\activate       # Windows
# source venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Start Flask backend
python api/index.py
# → Running on http://localhost:5000
```

The database (`quantumshield.db`) and admin user are auto-created on first run.

**Default Admin Credentials:**
```
Email:    admin@quantumshield.io
Password: QS@dmin2024!
URL:      http://localhost:5173/quantum-admin
```

### 2️⃣ Frontend Setup

```bash
# In project root (new terminal)
npm install
npm run dev
# → http://localhost:5173
```

---

## 🔌 API Reference

### Auth Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/register` | ❌ | Register with name, email, password, face image |
| POST | `/api/login` | ❌ | Login with credentials + live face, returns risk score |
| POST | `/api/admin/login` | ❌ | Admin-only login |
| GET  | `/api/user/profile` | ✅ JWT | Full user profile + last login + security status |
| GET  | `/api/user/logs` | ✅ JWT | User's own login history |

### Admin Endpoints (require admin JWT)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Dashboard metrics (totals, avg risk, deepfakes) |
| GET | `/api/admin/logs?status=BLOCK` | All login logs (filterable by ALLOW/FLAG/BLOCK) |
| GET | `/api/admin/users` | All registered users |
| GET | `/api/admin/users/<id>/logs` | Per-user login history |
| POST | `/api/admin/users/<id>/block` | Toggle block/unblock user |

### Detect Endpoint

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/detect/image` | Upload image file for deepfake analysis |
| POST | `/api/detect/webcam` | Base64 image for live deepfake check |

### Request/Response Examples

**POST /api/register**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secure123",
  "faceImage": "data:image/jpeg;base64,/9j/...",
  "deviceInfo": { "userAgent": "...", "platform": "Win32" },
  "typingSpeed": 65,
  "coords": { "latitude": 21.14, "longitude": 79.08 }
}
```

**POST /api/login → Response**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "email": "john@example.com",
  "name": "John Doe",
  "role": "user",
  "risk": {
    "device_risk": 0,
    "location_risk": 0,
    "behavior_risk": 5.2,
    "face_risk": 1.4,
    "total_risk": 6.6,
    "decision": "ALLOW",
    "face_verdict": "REAL",
    "face_confidence": 0.97,
    "details": ["✅ Real face verified by AI model (confidence: 97.0%)"]
  }
}
```

---

## 🧠 AI Model Integration

### Deepfake Detection Flow
1. Webcam image (base64 JPEG) is sent from browser
2. Backend decodes and preprocesses: BGR→RGB, resize to `299×299`, normalize `[0,1]`
3. XceptionNet model predicts `[real_prob, fake_prob]` or single score
4. If `fake_prob > 0.5` → **FAKE → BLOCK** registration/login
5. Confidence is clamped to `[0.50, 0.99]` for display

### Risk Engine (0–100 Scale)
```
Total Risk = Device Risk (0–20)
           + Location Risk (0–25)  
           + Behavior Risk (0–30)  [typing speed anomaly]
           + Face AI Risk (0–30)   [deepfake/liveness]
           + Impossible Travel bonus (0–20)

ALLOW: ≤ 30
FLAG:  31–70  (requires OTP)
BLOCK: > 70 OR face_verdict == FAKE
```

### Face Identity Matching
- At **registration**: face image saved to `api/static/uploads/faces/`
- At **login**: live face compared against stored registration image
- Hash comparison + quality score (blur, brightness) as baseline

---

## 📍 Location Anomaly Detection

### Impossible Travel Check (Haversine Algorithm)
```
If two logins occur where:
  distance_km / time_hours > 900 km/h  AND  distance_km > 200 km
→ Flag as impossible travel
→ Risk +20, decision upgraded to FLAG
→ Stored as is_suspicious=1 in login_logs
```

### GPS Resolution (OpenStreetMap Nominatim)
- Browser sends `{ latitude, longitude }` via `navigator.geolocation`
- Backend calls Nominatim reverse geocoding API → real city/state/country
- Falls back to IP-based lookup via `ipapi.co` if GPS not available

---

## 🔐 Security Features

| Feature | Implementation |
|---------|---------------|
| Password hashing | bcrypt (cost factor 12) |
| Tokens | JWT HS256, 24h expiry |
| AI liveness gate | XceptionNet deepfake classification |
| Device fingerprint | SHA-256 of UA + platform + screen + timezone |
| Impossible travel | Haversine distance / time → speed check |
| Replay attack detection | SHA-256 image hash comparison |
| Admin RBAC | `@admin_required` decorator on all admin routes |
| CORS | Whitelist: localhost:5173, localhost:3000 |
| Max upload | 16 MB |

---

## 🧪 Test Cases

### Test 1: Fake Face Detection at Registration
```
1. Open /register
2. Display a printed photo or phone screen to the webcam
3. Submit registration
→ Expected: "Registration rejected: ... AI/Deepfake signature detected"
```

### Test 2: Face Mismatch at Login
```
1. Register user A with their face
2. Login as user A but show user B's face to webcam  
→ Expected: face_risk elevated, possible FLAG/BLOCK decision
```

### Test 3: Normal Login Flow
```
1. Register with real face → navigate to /dashboard
2. Log out → log back in with same face
→ Expected: decision=ALLOW, face_verdict=REAL, risk < 30
```

### Test 4: Admin Block User
```
1. Login as admin at /quantum-admin
2. Go to Users tab → click Block on a user
3. Try to login as that user
→ Expected: "Account has been blocked by administrator"
```

### Test 5: Location Anomaly (Simulated)
```
1. Register from city A (GPS provided)
2. Log in 1 hour later with spoofed GPS coordinates 2000 km away
→ Expected: is_suspicious=1, decision=FLAG, +20 risk points
→ Admin sees ⚠️ Travel badge in logs
```

### Test 6: Admin Per-User History
```
1. Login as admin → go to Users tab
2. Click "📋 History" for any user
→ Expected: modal shows all login events for that user
```

---

## 🎨 UI Pages Overview

| Route | Page | Access |
|-------|------|--------|
| `/register` | 2-step registration: account → face scan | Public |
| `/login` | Email + password + webcam + risk result display | Public |
| `/dashboard` | Profile hero, security ring, login history tabs | User |
| `/detect` | Standalone deepfake image detector | User |
| `/quantum-admin` | Admin login (secret URL) | Public |
| `/admin/dashboard` | Command center: stats, logs, users management | Admin |

---

## 📦 requirements.txt

```
flask==3.1.0
flask-cors==5.0.1
bcrypt==4.2.1
PyJWT==2.10.1
requests==2.32.3
numpy==1.26.4
scikit-learn==1.6.1
tensorflow
Pillow
opencv-python-headless
```

> **Note:** On Windows with GPU, replace `tensorflow` with `tensorflow-gpu` for faster inference.
