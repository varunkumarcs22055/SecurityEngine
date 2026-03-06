import json
from flask import Blueprint, request, jsonify
from api.services.auth_service import register_user, authenticate_user, authenticate_admin, generate_token, update_user_baseline
from api.services.device_service import compute_device_hash, get_geolocation, compute_device_risk
from api.services.behavior_service import compute_behavior_score
from api.services.face_service import analyze_face, generate_face_embedding
from api.services.risk_engine import compute_total_risk
from api.utils.helpers import validate_email, validate_password, get_client_ip, jwt_required
from api.database import get_connection

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body is required"}), 400
        
        email = data.get('email', '').strip()
        password = data.get('password', '')
        face_image = data.get('faceImage', '')
        device_info = data.get('deviceInfo', {})
        typing_speed = data.get('typingSpeed', 0)
        
        if not validate_email(email):
            return jsonify({"error": "Invalid email format"}), 400
        if not validate_password(password):
            return jsonify({"error": "Password must be at least 6 characters"}), 400
        
        client_ip = get_client_ip()
        location = get_geolocation(client_ip)
        face_embedding = generate_face_embedding(face_image)
        
        result, error = register_user(
            email=email, password=password, device_info=device_info,
            location=location, typing_speed=float(typing_speed) if typing_speed else 0.0,
            face_data=face_embedding
        )
        
        if error:
            return jsonify({"error": error}), 400
        
        return jsonify({
            "message": "Registration successful",
            "user_id": result['user_id'],
            "token": result['token'],
            "email": result['email'],
            "role": result['role']
        }), 201
    except Exception as e:
        return jsonify({"error": f"Registration failed: {str(e)}"}), 500

@auth_bp.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body is required"}), 400
        
        email = data.get('email', '').strip()
        password = data.get('password', '')
        face_image = data.get('faceImage', '')
        device_info = data.get('deviceInfo', {})
        typing_speed = data.get('typingSpeed', 0)
        
        user, error = authenticate_user(email, password)
        if error:
            return jsonify({"error": error}), 401
        
        client_ip = get_client_ip()
        current_location = get_geolocation(client_ip)
        
        current_device_hash = compute_device_hash(device_info)
        device_result = compute_device_risk(user, current_device_hash, current_location)
        
        device_changed = device_result['device_risk'] > 0
        location_changed = device_result['location_risk'] > 0
        behavior_result = compute_behavior_score(
            user, float(typing_speed) if typing_speed else 0.0,
            device_changed, location_changed
        )
        
        face_result = analyze_face(face_image, user.get('face_embedding', ''))
        risk_result = compute_total_risk(device_result, behavior_result, face_result)
        
        token = generate_token(user['id'], user['email'], user.get('role', 'user'))
        
        if typing_speed:
            update_user_baseline(user['id'], float(typing_speed))
        
        log_login_attempt(
            user_id=user['id'], email=email, ip_address=client_ip,
            device_info=json.dumps(device_info),
            city=current_location.get('city', 'Unknown'),
            country=current_location.get('country', 'Unknown'),
            typing_speed=float(typing_speed) if typing_speed else 0.0,
            risk_result=risk_result,
            face_verdict=face_result.get('face_verdict', ''),
            face_confidence=face_result.get('face_confidence', 0.0)
        )
        
        return jsonify({
            "message": "Authentication complete",
            "token": token,
            "email": user['email'],
            "role": user.get('role', 'user'),
            "risk": {
                "device_risk": risk_result['device_risk'],
                "location_risk": risk_result['location_risk'],
                "behavior_risk": risk_result['behavior_risk'],
                "face_risk": risk_result['face_risk'],
                "total_risk": risk_result['total_risk'],
                "decision": risk_result['decision'],
                "details": risk_result['details'],
                "face_verdict": face_result.get('face_verdict', ''),
                "face_confidence": face_result.get('face_confidence', 0.0)
            }
        }), 200
    except Exception as e:
        return jsonify({"error": f"Login failed: {str(e)}"}), 500


@auth_bp.route('/api/admin/login', methods=['POST'])
def admin_login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body is required"}), 400
        
        email = data.get('email', '').strip()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400
        
        user, error = authenticate_admin(email, password)
        if error:
            return jsonify({"error": error}), 401
        
        token = generate_token(user['id'], user['email'], 'admin')
        
        return jsonify({
            "message": "Admin authentication successful",
            "token": token,
            "email": user['email'],
            "role": "admin"
        }), 200
    except Exception as e:
        return jsonify({"error": f"Admin login failed: {str(e)}"}), 500


@auth_bp.route('/api/user/logs', methods=['GET'])
@jwt_required
def get_user_logs():
    try:
        conn = get_connection()
        cur = conn.cursor()
        limit = int(request.args.get('limit', 20))
        
        cur.execute("""
            SELECT id, email, ip_address, city, country, device_risk, location_risk,
                   behavior_risk, face_risk, total_risk, decision, face_verdict, 
                   face_confidence, timestamp
            FROM login_logs
            WHERE user_id = ?
            ORDER BY timestamp DESC
            LIMIT ?
        """, (request.user_id, limit))
        
        rows = cur.fetchall()
        conn.close()
        
        logs = [{
            'id': r['id'], 'email': r['email'], 'ip_address': r['ip_address'],
            'city': r['city'], 'country': r['country'],
            'device_risk': r['device_risk'], 'location_risk': r['location_risk'],
            'behavior_risk': r['behavior_risk'], 'face_risk': r['face_risk'],
            'total_risk': r['total_risk'], 'decision': r['decision'],
            'face_verdict': r['face_verdict'], 'face_confidence': r['face_confidence'],
            'timestamp': r['timestamp']
        } for r in rows]
        
        return jsonify({'logs': logs}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to fetch logs: {str(e)}"}), 500


def log_login_attempt(user_id, email, ip_address, device_info, city, country, typing_speed, risk_result, face_verdict='', face_confidence=0.0):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO login_logs 
            (user_id, email, ip_address, device_info, city, country, typing_speed,
             device_risk, location_risk, behavior_risk, face_risk, total_risk, decision,
             face_verdict, face_confidence)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user_id, email, ip_address, device_info, city, country, typing_speed,
            risk_result['device_risk'], risk_result['location_risk'],
            risk_result['behavior_risk'], risk_result['face_risk'],
            risk_result['total_risk'], risk_result['decision'],
            face_verdict, face_confidence
        ))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"[LOG] Failed to log login attempt: {e}")
