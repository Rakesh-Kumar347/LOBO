from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from functools import wraps
from flask import request, jsonify
from utils.database import supabase
import logging

# Initialize limiter with default limits
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100 per minute"]
)

def init_rate_limiter(app):
    """
    Initialize rate limiting for the Flask app.
    """
    limiter.init_app(app)

def get_user_tier_from_token(auth_header):
    """
    Extract user tier from auth token to apply different rate limits.
    """
    if not auth_header or not auth_header.startswith('Bearer '):
        return "guest"
    
    try:
        token = auth_header.split('Bearer ')[1]
        
        # Look up the user and their subscription tier
        # This is a simplified example - in a real app you would decode the JWT
        # and use the user ID to look up their tier in the database
        
        # For now, we'll assume all authenticated users are on the "premium" tier
        return "premium"
        
    except Exception as e:
        logging.error(f"Error extracting user tier: {str(e)}")
        return "guest"

def dynamic_limit():
    """
    Apply different rate limits based on user subscription tier.
    
    Returns:
        str: The rate limit string for the current user.
    """
    auth_header = request.headers.get('Authorization')
    user_tier = get_user_tier_from_token(auth_header)
    
    # Define rate limits by tier
    tier_limits = {
        "guest": "20 per minute;5 per second",
        "standard": "60 per minute;10 per second",
        "premium": "120 per minute;20 per second",
        "enterprise": "1000 per minute;30 per second",
    }
    
    return tier_limits.get(user_tier, tier_limits["guest"])

def tier_limit_decorator(f):
    """
    Decorator to apply tier-specific rate limits to routes.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        user_tier = get_user_tier_from_token(auth_header)
        
        # If route requires subscription but user is guest, reject
        if getattr(f, 'subscription_required', False) and user_tier == "guest":
            return jsonify({
                "success": False,
                "message": "This feature requires a subscription",
                "error_code": "subscription_required"
            }), 403
            
        return f(*args, **kwargs)
    
    return decorated_function

def subscription_required(f):
    """
    Mark a route as requiring a subscription (not accessible to guests).
    """
    f.subscription_required = True
    return f