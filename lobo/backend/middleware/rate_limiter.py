# File: lobo/backend/middleware/rate_limiter.py
# Enhancement: Advanced rate limiting with user tiers, flexible limits, and IP tracking

from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from functools import wraps
from flask import request, jsonify, g
from utils.database import supabase
import logging
import redis
import json
import time
import hashlib
import os

# Initialize Redis for rate limit tracking
redis_client = redis.Redis(
    host=os.getenv("REDIS_HOST", "localhost"),
    port=int(os.getenv("REDIS_PORT", 6379)),
    db=1,
    decode_responses=True
)

# Define rate limit tiers with granular limits
TIER_LIMITS = {
    "free": {
        "default": "30 per minute;5 per second",
        "chatbot": "20 per minute;3 per second", 
        "files": "10 per minute;5 per hour",
        "analytics": "5 per minute;50 per day"
    },
    "standard": {
        "default": "100 per minute;10 per second",
        "chatbot": "60 per minute;5 per second",
        "files": "30 per minute;50 per hour",
        "analytics": "20 per minute;200 per day"
    },
    "premium": {
        "default": "200 per minute;20 per second",
        "chatbot": "120 per minute;10 per second",
        "files": "60 per minute;300 per hour",
        "analytics": "30 per minute;unlimited"
    },
    "enterprise": {
        "default": "1000 per minute;50 per second",
        "chatbot": "500 per minute;30 per second",
        "files": "100 per minute;unlimited",
        "analytics": "100 per minute;unlimited"
    }
}

# Initialize limiter with default limits
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["50 per minute"],
    storage_uri=f"redis://{os.getenv('REDIS_HOST', 'localhost')}:{os.getenv('REDIS_PORT', '6379')}/1"
)

def init_rate_limiter(app):
    """
    Initialize rate limiting for the Flask app with enhanced configuration.
    """
    limiter.init_app(app)
    
    # Configure global error handler for rate limiting
    @app.errorhandler(429)
    def ratelimit_handler(e):
        reset_time = int(getattr(e, 'reset_time', time.time() + 60))
        reset_seconds = reset_time - int(time.time())
        
        return jsonify({
            "success": False,
            "message": "Rate limit exceeded",
            "error_code": "rate_limit_exceeded",
            "retry_after": reset_seconds
        }), 429, {
            'Retry-After': str(reset_seconds),
            'X-RateLimit-Reset': str(reset_time)
        }

def extract_jwt_payload(auth_header):
    """Extract payload from JWT token without verification (for rate limiting only)."""
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    
    try:
        token = auth_header.split('Bearer ')[1]
        # Split the token and get the payload part (second part)
        payload_b64 = token.split('.')[1]
        
        # Add padding if needed
        padding = 4 - (len(payload_b64) % 4)
        if padding:
            payload_b64 += '=' * padding
            
        # Decode base64
        import base64
        payload_json = base64.b64decode(payload_b64)
        payload = json.loads(payload_json)
        
        return payload
    except Exception as e:
        logging.error(f"Error extracting JWT payload: {str(e)}")
        return None

def get_user_tier_from_token(auth_header):
    """
    Extract user tier from auth token with caching for better performance.
    """
    if not auth_header or not auth_header.startswith('Bearer '):
        return "guest"
    
    try:
        # Extract user ID from token
        payload = extract_jwt_payload(auth_header)
        if not payload or "sub" not in payload:
            return "guest"
            
        user_id = payload["sub"]
        
        # Check cache in Redis first
        cache_key = f"user_tier:{user_id}"
        cached_tier = redis_client.get(cache_key)
        
        if cached_tier:
            return cached_tier
        
        # Fetch tier from database if not in cache
        response = supabase.table("subscriptions") \
            .select("tier") \
            .eq("user_id", user_id) \
            .eq("status", "active") \
            .limit(1) \
            .execute()
            
        if response.error:
            logging.error(f"Error fetching subscription: {response.error}")
            return "free"
            
        if not response.data:
            # Cache default tier with expiration
            redis_client.setex(cache_key, 3600, "free")  # Cache for 1 hour
            return "free"
            
        user_tier = response.data[0].get("tier", "free")
        
        # Cache tier with expiration
        redis_client.setex(cache_key, 3600, user_tier)  # Cache for 1 hour
        
        return user_tier
        
    except Exception as e:
        logging.error(f"Error extracting user tier: {str(e)}")
        return "guest"

