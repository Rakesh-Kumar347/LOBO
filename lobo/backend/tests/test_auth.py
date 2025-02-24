# tests/test_auth.py
import pytest
from flask import json

def test_signup_success(client):
    """Test successful user signup."""
    response = client.post("/api/auth/signup", json={
        "email": "test@example.com",
        "password": "testpassword",
        "full_name": "Test User"
    })
    assert response.status_code == 201
    assert json.loads(response.data) == {"success": True, "message": "User registered successfully!"}

def test_signup_missing_fields(client):
    """Test signup with missing fields."""
    response = client.post("/api/auth/signup", json={
        "email": "test@example.com"
    })
    assert response.status_code == 400
    assert json.loads(response.data) == {"error": "Missing required fields"}

def test_signup_existing_user(client):
    """Test signup with an existing email."""
    client.post("/api/auth/signup", json={
        "email": "test@example.com",
        "password": "testpassword",
        "full_name": "Test User"
    })
    response = client.post("/api/auth/signup", json={
        "email": "test@example.com",
        "password": "testpassword",
        "full_name": "Test User"
    })
    assert response.status_code == 400
    assert json.loads(response.data) == {"error": "Username already exists."}