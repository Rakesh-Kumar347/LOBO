# routes/__init__.py
from .auth import auth_bp
from .chatbot import chatbot
from .files import files_bp

__all__ = ["auth_bp", "chatbot", "files_bp"]