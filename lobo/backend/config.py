import os
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env file

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "your_secret_key")  # Change this
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your_jwt_secret_key")  # Change this
    JWT_TOKEN_LOCATION = ["headers"]  # Make sure this is set
    JWT_ACCESS_TOKEN_EXPIRES = 3600  # Token expires in 1 hour
    JWT_REFRESH_TOKEN_EXPIRES = 86400  # Refresh token expires in 1 day
    CORS_HEADERS = "Content-Type"
    JWT_HEADER_NAME = "Authorization"
    JWT_HEADER_TYPE = "Bearer"
