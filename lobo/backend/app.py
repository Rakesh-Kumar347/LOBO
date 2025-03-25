# File: lobo/backend/app.py
# Enhancement: Add OpenAPI/Swagger documentation support

import os
import logging
from datetime import timedelta
from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_swagger_ui import get_swaggerui_blueprint
from apispec import APISpec
from apispec.ext.marshmallow import MarshmallowPlugin
from apispec_webframeworks.flask import FlaskPlugin
from config import Config
from routes.chatbot import chatbot
from routes.auth import auth_bp
from routes.files import files_bp
from routes.csrf import csrf_bp
from routes.chats import chats_bp
from middleware.csrf_middleware import set_csrf_token
from routes.chat_search import chat_search_bp
from routes.subscriptions import subscriptions_bp
from routes.analytics import analytics_bp
from utils.websocket import init_socketio



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
app.config["SESSION_TYPE"] = "filesystem"
app.config["SESSION_PERMANENT"] = True
app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(days=7)

# Add Swagger UI configuration
app.config["SWAGGER"] = {
    "title": "LOBO API",
    "version": "1.0.0",
    "description": "API documentation for LOBO backend services",
    "uiversion": 3,
    "securityDefinitions": {
        "Bearer": {
            "type": "apiKey",
            "name": "Authorization",
            "in": "header",
            "description": "Enter your JWT token in the format 'Bearer {token}'"
        }
    },
    "security": [{"Bearer": []}]
}

# Create API spec
spec = APISpec(
    title="LOBO API",
    version="1.0.0",
    openapi_version="3.0.2",
    plugins=[FlaskPlugin(), MarshmallowPlugin()],
    info={
        "description": "API documentation for LOBO backend services",
        "contact": {"email": "support@lobo.ai"}
    },
    security=[{"Bearer": []}],
)

# Add security scheme
spec.components.security_scheme("Bearer", {
    "type": "http",
    "scheme": "bearer",
    "bearerFormat": "JWT",
    "description": "JWT token authentication"
})

# Setup Swagger UI
SWAGGER_URL = "/api/docs"
API_URL = "/api/spec"
swaggerui_blueprint = get_swaggerui_blueprint(
    SWAGGER_URL,
    API_URL,
    config={
        "app_name": "LOBO API Documentation",
        "layout": "BaseLayout",
        "deepLinking": True,
        "displayRequestDuration": True,
        "defaultModelsExpandDepth": 3,
        "defaultModelExpandDepth": 3,
        "docExpansion": "list",
        "showExtensions": True,
    }
)
app.register_blueprint(swaggerui_blueprint, url_prefix=SWAGGER_URL)

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
from utils.database import initialize_db
logging.info("🔄 Initializing Supabase Database...")
initialize_db()

# ✅ Initialize Redis Cache
from utils.cache import initialize_cache
logging.info("🔄 Initializing Redis Cache...")
initialize_cache()

# ✅ Initialize Rate Limiter
from middleware.rate_limiter import init_rate_limiter, limiter
init_rate_limiter(app)

# Initialize session if using flask-session extension (optional)
if hasattr(Config, 'USE_SESSION_EXTENSION') and Config.USE_SESSION_EXTENSION:
    try:
        from flask_session import Session
        Session(app)
        print("Flask-Session extension initialized")
    except ImportError:
        print("Flask-Session extension not installed but was requested in config")

# Initialize SocketIO after other extensions
init_socketio(app)

# ✅ Register Blueprints (API Routes)
app.register_blueprint(chatbot, url_prefix="/api/chatbot")
app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(files_bp, url_prefix="/api/files")
app.register_blueprint(csrf_bp, url_prefix="/api/csrf")
app.register_blueprint(chats_bp, url_prefix="/api/chats")
app.register_blueprint(chat_search_bp, url_prefix="/api/chats/search")
app.register_blueprint(subscriptions_bp, url_prefix="/api/subscriptions")
app.register_blueprint(analytics_bp, url_prefix="/api/analytics")

# ✅ Apply rate limiting to the chatbot route
limiter.limit("500 per minute")(chatbot)

# OpenAPI/Swagger endpoint
@app.route('/api/spec')
def create_swagger_spec():
    """Swagger API definition."""
    return jsonify(spec.to_dict())

# ✅ Health Check Endpoint
@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint to verify API is running.
    ---
    get:
      summary: Health check endpoint
      description: Returns healthy status if the API is running correctly
      responses:
        200:
          description: API is healthy
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                    example: healthy
                  version:
                    type: string
                    example: 1.0.0
    """
    return jsonify({
        "status": "healthy", 
        "version": "1.0.0",
        "environment": os.getenv("FLASK_ENV", "development")
    }), 200

# Document the health check endpoint
with app.test_request_context():
    spec.path(view=health_check)

# ✅ Error Handlers
@app.errorhandler(400)
def bad_request(e):
    logging.warning(f"Bad Request: {e}")
    return jsonify({"error": "Bad Request", "message": str(e)}), 400

@app.errorhandler(401)
def unauthorized(e):
    logging.warning(f"Unauthorized: {e}")
    return jsonify({"error": "Unauthorized", "message": "Authentication required"}), 401

@app.errorhandler(403)
def forbidden(e):
    logging.warning(f"Forbidden: {e}")
    return jsonify({"error": "Forbidden", "message": "You don't have permission to access this resource"}), 403

@app.errorhandler(404)
def not_found(e):
    logging.warning(f"Not Found: {e}")
    return jsonify({"error": "Not Found", "message": "The requested resource was not found"}), 404

@app.errorhandler(429)
def too_many_requests(e):
    logging.warning(f"Too Many Requests: {e}")
    return jsonify({
        "error": "Too Many Requests", 
        "message": "Rate limit exceeded. Please try again later."
    }), 429

@app.errorhandler(500)
def internal_server_error(e):
    logging.error(f"Internal Server Error: {e}")
    return jsonify({"error": "Internal Server Error", "message": "An unexpected error occurred"}), 500

# ✅ Run Flask App
if __name__ == "__main__":
    debug_mode = os.getenv("FLASK_DEBUG", "True").lower() == "true"
    port = int(os.getenv("PORT", 5000))

    logging.info(f"🚀 Starting Flask App (Debug: {debug_mode}, Port: {port})")
    app.run(debug=debug_mode, host="0.0.0.0", port=port)