import logging
from typing import Optional
from flask_jwt_extended import create_access_token, create_refresh_token, verify_jwt_in_request, get_jwt_identity
from datetime import timedelta
from config import Config

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

def generate_token(user_id: str, role: str = "user") -> Optional[str]:
    """
    Generates a JWT access token for authentication.

    Args:
        user_id (str): Unique user identifier.
        role (str): User role (default: "user").

    Returns:
        Optional[str]: JWT access token, or None if an error occurs.
    """
    try:
        expires_delta = timedelta(minutes=Config.JWT_EXPIRATION_MINUTES)
        token = create_access_token(identity={"user_id": user_id, "role": role}, expires_delta=expires_delta)
        logging.info(f"Generated access token for user {user_id} with role {role}")
        return token
    except Exception as e:
        logging.error(f"JWT Token Generation Error: {str(e)}")
        return None

def generate_refresh_token(user_id: str) -> Optional[str]:
    """
    Generates a JWT refresh token for session extension.

    Args:
        user_id (str): Unique user identifier.

    Returns:
        Optional[str]: JWT refresh token, or None if an error occurs.
    """
    try:
        refresh_token = create_refresh_token(identity=user_id)
        logging.info(f"Generated refresh token for user {user_id}")
        return refresh_token
    except Exception as e:
        logging.error(f"JWT Refresh Token Generation Error: {str(e)}")
        return None

def validate_token() -> Optional[str]:
    """
    Validates a JWT token and returns the user identity.

    Returns:
        Optional[str]: User ID if the token is valid, or None if an error occurs.
    """
    try:
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        return user_id
    except Exception as e:
        logging.error(f"Token Validation Error: {str(e)}")
        return None