import bcrypt
import jwt
import os
import json
from datetime import datetime, timedelta, timezone
from api.database import get_connection

def hash_password(password):
    """Hash a password using bcrypt."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(password, password_hash):
    """Verify a password against its bcrypt hash."""
    return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))

def generate_token(user_id, email, role='user'):
    """Generate a JWT token with 24h expiry. Includes role for RBAC."""
    secret = os.environ.get('JWT_SECRET', 'dev-secret-key-change-in-production')
    payload = {
        'user_id': user_id,
        'email': email,
        'role': role,
        'exp': datetime.now(timezone.utc) + timedelta(hours=24),
        'iat': datetime.now(timezone.utc)
    }
    return jwt.encode(payload, secret, algorithm='HS256')

def register_user(email, password, device_info, location, typing_speed, face_data):
    """Register a new user with all baseline data. Always role='user'."""
    conn = get_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("SELECT id FROM users WHERE email = ?", (email,))
        if cur.fetchone():
            conn.close()
            return None, "Email already registered"
        
        password_hash = hash_password(password)
        
        cur.execute("""
            INSERT INTO users (email, password_hash, role, registered_device, home_city, home_country, 
                             avg_typing_speed, typing_variance, login_count, face_embedding, is_face_verified)
            VALUES (?, ?, 'user', ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            email,
            password_hash,
            json.dumps(device_info) if isinstance(device_info, dict) else str(device_info),
            location.get('city', 'Unknown') if isinstance(location, dict) else 'Unknown',
            location.get('country', 'Unknown') if isinstance(location, dict) else 'Unknown',
            float(typing_speed) if typing_speed else 0.0,
            0.0,
            0,
            face_data or '',
            1 if face_data else 0
        ))
        
        user_id = cur.lastrowid
        conn.commit()
        conn.close()
        
        token = generate_token(user_id, email, 'user')
        return {"user_id": user_id, "token": token, "email": email, "role": "user"}, None
        
    except Exception as e:
        conn.rollback()
        conn.close()
        return None, str(e)

def authenticate_user(email, password):
    """Verify user credentials. Returns user data or None."""
    conn = get_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("""
            SELECT id, email, password_hash, role, is_blocked, registered_device, home_city, home_country,
                   avg_typing_speed, typing_variance, login_count, face_embedding, is_face_verified
            FROM users WHERE email = ?
        """, (email,))
        
        row = cur.fetchone()
        conn.close()
        
        if not row:
            return None, "User not found"
        
        if not verify_password(password, row['password_hash']):
            return None, "Invalid password"
        
        if row['is_blocked']:
            return None, "Account has been blocked by administrator"
        
        user = {
            'id': row['id'],
            'email': row['email'],
            'role': row['role'] or 'user',
            'is_blocked': bool(row['is_blocked']),
            'registered_device': row['registered_device'],
            'home_city': row['home_city'],
            'home_country': row['home_country'],
            'avg_typing_speed': row['avg_typing_speed'],
            'typing_variance': row['typing_variance'],
            'login_count': row['login_count'],
            'face_embedding': row['face_embedding'],
            'is_face_verified': bool(row['is_face_verified'])
        }
        
        return user, None
        
    except Exception as e:
        conn.close()
        return None, str(e)

def authenticate_admin(email, password):
    """Authenticate admin user. Only allows role='admin'."""
    user, error = authenticate_user(email, password)
    if error:
        return None, error
    if user.get('role') != 'admin':
        return None, "Access denied. Admin credentials required."
    return user, None

def update_user_baseline(user_id, typing_speed):
    """Update user typing baseline after successful login."""
    conn = get_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("SELECT avg_typing_speed, typing_variance, login_count FROM users WHERE id = ?", (user_id,))
        row = cur.fetchone()
        
        if row:
            old_avg = row['avg_typing_speed'] or 0.0
            old_var = row['typing_variance'] or 0.0
            count = row['login_count'] or 0
            
            alpha = 0.3
            new_avg = alpha * typing_speed + (1 - alpha) * old_avg if count > 0 else typing_speed
            new_var = alpha * abs(typing_speed - new_avg) + (1 - alpha) * old_var if count > 0 else 0.0
            
            cur.execute("""
                UPDATE users SET avg_typing_speed = ?, typing_variance = ?, login_count = login_count + 1
                WHERE id = ?
            """, (new_avg, new_var, user_id))
            
            conn.commit()
        
        conn.close()
        
    except Exception as e:
        conn.rollback()
        conn.close()
        print(f"[AUTH] Baseline update error: {e}")
