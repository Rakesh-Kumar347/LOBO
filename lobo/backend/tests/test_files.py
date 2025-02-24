# tests/test_files.py
import pytest
from flask import json

def test_file_upload_success(client):
    """Test successful file upload."""
    with open("test.pdf", "rb") as f:
        response = client.post("/api/files/upload", data={
            "file": (f, "test.pdf")
        })
    assert response.status_code == 200
    assert json.loads(response.data) == {"message": "File uploaded and processed successfully"}

def test_file_upload_invalid_format(client):
    """Test file upload with an invalid format."""
    with open("test.txt", "rb") as f:
        response = client.post("/api/files/upload", data={
            "file": (f, "test.txt")
        })
    assert response.status_code == 400
    assert json.loads(response.data) == {"error": "Invalid or unsupported file format"}

def test_file_upload_no_file(client):
    """Test file upload with no file provided."""
    response = client.post("/api/files/upload")
    assert response.status_code == 400
    assert json.loads(response.data) == {"error": "No file provided"}