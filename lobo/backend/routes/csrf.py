from flask import Blueprint, jsonify
from middleware.csrf_middleware import get_csrf_token

csrf_bp = Blueprint("csrf", __name__)

@csrf_bp.route("/", methods=["GET"])
def get_token():
    """
    Get CSRF token endpoint.
    
    Returns:
        JSON with CSRF token
    """
    token = get_csrf_token()
    
    return jsonify({
        "success": True,
        "csrfToken": token
    })