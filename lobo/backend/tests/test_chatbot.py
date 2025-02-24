# tests/test_chatbot.py
import pytest
from flask import json

def test_chatbot_response_success(client):
    """Test successful chatbot response."""
    response = client.post("/api/chatbot", json={
        "message": "Hello, chatbot!"
    })
    assert response.status_code == 200
    assert "response" in json.loads(response.data)

def test_chatbot_empty_message(client):
    """Test chatbot with an empty message."""
    response = client.post("/api/chatbot", json={
        "message": ""
    })
    assert response.status_code == 400
    assert json.loads(response.data) == {"error": "Message cannot be empty"}

def test_chatbot_long_message(client):
    """Test chatbot with a message exceeding the max length."""
    long_message = "a" * 1001  # Assuming MAX_INPUT_LENGTH is 1000
    response = client.post("/api/chatbot", json={
        "message": long_message
    })
    assert response.status_code == 400
    assert json.loads(response.data) == {"error": "Message exceeds 1000 characters"}