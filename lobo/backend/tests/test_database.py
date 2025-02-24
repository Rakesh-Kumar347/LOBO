# tests/test_database.py
import pytest
from utils.database import execute_query, insert_data

def test_execute_query_success():
    """Test successful database query execution."""
    result = execute_query("users", select="*")
    assert isinstance(result, list)

def test_insert_data_success():
    """Test successful data insertion."""
    data = {"email": "test@example.com", "password": "testpassword", "full_name": "Test User"}
    result = insert_data("users", data)
    assert isinstance(result, list)
    assert result[0]["email"] == "test@example.com"

def test_execute_query_failure():
    """Test database query execution with an invalid table."""
    result = execute_query("invalid_table", select="*")
    assert result is None