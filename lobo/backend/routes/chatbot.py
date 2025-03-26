# File: lobo/backend/routes/chatbot.py
import logging
from flask import Blueprint, request, jsonify, session
from config import Config  # Import configuration settings
from flask_limiter.util import get_remote_address
from utils.websocket import broadcast_chat_update
import datetime
from models.chatbot import Chatbot  # Import the Chatbot class

# Configure logging
logging.basicConfig(level=logging.ERROR, format="%(asctime)s - %(levelname)s - %(message)s")

# Initialize Blueprint
chatbot = Blueprint("chatbot", __name__)

# Initialize chatbot instance
chatbot_instance = Chatbot()

def is_valid_message(message: str) -> bool:
    """Validates the user's input message."""
    # Allow alphanumeric, spaces, and common coding/math symbols
    allowed_chars = " .,!?+-*/=(){}[]<>@#$%^&_|\\\"'`"
    return all(char.isalnum() or char in allowed_chars for char in message)

@chatbot.route("/", methods=["POST"])
def chatbot_response():
    try:
        data = request.json
        user_message = data.get("message", "").strip()
        chat_id = data.get("chat_id")
        
        # Validate input
        if not user_message:
            return jsonify({"error": "Message cannot be empty"}), 400
        if len(user_message) > Config.MAX_INPUT_LENGTH:
            return jsonify({"error": f"Message exceeds {Config.MAX_INPUT_LENGTH} characters"}), 400
        if not is_valid_message(user_message):
            return jsonify({"error": "Invalid message content"}), 400

        # Retrieve previous conversation from session (for chat context)
        chat_history = session.get("chat_history", [])

        # Append user message to history
        chat_history.append({"role": "user", "content": user_message})
        
        # Generate AI response using the Chatbot class
        temperature = 0.7  # Default value, could be customized
        max_tokens = 512  # Default value, could be customized
        bot_response = chatbot_instance.generate_response(
            user_message, 
            temperature=temperature, 
            max_tokens=max_tokens
        )
        
        if bot_response is None:
            bot_response = "Sorry, I couldn't generate a response."

        # Log the response
        logging.info(f"Generated response: {bot_response}")

        # Append bot response to chat history and update session
        chat_history.append({"role": "assistant", "content": bot_response})
        session["chat_history"] = chat_history  # Store chat history in session
        session.permanent = True  # Enable session expiration

        # If chat_id is provided, broadcast the response via WebSocket
        if chat_id:
            broadcast_chat_update(chat_id, "new_message", {
                "chat_id": chat_id,
                "message": {
                    "role": "assistant",
                    "content": bot_response,
                    "timestamp": datetime.datetime.utcnow().isoformat()
                }
            })

        return jsonify({"response": bot_response}), 200

    except Exception as e:
        logging.error(f"Error in chatbot response: {str(e)}")
        return jsonify({"error": "An internal error occurred"}), 500