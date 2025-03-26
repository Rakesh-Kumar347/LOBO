# File: lobo/backend/models/user.py
import logging
from typing import Dict, Optional
from utils.database import supabase

# Configure logging
logging.basicConfig(level=logging.ERROR, format="%(asctime)s - %(levelname)s - %(message)s")

class User:
    """Handles user authentication and management with Supabase.

    Methods:
        create_user: Creates a new user with Supabase Auth.
        verify_user: Verifies user credentials with Supabase Auth.
    """

    @staticmethod
    def create_user(email: str, password: str, full_name: str = "") -> Dict[str, str]:
        """
        Creates a new user with Supabase Auth.

        Args:
            email (str): User email.
            password (str): User password.
            full_name (str): User's full name.

        Returns:
            Dict[str, str]: A dictionary with success or error message.
        """
        try:
            # Validate input
            if len(email) < 5 or len(password) < 8:
                return {
                    "success": False, 
                    "message": "Email must be valid and password at least 8 characters."
                }

            # Create user with Supabase
            result = supabase.auth.sign_up({
                "email": email,
                "password": password,
                "options": {
                    "data": {
                        "full_name": full_name
                    }
                }
            })
            
            if result.error:
                return {"success": False, "message": result.error.message}
                
            return {"success": True, "message": "User created successfully."}

        except Exception as e:
            logging.error(f"Error creating user '{email}': {str(e)}")
            return {"success": False, "message": "An error occurred while creating the user."}

    @staticmethod
    def verify_user(email: str, password: str) -> Dict[str, str]:
        """
        Verifies user credentials with Supabase Auth.

        Args:
            email (str): User email.
            password (str): User password.

        Returns:
            Dict[str, str]: A dictionary with verification status.
        """
        try:
            result = supabase.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
            
            if result.error:
                return {"success": False, "message": "Invalid email or password."}
                
            return {
                "success": True, 
                "message": "Login successful.", 
                "user": result.user,
                "session": result.session
            }

        except Exception as e:
            logging.error(f"Error verifying user '{email}': {str(e)}")
            return {"success": False, "message": "An error occurred while verifying the user."}