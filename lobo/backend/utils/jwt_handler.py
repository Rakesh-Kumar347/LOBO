from flask_jwt_extended import create_access_token, get_jwt_identity
from datetime import timedelta

def generate_token(user_id):
    """
    Generates a JWT access token for authentication.
    """
    return create_access_token(identity=user_id, expires_delta=timedelta(days=1))
