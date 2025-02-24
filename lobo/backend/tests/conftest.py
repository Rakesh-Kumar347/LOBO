# tests/conftest.py
import pytest
from flask import Flask
from app import app as flask_app

@pytest.fixture
def app():
    """Fixture to provide a Flask app instance for testing."""
    flask_app.config.update({
        "TESTING": True,
    })
    yield flask_app

@pytest.fixture
def client(app):
    """Fixture to provide a test client for making requests."""
    return app.test_client()