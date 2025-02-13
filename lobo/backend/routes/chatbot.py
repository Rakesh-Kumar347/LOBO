from flask import Blueprint, request, jsonify
import ollama

chatbot = Blueprint("chatbot", __name__)

@chatbot.route("/", methods=["POST"])
def chatbot_response():
    """Handles chatbot responses using Ollama AI model."""
    try:
        data = request.json
        user_message = data.get("message", "").strip()

        if not user_message:
            return jsonify({"error": "Message cannot be empty"}), 400

        response = ollama.chat(
            model="deepseek-r1:1.5b",
            messages=[{"role": "user", "content": user_message}]
        )

        bot_response = response.get("message", {}).get("content", "Sorry, I couldn't generate a response.")

        return jsonify({"response": bot_response})

    except Exception as e:
        return jsonify({"error": str(e)}), 500
