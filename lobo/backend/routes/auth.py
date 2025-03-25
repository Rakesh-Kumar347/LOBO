# File: lobo/backend/routes/auth.py
# Enhancement: Add OpenAPI documentation annotations

from flask import Blueprint, request, jsonify
from utils.database import supabase
from werkzeug.security import generate_password_hash
import uuid
from datetime import datetime
import re
import logging
from schemas.auth_schemas import (
    LoginRequestSchema, LoginResponseSchema,
    SignupRequestSchema, SignupResponseSchema,
    RefreshTokenRequestSchema, RefreshTokenResponseSchema
)

# Configure logging
logging.basicConfig(level=logging.ERROR, format="%(asctime)s - %(levelname)s - %(message)s")

auth_bp = Blueprint("auth", __name__)

def is_valid_email(email: str) -> bool:
    """Validates the email format."""
    return bool(re.match(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$", email))

def is_valid_password(password: str) -> bool:
    """Validates the password strength."""
    return len(password) >= 8

@auth_bp.route("/signup", methods=["POST"])
def signup():
    """
    Register a new user.
    ---
    post:
      summary: User registration
      description: Register a new user with email, password and full name
      requestBody:
        required: true
        content:
          application/json:
            schema: SignupRequestSchema
      responses:
        201:
          description: User successfully registered
          content:
            application/json:
              schema: SignupResponseSchema
        400:
          description: Invalid input
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: false
                  message:
                    type: string
                    example: Missing required fields
        500:
          description: Server error
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                    example: false
                  message:
                    type: string
                    example: An error occurred during signup
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

        if response.error:
            logging.error(f"Supabase error during signup: {response.error}")
            return jsonify({"success": False, "message": response.error}), 500

        return jsonify({
            "success": True, 
            "message": "User registered successfully!",
            "user_id": user_id
        }), 201

    except Exception as e:
        logging.error(f"Error during signup: {str(e)}")
        return jsonify({"success": False, "message": "An error occurred during signup"}), 500