def dynamic_limit(endpoint_type="default"):
    """
    Apply different rate limits based on user subscription tier and endpoint type.
    
    Args:
        endpoint_type (str): Type of endpoint (chatbot, files, analytics, etc.)
        
    Returns:
        str: The rate limit string for the current user.
    """
    auth_header = request.headers.get('Authorization')
    user_tier = get_user_tier_from_token(auth_header)
    
    # Store tier in Flask g object for current request
    g.user_tier = user_tier
    
    # Get tier limits for the endpoint type
    tier_config = TIER_LIMITS.get(user_tier, TIER_LIMITS["free"])
    if endpoint_type in tier_config:
        return tier_config[endpoint_type]
    
    return tier_config["default"]

def get_rate_limit_key():
    """
    Generate a key for rate limiting based on user ID or IP address.
    This prevents users from circumventing limits by changing IPs.
    """
    auth_header = request.headers.get('Authorization')
    
    if auth_header and auth_header.startswith('Bearer '):
        # Use user ID from token for authenticated users
        payload = extract_jwt_payload(auth_header)
        if payload and "sub" in payload:
            return f"user:{payload['sub']}"
    
    # For unauthenticated requests, use a mix of IP and user agent
    ip = get_remote_address()
    user_agent = request.headers.get('User-Agent', '')
    
    # Create a unique identifier that's difficult to spoof
    identifier = f"{ip}:{user_agent}"
    hashed = hashlib.md5(identifier.encode()).hexdigest()
    
    return f"ip:{hashed}"

# Custom key function for rate limiter
def get_custom_limit_key():
    """Custom key function for Flask-Limiter that uses our custom key logic."""
    return get_rate_limit_key()

def tier_limit_decorator(endpoint_type="default"):
    """
    Decorator to apply tier-specific rate limits to routes.
    
    Args:
        endpoint_type (str): Type of endpoint (chatbot, files, analytics, etc.)
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            auth_header = request.headers.get('Authorization')
            user_tier = get_user_tier_from_token(auth_header)
            
            # Store user tier in request context
            g.user_tier = user_tier
            
            # If route requires subscription but user is guest, reject
            if getattr(f, 'subscription_required', False) and user_tier == "guest":
                return jsonify({
                    "success": False,
                    "message": "This feature requires a subscription",
                    "error_code": "subscription_required"
                }), 403
                
            # Apply rate limit dynamically
            limit = dynamic_limit(endpoint_type)
            
            # Use Flask-Limiter's decorator
            limited_func = limiter.limit(
                limit,
                key_func=get_custom_limit_key
            )(f)
            
            return limited_func(*args, **kwargs)
        
        return decorated_function
    
    return decorator

def subscription_required(f):
    """
    Mark a route as requiring a subscription (not accessible to guests).
    """
    f.subscription_required = True
    return f

def enterprise_only(f):
    """
    Mark a route as requiring an enterprise subscription.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        user_tier = get_user_tier_from_token(auth_header)
        
        if user_tier != "enterprise":
            return jsonify({
                "success": False,
                "message": "This feature requires an enterprise subscription",
                "error_code": "enterprise_required"
            }), 403
            
        return f(*args, **kwargs)
    
    return decorated_function

def track_api_usage(user_id, endpoint, method):
    """
    Track API usage for analytics and quota management.
    """
    if not user_id:
        return
        
    try:
        # Get current timestamp
        timestamp = int(time.time())
        date_key = time.strftime("%Y-%m-%d", time.localtime(timestamp))
        
        # Update daily usage counter
        daily_key = f"usage:{user_id}:{date_key}"
        redis_client.hincrby(daily_key, endpoint, 1)
        redis_client.expire(daily_key, 86400 * 7)  # Keep for 7 days
        
        # Update monthly usage counter
        month_key = time.strftime("%Y-%m", time.localtime(timestamp))
        monthly_key = f"usage:{user_id}:{month_key}"
        redis_client.hincrby(monthly_key, endpoint, 1)
        redis_client.expire(monthly_key, 86400 * 32)  # Keep for ~1 month
        
        # Periodically save to database (e.g., every 10 requests)
        count = redis_client.hincrby(f"usage_flush:{user_id}", "count", 1)
        if count >= 10:
            # Reset counter
            redis_client.delete(f"usage_flush:{user_id}")
            
            # This would typically be done asynchronously
            from utils.database import supabase
            
            # Get current usage data from Redis
            daily_usage = redis_client.hgetall(daily_key)
            
            # Update usage in database
            supabase.table("api_usage").upsert({
                "user_id": user_id,
                "date": date_key,
                "usage": daily_usage,
                "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            }).execute()
            
    except Exception as e:
        logging.error(f"Error tracking API usage: {str(e)}")

def usage_tracking(f):
    """
    Decorator to track API usage for analytics and quota management.
    """
    @wraps(f)
    def decorated_function(user_id, *args, **kwargs):
        # Record API usage
        endpoint = request.path
        method = request.method
        
        track_api_usage(user_id, endpoint, method)
        
        return f(user_id, *args, **kwargs)
    
    return decorated_function