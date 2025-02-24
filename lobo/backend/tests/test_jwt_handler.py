# tests/test_jwt_handler.py
import pytest
from utils.jwt_handler import generate_token, generate_refresh_token

def test_generate_token_success():
    """Test successful JWT token generation."""
    token = generate_token("user123", "admin")
    assert isinstance(token, str)

def test_generate_refresh_token_success():
    """Test successful refresh token generation."""
    refresh_token = generate_refresh_token("user123")
    assert isinstance(refresh_token, str)

def test_generate_token_failure():
    """Test JWT token generation with invalid input."""
    token = generate_token(None, None)
    assert token is None