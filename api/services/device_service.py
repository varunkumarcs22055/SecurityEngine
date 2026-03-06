import hashlib
import json
import requests
import os

def compute_device_hash(device_info):
    """Generate SHA-256 hash from device metadata for fingerprinting."""
    if isinstance(device_info, str):
        try:
            device_info = json.loads(device_info)
        except (json.JSONDecodeError, TypeError):
            device_info = {"raw": device_info}
    
    # Combine browser, OS, screen resolution into a fingerprint string
    fingerprint = '|'.join([
        str(device_info.get('userAgent', '')),
        str(device_info.get('platform', '')),
        str(device_info.get('screenResolution', '')),
        str(device_info.get('language', '')),
        str(device_info.get('timezone', ''))
    ])
    
    return hashlib.sha256(fingerprint.encode('utf-8')).hexdigest()

def get_geolocation(ip_address):
    """Get geolocation data from IP address using ipapi.co API."""
    geo_url = os.environ.get('GEO_API_URL', 'https://ipapi.co')
    
    # Skip for localhost / private IPs
    if ip_address in ('127.0.0.1', 'localhost', '::1', '') or ip_address.startswith('192.168.') or ip_address.startswith('10.'):
        return {
            'city': 'Local',
            'country': 'Local',
            'ip': ip_address
        }
    
    try:
        response = requests.get(
            f"{geo_url}/{ip_address}/json/",
            timeout=5,
            headers={'User-Agent': 'TruthShield/1.0'}
        )
        
        if response.status_code == 200:
            data = response.json()
            return {
                'city': data.get('city', 'Unknown'),
                'country': data.get('country_name', 'Unknown'),
                'ip': ip_address
            }
    except Exception as e:
        print(f"[GEO] Geolocation API error: {e}")
    
    return {'city': 'Unknown', 'country': 'Unknown', 'ip': ip_address}

def compute_device_risk(user, current_device_hash, current_location):
    """
    Compute device + location risk score (0-40).
    Rules:
      - New device: +20
      - New city: +15
      - New country: +25
      - Max: 40
    """
    risk = 0
    details = []
    
    # Parse stored device hash
    registered_device = user.get('registered_device', '')
    if isinstance(registered_device, str):
        try:
            registered_device_data = json.loads(registered_device)
            stored_hash = compute_device_hash(registered_device_data)
        except (json.JSONDecodeError, TypeError):
            stored_hash = registered_device
    else:
        stored_hash = compute_device_hash(registered_device)
    
    # Device comparison
    if stored_hash and current_device_hash != stored_hash:
        risk += 20
        details.append("New device detected (+20)")
    
    # Location comparison
    home_city = user.get('home_city', 'Unknown')
    home_country = user.get('home_country', 'Unknown')
    current_city = current_location.get('city', 'Unknown')
    current_country = current_location.get('country', 'Unknown')
    
    if home_country != 'Unknown' and current_country != 'Unknown':
        if current_country != home_country and home_country != 'Local':
            risk += 25
            details.append(f"New country: {current_country} vs {home_country} (+25)")
        elif current_city != home_city and home_city != 'Local':
            risk += 15
            details.append(f"New city: {current_city} vs {home_city} (+15)")
    
    # Cap at 40
    total = min(risk, 40)
    
    # Split into device_risk and location_risk for granular reporting
    device_risk = 20 if (stored_hash and current_device_hash != stored_hash) else 0
    location_risk = total - device_risk
    
    return {
        'device_risk': min(device_risk, 20),
        'location_risk': min(max(location_risk, 0), 25),
        'combined': total,
        'details': details
    }
