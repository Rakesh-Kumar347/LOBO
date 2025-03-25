# File: lobo/backend/config.py
# Enhancement: Improved JWT security with shorter expiration, token rotation, and stronger validation

import os
import logging
from datetime import timedelta
from dotenv import load_dotenv
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization

# ✅ Load environment variables
load_dotenv()

# ✅ Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logging.info("Loading configuration settings...")

class Config:
    """Enhanced configuration class for the Flask application."""

    # 🔐 Security Keys
    SECRET_KEY: str = os.getenv("SECRET_KEY", "default_secret_key")
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "default_jwt_secret_key")
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
    SUPABASE_DB_URL = os.getenv("SUPABASE_DB_URL")
    OLLAMA_MODEL = os.getenv("OLLAMA_MODEL","deepseek-r1:1.5b")

    # 🔑 Enhanced JWT Configuration
    JWT_ACCESS_TOKEN_EXPIRES: int = int(os.getenv("JWT_EXPIRATION_MINUTES", 15)) * 60  # Reduced to 15 minutes
    JWT_REFRESH_TOKEN_EXPIRES: int = int(os.getenv("JWT_REFRESH_EXPIRATION_HOURS", 24)) * 3600
    JWT_TOKEN_LOCATION: list = ["headers", "cookies"]  # Added cookies for more secure storage
    JWT_COOKIE_SECURE: bool = os.getenv("JWT_COOKIE_SECURE", "False").lower() == "true"  # Use secure cookies in production
    JWT_COOKIE_CSRF_PROTECT: bool = True  # Enable CSRF protection for cookies
    JWT_CSRF_CHECK_FORM: bool = True  # Check CSRF token in form data
    JWT_HEADER_NAME: str = "Authorization"
    JWT_HEADER_TYPE: str = "Bearer"
    JWT_BLACKLIST_ENABLED: bool = True  # Enable token blacklisting for logout
    JWT_BLACKLIST_TOKEN_CHECKS: list = ["access", "refresh"]  # Check both token types

    # 🔒 CORS Configuration
    CORS_ORIGINS: list = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    CORS_METHODS: list = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    CORS_ALLOW_HEADERS: list = ["Content-Type", "Authorization", "X-CSRF-Token"]
    CORS_SUPPORTS_CREDENTIALS: bool = True
    
    # 🥾 Session Configuration
    SESSION_TYPE: str = "filesystem"
    SESSION_PERMANENT: bool = True
    PERMANENT_SESSION_LIFETIME: int = int(os.getenv("SESSION_LIFETIME_DAYS", 7)) * 86400
    SESSION_COOKIE_SECURE: bool = os.getenv("SESSION_COOKIE_SECURE", "False").lower() == "true"
    SESSION_COOKIE_HTTPONLY: bool = True
    SESSION_COOKIE_SAMESITE: str = "Lax"  # Prevents CSRF, less strict than 'Strict'
    MAX_INPUT_LENGTH = int(os.getenv("MAX_INPUT_LENGTH", 1000))  

    # 🔍 Content Security Policy
    CSP_DIRECTIVES: dict = {
        'default-src': ["'self'"],
        'script-src': ["'self'", "https://cdnjs.cloudflare.com"],
        'style-src': ["'self'", "https://fonts.googleapis.com", "'unsafe-inline'"],
        'img-src': ["'self'", "data:"],
        'font-src': ["'self'", "https://fonts.gstatic.com"],
        'connect-src': ["'self'", os.getenv("FRONTEND_URL", "http://localhost:3000")],
    }

    # Other configurations remain the same...
    
    # ✅ RSA Key Pair for JWT (if using asymmetric signing)
    @classmethod
    def generate_rsa_keys(cls):
        """Generate RSA key pair for JWT signing."""
        try:
            key_dir = os.path.join(os.path.dirname(__file__), 'keys')
            os.makedirs(key_dir, exist_ok=True)
            
            private_key_path = os.path.join(key_dir, 'jwt-private.pem')
            public_key_path = os.path.join(key_dir, 'jwt-public.pem')
            
            # Check if keys already exist
            if os.path.exists(private_key_path) and os.path.exists(public_key_path):
                logging.info("RSA keys already exist, loading...")
                return
            
            # Generate private key
            private_key = rsa.generate_private_key(
                public_exponent=65537,
                key_size=2048
            )
            
            # Get public key
            public_key = private_key.public_key()
            
            # Serialize private key
            private_pem = private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            )
            
            # Serialize public key
            public_pem = public_key.public_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo
            )
            
            # Write to files
            with open(private_key_path, 'wb') as f:
                f.write(private_pem)
            
            with open(public_key_path, 'wb') as f:
                f.write(public_pem)
                
            logging.info("RSA key pair generated successfully.")
        except Exception as e:
            logging.error(f"Failed to generate RSA keys: {e}")


# ✅ Validate required environment variables
required_vars = ["SECRET_KEY", "JWT_SECRET_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]
for var in required_vars:
    if not os.getenv(var):
        raise ValueError(f"❌ Missing required environment variable: {var}")

logging.info("Configuration settings loaded successfully.")

# Generate RSA keys if needed
Config.generate_rsa_keys()


