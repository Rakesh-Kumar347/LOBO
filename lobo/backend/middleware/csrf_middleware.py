from functools import wraps
from flask import request, jsonify, session
import secrets
from datetime import datetime, timedelta

def generate_csrf_token():
    """Generate a secure CSRF token."""
    return secrets.token_hex(32)

def set_csrf_token():
    """Set a new CSRF token in the session."""
    token = generate_csrf_token()
    session['csrf_token'] = token
    session['csrf_expiry'] = (datetime.now() + timedelta(hours=1)).isoformat()
    return token

def get_csrf_token():
    """Get the current CSRF token or generate a new one."""
    if 'csrf_token' not in session or 'csrf_expiry' not in session or \
       datetime.now() > datetime.fromisoformat(session['csrf_expiry']):
        return set_csrf_token()
    return session['csrf_token']

def csrf_protect(f):
    """
    Middleware to validate CSRF token for non-GET requests.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Skip CSRF check for GET, HEAD, OPTIONS methods
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return f(*args, **kwargs)
        
        # Get token from request header
        token = request.headers.get('X-CSRF-Token')
        
        # Verify token
        if 'csrf_token' not in session or not token or session['csrf_token'] != token:
            return jsonify({
                "success": False, 
                "message": "Invalid or missing CSRF token", 
                "error_code": "csrf_error"
            }), 403
            
        return f(*args, **kwargs)
    return decorated_function