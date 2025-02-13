from flask_jwt_extended import create_access_token
from datetime import timedelta

def generate_token(user_id):
    """Generates a JWT access token for authentication."""
    return create_access_token(identity=user_id, expires_delta=timedelta(minutes=30))
