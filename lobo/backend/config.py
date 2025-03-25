import os
import logging
from datetime import timedelta
from dotenv import load_dotenv

# ✅ Load environment variables
load_dotenv()

# ✅ Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logging.info("Loading configuration settings...")

class Config:
    """
    Configuration class for the Flask application.

    Attributes:
        SECRET_KEY (str): Secret key for Flask application security.
        JWT_SECRET_KEY (str): Secret key for signing JWT tokens.
        JWT_ACCESS_TOKEN_EXPIRES (int): Expiration time for JWT access tokens (in seconds).
        JWT_REFRESH_TOKEN_EXPIRES (int): Expiration time for JWT refresh tokens (in seconds).
        SUPABASE_URL (str): URL of the Supabase project.
        SUPABASE_SERVICE_ROLE_KEY (str): Service role key for full access to Supabase.
        SUPABASE_ANON_KEY (str): Anonymous key for public access to Supabase.
        SUPABASE_DB_URL (str): Connection URL for the Supabase PostgreSQL database.
        OLLAMA_MODEL (str): Name of the Ollama AI model to use.
        VECTOR_DB_PATH (str): Directory path for FAISS vector storage.
        FLASK_DEBUG (bool): Enables or disables Flask debug mode.
        PORT (int): Port on which the Flask application runs.
        FRONTEND_URL (str): URL of the frontend application for CORS configuration.
        MAX_INPUT_LENGTH (int): Maximum allowed length for chatbot input.
    """

    # 🔐 Security Keys
    SECRET_KEY: str = os.getenv("SECRET_KEY", "default_secret_key")
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "default_jwt_secret_key")

    # 🔑 JWT Configuration
    JWT_ACCESS_TOKEN_EXPIRES: int = int(os.getenv("JWT_EXPIRATION_MINUTES", 30)) * 60  # Convert minutes to seconds
    JWT_REFRESH_TOKEN_EXPIRES: int = int(os.getenv("JWT_REFRESH_EXPIRATION_HOURS", 24)) * 3600  # Convert hours to seconds
    JWT_TOKEN_LOCATION: list = ["headers"]
    JWT_HEADER_NAME: str = "Authorization"
    JWT_HEADER_TYPE: str = "Bearer"

    # 🗄️ Supabase Configuration
    SUPABASE_URL: str = os.getenv("SUPABASE_URL")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY")
    SUPABASE_DB_URL: str = os.getenv("SUPABASE_DB_URL")

    # 🤖 Ollama AI Model
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "deepseek-r1:1.5b")

    # 🔍 FAISS Vector Database Storage Path
    VECTOR_DB_PATH: str = os.getenv("VECTOR_DB_PATH", "vector_db")

    # 🚀 Flask Configuration
    FLASK_DEBUG: bool = os.getenv("FLASK_DEBUG", "True").lower() == "true"
    PORT: int = int(os.getenv("PORT", 5000))

    # 🖥️ Frontend URL for CORS
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

    # 📄 Max Input Length for Chatbot
    MAX_INPUT_LENGTH: int = int(os.getenv("MAX_INPUT_LENGTH", 1000))  # Default: 1000 characters

    # Add this to the Config class in config.py
    # Session Configuration
    USE_SESSION_EXTENSION = os.getenv("USE_SESSION_EXTENSION", "False").lower() == "true"
    SESSION_TYPE = os.getenv("SESSION_TYPE", "filesystem")
    SESSION_PERMANENT = True
    PERMANENT_SESSION_LIFETIME = int(os.getenv("SESSION_LIFETIME_DAYS", 7)) * 86400  # days to seconds

# ✅ Validate required environment variables
required_vars = ["SECRET_KEY", "JWT_SECRET_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]
for var in required_vars:
    if not os.getenv(var):
        raise ValueError(f"❌ Missing required environment variable: {var}")

logging.info("Configuration settings loaded successfully.")