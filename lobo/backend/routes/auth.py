from flask import Blueprint, request, jsonify
from utils.database import supabase
from werkzeug.security import generate_password_hash
import uuid
from datetime import datetime
import re
import logging

# Configure logging
logging.basicConfig(level=logging.ERROR, format="%(asctime)s - %(levelname)s - %(message)s")

auth_bp = Blueprint("auth", __name__)

def is_valid_email(email: str) -> bool:
    """Validates the email format."""
    return bool(re.match(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$", email))

def is_valid_password(password: str) -> bool:
    """Validates the password strength."""
    return len(password) >= 8

@auth_bp.route("/auth/signup", methods=["POST"])
def signup():
    """
    Handles user registration.

    Request Body:
        - email (str): User's email address.
        - password (str): User's password.
        - full_name (str): User's full name.

    Returns:
        JSON response with success/error message.
    """
    try:
        data = request.json
        email = data.get("email")
        password = data.get("password")
        full_name = data.get("full_name")

        # Validate required fields
        if not email or not password or not full_name:
            return jsonify({"success": False, "message": "Missing required fields"}), 400

        # Validate email and password
        if not is_valid_email(email):
            return jsonify({"success": False, "message": "Invalid email format"}), 400
        if not is_valid_password(password):
            return jsonify({"success": False, "message": "Password must be at least 8 characters"}), 400

        # Hash password before saving
        hashed_password = generate_password_hash(password)

        # Generate a unique user ID
        user_id = str(uuid.uuid4())

        # Insert user into Supabase
        response = supabase.table("users").insert({
            "id": user_id,
            "email": email,
            "password": hashed_password,
            "full_name": full_name,
            "created_at": datetime.utcnow().isoformat()
        }).execute()

        if response.get("error"):
            logging.error(f"Supabase error during signup: {response['error']['message']}")
            return jsonify({"success": False, "message": response["error"]["message"]}), 500

        return jsonify({"success": True, "message": "User registered successfully!"}), 201

    except Exception as e:
        logging.error(f"Error during signup: {str(e)}")
        return jsonify({"success": False, "message": "An error occurred during signup"}), 500