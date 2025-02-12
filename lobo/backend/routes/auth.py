from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import datetime

auth_bp = Blueprint("auth", __name__)

# Mock user database
users = {"testuser": "password123"}

# ✅ Login Route
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    if username in users and users[username] == password:
        access_token = create_access_token(identity=username)
        return jsonify(access_token=access_token), 200
    return jsonify({"error": "Invalid credentials"}), 401

# ✅ Protected Route (Check Session)
@auth_bp.route("/check-session", methods=["GET"])
@jwt_required()
def check_session():
    return jsonify({"message": "Session is valid", "user": get_jwt_identity()}), 200
