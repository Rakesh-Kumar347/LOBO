from functools import wraps
from flask import request, jsonify
import jwt
import requests
import json
from config import Config
import logging

# Cache for JWK
jwk_cache = None
jwk_cache_time = 0

def get_supabase_jwt_key():
    """Fetch the Supabase JWT verification key."""
    global jwk_cache, jwk_cache_time
    import time
    
    current_time = time.time()
    # Use cached key if less than 1 hour old
    if jwk_cache and current_time - jwk_cache_time < 3600:
        return jwk_cache
    
    try:
        jwk_url = f"{Config.SUPABASE_URL}/auth/v1/jwks"
        response = requests.get(jwk_url)
        response.raise_for_status()
        jwk_cache = response.json()
        jwk_cache_time = current_time
        return jwk_cache
    except Exception as e:
        logging.error(f"Error fetching Supabase JWT key: {e}")
        return None

def auth_required(f):
    """
    Middleware to verify Supabase JWT tokens.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return jsonify({"success": False, "message": "Missing or invalid authorization header"}), 401
            
            token = auth_header.split('Bearer ')[1]
            
            # Add debug output
            print(f"Authenticating with token: {token[:10]}...")
            
            # Verify token using Supabase's JWK
            jwks = get_supabase_jwt_key()
            if not jwks:
                return jsonify({"success": False, "message": "Failed to verify token"}), 401
            
            # Parse the token header to get the key ID
            header = jwt.get_unverified_header(token)
            kid = header.get('kid')
            
            # Find the matching JWK
            key = None
            for jwk in jwks['keys']:
                if jwk.get('kid') == kid:
                    key = jwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(jwk))
                    break
            
            if not key:
                return jsonify({"success": False, "message": "Invalid token signature"}), 401
            
            # Decode and verify the token
            payload = jwt.decode(
                token,
                key,
                algorithms=["RS256"],
                audience=Config.SUPABASE_URL.replace('https://', ''),
                options={"verify_signature": True}
            )
            
            # Get user ID from the token
            user_id = payload.get("sub")
            if not user_id:
                return jsonify({"success": False, "message": "Invalid token"}), 401
                
            print(f"Authenticated user: {user_id}")
            return f(user_id, *args, **kwargs)
        except jwt.ExpiredSignatureError:
            return jsonify({"success": False, "message": "Token expired"}), 401
        except jwt.InvalidTokenError as e:
            return jsonify({"success": False, "message": f"Invalid token: {str(e)}"}), 401
        except Exception as e:
            logging.error(f"Auth error: {str(e)}")
            return jsonify({"success": False, "message": "Authentication failed"}), 401
    return decorated_function