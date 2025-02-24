import os
import logging
from datetime import timedelta
from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from config import Config
from routes.chatbot import chatbot
from routes.auth import auth_bp
from routes.files import files_bp
from utils.database import initialize_db

# ✅ Load environment variables
load_dotenv()

# ✅ Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logging.info("Starting Flask application...")

# ✅ Initialize Flask app
app = Flask(__name__)

# 🔐 Apply security & JWT configurations
app.config["SECRET_KEY"] = Config.SECRET_KEY
app.config["JWT_SECRET_KEY"] = Config.JWT_SECRET_KEY
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(seconds=Config.JWT_ACCESS_TOKEN_EXPIRES)
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(seconds=Config.JWT_REFRESH_TOKEN_EXPIRES)
app.config["JWT_TOKEN_LOCATION"] = Config.JWT_TOKEN_LOCATION
app.config["JWT_HEADER_NAME"] = Config.JWT_HEADER_NAME
app.config["JWT_HEADER_TYPE"] = Config.JWT_HEADER_TYPE

# ✅ Validate required configurations
required_config = ["SECRET_KEY", "JWT_SECRET_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]
for key in required_config:
    if not getattr(Config, key, None):
        raise ValueError(f"❌ Missing required configuration: {key}")

# ✅ Enable CORS for frontend communication
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
CORS(app, resources={r"/api/*": {"origins": frontend_url}}, supports_credentials=True)

# ✅ Initialize JWT Manager
jwt = JWTManager(app)

# ✅ Initialize Supabase Database
logging.info("🔄 Initializing Supabase Database...")
initialize_db()

# ✅ Initialize Limiter with the Flask app
limiter = Limiter(
    key_func=get_remote_address,
    app=app,  # Pass the Flask app here
    default_limits=["500 per minute"]
)

# ✅ Register Blueprints (API Routes)
app.register_blueprint(chatbot, url_prefix="/api/chatbot")
app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(files_bp, url_prefix="/api/files")

# ✅ Apply rate limiting to the chatbot route
limiter.limit("500 per minute")(chatbot)

# ✅ Health Check Endpoint
@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy"}), 200

# ✅ Error Handlers
@app.errorhandler(500)
def internal_server_error(e):
    logging.error(f"Internal Server Error: {e}")
    return jsonify({"error": "Internal Server Error"}), 500

# ✅ Run Flask App
if __name__ == "__main__":
    debug_mode = os.getenv("FLASK_DEBUG", "True").lower() == "true"
    port = int(os.getenv("PORT", 5000))

    logging.info(f"🚀 Starting Flask App (Debug: {debug_mode}, Port: {port})")
    app.run(debug=debug_mode, host="0.0.0.0", port=port)