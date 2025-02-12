from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from datetime import timedelta
from dotenv import load_dotenv
import os

# Import blueprints
from routes.chatbot import chatbot
from routes.auth import auth_bp  # ✅ Authentication routes

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Enable CORS
CORS(app)

# Configure JWT with expiration time (30 minutes)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=30)  # ⏳ Expire in 30 minutes

jwt = JWTManager(app)

# Register blueprints
app.register_blueprint(chatbot, url_prefix="/api/chatbot")
app.register_blueprint(auth_bp, url_prefix="/api/auth")  # ✅ Auth routes

if __name__ == "__main__":
    app.run(debug=True)
