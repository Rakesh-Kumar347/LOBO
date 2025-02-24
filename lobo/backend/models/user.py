import logging
from typing import Dict, Optional
from werkzeug.security import generate_password_hash, check_password_hash
from utils.database import users_collection

# Configure logging
logging.basicConfig(level=logging.ERROR, format="%(asctime)s - %(levelname)s - %(message)s")

class User:
    """Handles user authentication and management.

    Methods:
        create_user: Creates a new user with a hashed password.
        verify_user: Verifies user credentials.
    """

    @staticmethod
    def create_user(username: str, password: str) -> Dict[str, str]:
        """
        Creates a new user with a hashed password.

        Args:
            username (str): The desired username.
            password (str): The plaintext password.

        Returns:
            Dict[str, str]: A dictionary with success or error message.
        """
        try:
            # Validate input
            if len(username) < 3 or len(password) < 8:
                return {"success": False, "message": "Username must be at least 3 characters and password at least 8 characters."}

            # Check if user already exists
            if users_collection.find_one({"username": username}):
                return {"success": False, "message": "Username already exists."}

            # Hash password and create user
            hashed_password = generate_password_hash(password)
            users_collection.insert_one({"username": username, "password": hashed_password})
            return {"success": True, "message": "User created successfully."}

        except Exception as e:
            logging.error(f"Error creating user '{username}': {str(e)}")
            return {"success": False, "message": "An error occurred while creating the user."}

    @staticmethod
    def verify_user(username: str, password: str) -> Dict[str, str]:
        """
        Verifies user credentials.

        Args:
            username (str): The username.
            password (str): The plaintext password.

        Returns:
            Dict[str, str]: A dictionary with verification status.
        """
        try:
            user = users_collection.find_one({"username": username})
            if user and check_password_hash(user["password"], password):
                return {"success": True, "message": "Login successful.", "user": user}
            return {"success": False, "message": "Invalid username or password."}

        except Exception as e:
            logging.error(f"Error verifying user '{username}': {str(e)}")
            return {"success": False, "message": "An error occurred while verifying the user."}