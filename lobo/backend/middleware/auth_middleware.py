# middleware/auth_middleware.py
from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity

def auth_required(f):
    """
    Middleware to ensure the request is authenticated.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            return f(user_id, *args, **kwargs)
        except Exception as e:
            return jsonify({"error": "Unauthorized"}), 401
    return decorated_function