# File: lobo/backend/middleware/auth_middleware.py
# Enhancement: Improved JWT verification and token rotation

from functools import wraps
from flask import request, jsonify
import jwt
import requests
import json
from config import Config
import logging
import redis
import time
from datetime import datetime, timedelta
import os

# Initialize Redis for token blacklisting
redis_client = redis.Redis(
    host=os.getenv("REDIS_HOST", "localhost"),
    port=int(os.getenv("REDIS_PORT", 6379)),
    db=0,
    decode_responses=True
)

# Cache for JWK
jwk_cache = None
jwk_cache_time = 0

def get_supabase_jwt_key():
    """Fetch the Supabase JWT verification key with improved caching."""
    global jwk_cache, jwk_cache_time
    
    current_time = time.time()
    # Use cached key if less than 1 hour old
    if jwk_cache and current_time - jwk_cache_time < 3600:
        return jwk_cache
    
    try:
        jwk_url = f"{Config.SUPABASE_URL}/auth/v1/jwks"
        response = requests.get(jwk_url, timeout=5)  # Added timeout
        response.raise_for_status()
        jwk_cache = response.json()
        jwk_cache_time = current_time
        return jwk_cache
    except Exception as e:
        logging.error(f"Error fetching Supabase JWT key: {e}")
        return None

def is_token_blacklisted(token):
    """Check if token is blacklisted in Redis."""
    return redis_client.exists(f"blacklisted_token:{token}")

def blacklist_token(token, expires_in):
    """Add token to blacklist with expiration."""
    redis_client.setex(f"blacklisted_token:{token}", expires_in, "1")

def rotate_token(user_id):
    """Generate a new token for the user with extended expiration."""
    from utils.jwt_handler import generate_token
    
    new_token = generate_token(user_id)
    return new_token

def auth_required(f):
    """
    Enhanced middleware to verify Supabase JWT tokens with additional security checks.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return jsonify({"success": False, "message": "Missing or invalid authorization header"}), 401
            
            token = auth_header.split('Bearer ')[1]
            
            # Check if token is blacklisted
            if is_token_blacklisted(token):
                return jsonify({"success": False, "message": "Token has been revoked"}), 401
            
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
            
            # Decode and verify the token with comprehensive options
            payload = jwt.decode(
                token,
                key,
                algorithms=["RS256"],
                audience=Config.SUPABASE_URL.replace('https://', ''),
                options={
                    "verify_signature": True,
                    "verify_exp": True,
                    "verify_nbf": True,
                    "verify_iat": True,
                    "verify_aud": True,
                    "require": ["exp", "sub", "aud"]
                }
            )
            
            # Get user ID from the token
            user_id = payload.get("sub")
            if not user_id:
                return jsonify({"success": False, "message": "Invalid token"}), 401
            
            # Check token expiration and rotate if needed
            if "exp" in payload:
                expiration_time = datetime.fromtimestamp(payload["exp"])
                current_time = datetime.now()
                
                # If token is close to expiration (less than 5 minutes), issue a new token
                if expiration_time - current_time < timedelta(minutes=5):
                    new_token = rotate_token(user_id)
                    response = f(*args, **kwargs)
                    
                    # If response is a tuple (JsonResponse, status_code)
                    if isinstance(response, tuple):
                        json_response, status_code = response
                        # Add the new token to the response
                        if isinstance(json_response, dict):
                            json_response["new_token"] = new_token
                        return jsonify(json_response), status_code
                    
                    # If response is just a JsonResponse
                    json_response = response
                    if isinstance(json_response, dict):
                        json_response["new_token"] = new_token
                    return jsonify(json_response)
            
            return f(user_id, *args, **kwargs)
            
        except jwt.ExpiredSignatureError:
            return jsonify({"success": False, "message": "Token expired"}), 401
        except jwt.InvalidTokenError as e:
            return jsonify({"success": False, "message": f"Invalid token: {str(e)}"}), 401
        except Exception as e:
            logging.error(f"Auth error: {str(e)}")
            return jsonify({"success": False, "message": "Authentication failed"}), 401
    return decorated_function

def admin_required(f):
    """
    Middleware to verify the user is an admin.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return jsonify({"success": False, "message": "Missing or invalid authorization header"}), 401
            
            token = auth_header.split('Bearer ')[1]
            
            # First verify the token is valid
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
            
            # Check if user is admin
            from utils.database import supabase
            user_response = supabase.table("profiles") \
                .select("is_admin") \
                .eq("id", user_id) \
                .single() \
                .execute()
                
            if user_response.error:
                return jsonify({"success": False, "message": "Failed to verify user role"}), 500
                
            if not user_response.data or not user_response.data.get("is_admin"):
                return jsonify({"success": False, "message": "Admin access required"}), 403
                
            return f(user_id, *args, **kwargs)
            
        except jwt.ExpiredSignatureError:
            return jsonify({"success": False, "message": "Token expired"}), 401
        except jwt.InvalidTokenError as e:
            return jsonify({"success": False, "message": f"Invalid token: {str(e)}"}), 401
        except Exception as e:
            logging.error(f"Auth error: {str(e)}")
            return jsonify({"success": False, "message": "Authentication failed"}), 401
    return decorated_function