# File: lobo/backend/utils/websocket.py
# Enhancement: WebSocket implementation for real-time chat

import os
import logging
import json
import asyncio
import traceback
from typing import Dict, Set, Optional, Any, List
import jwt
from datetime import datetime
from flask import Flask
from flask_socketio import SocketIO, emit, join_room, leave_room, disconnect
from flask_cors import CORS
from config import Config
from middleware.auth_middleware import get_supabase_jwt_key

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# Initialize SocketIO
socketio = SocketIO()

# In-memory store for connected clients and rooms
connected_clients = {}  # user_id -> sid
client_rooms = {}       # sid -> set of room names
user_rooms = {}         # user_id -> set of room names

def init_socketio(app: Flask):
    """Initialize SocketIO with the Flask app."""
    cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    
    socketio.init_app(
        app,
        cors_allowed_origins=cors_origins,
        async_mode="eventlet",  # Using eventlet for better performance
        logger=True,
        engineio_logger=True if os.getenv("DEBUG", "False").lower() == "true" else False,
        ping_timeout=30,
        ping_interval=15,
        max_http_buffer_size=10 * 1024 * 1024,  # 10MB
    )
    
    # Register event handlers
    register_handlers()
    
    logging.info("SocketIO initialized successfully")

def register_handlers():
    """Register Socket.IO event handlers."""
    
    @socketio.on("connect")
    def handle_connect():
        """Handle client connection."""
        try:
            # Authenticate the client
            auth_token = None
            auth_header = socketio.server.environ.get("HTTP_AUTHORIZATION")
            
            if auth_header and auth_header.startswith("Bearer "):
                auth_token = auth_header.split("Bearer ")[1]
            
            # Get the session ID
            sid = socketio.server.environ.get("SOCKETIO_SID")
            
            if not auth_token:
                logging.warning(f"Connection rejected - no auth token provided. SID: {sid}")
                return False
                
            # Verify token
            user_id = verify_jwt_token(auth_token)
            
            if not user_id:
                logging.warning(f"Connection rejected - invalid auth token. SID: {sid}")
                return False
                
            # Store client information
            connected_clients[user_id] = sid
            client_rooms[sid] = set()
            
            # Create a private room for the user
            user_room = f"user:{user_id}"
            join_room(user_room)
            client_rooms[sid].add(user_room)
            
            if user_id not in user_rooms:
                user_rooms[user_id] = set()
            user_rooms[user_id].add(user_room)
            
            logging.info(f"Client connected: User ID: {user_id}, SID: {sid}")
            
            # Notify the client that connection is successful
            emit("connection_success", {
                "user_id": user_id,
                "connected_at": datetime.utcnow().isoformat(),
                "status": "connected"
            })
            
            return True
            
        except Exception as e:
            logging.error(f"Error in handle_connect: {str(e)}")
            logging.error(traceback.format_exc())
            return False
    
    @socketio.on("disconnect")
    def handle_disconnect():
        """Handle client disconnection."""
        sid = socketio.server.environ.get("SOCKETIO_SID")
        
        try:
            # Find the user associated with this session
            user_id = None
            for uid, client_sid in connected_clients.items():
                if client_sid == sid:
                    user_id = uid
                    break
            
            if user_id:
                # Remove client from rooms
                if sid in client_rooms:
                    for room in client_rooms[sid]:
                        leave_room(room)
                    
                    if user_id in user_rooms:
                        user_rooms[user_id] = user_rooms[user_id] - client_rooms[sid]
                        if not user_rooms[user_id]:
                            del user_rooms[user_id]
                    
                    del client_rooms[sid]
                
                # Remove client from connected clients
                del connected_clients[user_id]
                
                logging.info(f"Client disconnected: User ID: {user_id}, SID: {sid}")
            
        except Exception as e:
            logging.error(f"Error in handle_disconnect: {str(e)}")
            logging.error(traceback.format_exc())
    
    @socketio.on("join_chat")
    def handle_join_chat(data):
        """Handle client joining a chat room."""
        try:
            chat_id = data.get("chat_id")
            sid = socketio.server.environ.get("SOCKETIO_SID")
            
            if not chat_id:
                emit("error", {"message": "Chat ID is required"})
                return
            
            # Find the user associated with this session
            user_id = None
            for uid, client_sid in connected_clients.items():
                if client_sid == sid:
                    user_id = uid
                    break
            
            if not user_id:
                emit("error", {"message": "Not authenticated"})
                disconnect()
                return
            
            # Check if user has access to this chat
            # This would typically involve a database check
            from utils.database import supabase
            response = supabase.table("chat_history") \
                .select("id") \
                .eq("id", chat_id) \
                .eq("user_id", user_id) \
                .execute()
                
            if not response.data:
                emit("error", {"message": "Access denied to chat"})
                return
            
            # Create room name
            room_name = f"chat:{chat_id}"
            
            # Join the room
            join_room(room_name)
            
            # Update room tracking
            client_rooms[sid].add(room_name)
            
            if user_id not in user_rooms:
                user_rooms[user_id] = set()
            user_rooms[user_id].add(room_name)
            
            logging.info(f"User {user_id} joined chat room {chat_id}")
            
            # Notify client
            emit("joined_chat", {
                "chat_id": chat_id,
                "status": "joined"
            })
            
        except Exception as e:
            logging.error(f"Error in handle_join_chat: {str(e)}")
            logging.error(traceback.format_exc())
            emit("error", {"message": "Failed to join chat"})
    
    @socketio.on("leave_chat")
    def handle_leave_chat(data):
        """Handle client leaving a chat room."""
        try:
            chat_id = data.get("chat_id")
            sid = socketio.server.environ.get("SOCKETIO_SID")
            
            if not chat_id:
                emit("error", {"message": "Chat ID is required"})
                return
            
            # Create room name
            room_name = f"chat:{chat_id}"
            
            # Leave the room
            leave_room(room_name)
            
            # Update room tracking
            if sid in client_rooms:
                client_rooms[sid].discard(room_name)
            
            # Find the user associated with this session
            user_id = None
            for uid, client_sid in connected_clients.items():
                if client_sid == sid:
                    user_id = uid
                    break
            
            if user_id and user_id in user_rooms:
                user_rooms[user_id].discard(room_name)
            
            logging.info(f"User {user_id} left chat room {chat_id}")
            
            # Notify client
            emit("left_chat", {
                "chat_id": chat_id,
                "status": "left"
            })
            
        except Exception as e:
            logging.error(f"Error in handle_leave_chat: {str(e)}")
            logging.error(traceback.format_exc())
            emit("error", {"message": "Failed to leave chat"})
    
    @socketio.on("send_message")
    def handle_send_message(data):
        """Handle client sending a message."""
        try:
            chat_id = data.get("chat_id")
            message = data.get("message")
            sid = socketio.server.environ.get("SOCKETIO_SID")
            
            if not chat_id or not message:
                emit("error", {"message": "Chat ID and message are required"})
                return
            
            # Find the user associated with this session
            user_id = None
            for uid, client_sid in connected_clients.items():
                if client_sid == sid:
                    user_id = uid
                    break
            
            if not user_id:
                emit("error", {"message": "Not authenticated"})
                disconnect()
                return
            
            # Check if user has access to this chat
            from utils.database import supabase
            response = supabase.table("chat_history") \
                .select("messages") \
                .eq("id", chat_id) \
                .eq("user_id", user_id) \
                .single() \
                .execute()
                
            if not response.data:
                emit("error", {"message": "Access denied to chat"})
                return
            
            # Get existing messages
            messages = response.data.get("messages", [])
            
            # Add new message
            messages.append({
                "role": "user",
                "content": message,
                "timestamp": datetime.utcnow().isoformat()
            })
            
            # Update chat in database
            supabase.table("chat_history") \
                .update({
                    "messages": messages,
                    "updated_at": datetime.utcnow().isoformat()
                }) \
                .eq("id", chat_id) \
                .execute()
            
            # Create room name
            room_name = f"chat:{chat_id}"
            
            # Broadcast message to everyone in the room
            emit("new_message", {
                "chat_id": chat_id,
                "message": {
                    "role": "user",
                    "content": message,
                    "timestamp": datetime.utcnow().isoformat(),
                    "user_id": user_id
                }
            }, room=room_name)
            
            # Start processing message asynchronously
            from utils.tasks import process_chat_message
            process_result = process_chat_message.delay(user_id, chat_id, message)
            
            logging.info(f"User {user_id} sent message to chat {chat_id}: {message[:50]}...")
            
            # Notify client that message is being processed
            emit("message_processing", {
                "chat_id": chat_id,
                "task_id": process_result.id,
                "status": "processing"
            })
            
        except Exception as e:
            logging.error(f"Error in handle_send_message: {str(e)}")
            logging.error(traceback.format_exc())
            emit("error", {"message": "Failed to send message"})
    
    @socketio.on("typing")
    def handle_typing(data):
        """Handle client typing status updates."""
        try:
            chat_id = data.get("chat_id")
            is_typing = data.get("is_typing", False)
            sid = socketio.server.environ.get("SOCKETIO_SID")
            
            if not chat_id:
                return
            
            # Find the user associated with this session
            user_id = None
            for uid, client_sid in connected_clients.items():
                if client_sid == sid:
                    user_id = uid
                    break
            
            if not user_id:
                return
            
            # Create room name
            room_name = f"chat:{chat_id}"
            
            # Broadcast typing status to everyone in the room except sender
            emit("user_typing", {
                "chat_id": chat_id,
                "user_id": user_id,
                "is_typing": is_typing
            }, room=room_name, skip_sid=sid)
            
        except Exception as e:
            logging.error(f"Error in handle_typing: {str(e)}")

def verify_jwt_token(token: str) -> Optional[str]:
    """
    Verify a JWT token and return the user ID if valid.
    
    Args:
        token (str): JWT token
        
    Returns:
        Optional[str]: User ID if token is valid, None otherwise
    """
    try:
        # Get JWT verification key
        jwks = get_supabase_jwt_key()
        if not jwks:
            return None
        
        # Parse the token header to get the key ID
        header = jwt.get_unverified_header(token)
        kid = header.get('kid')
        
        # Find the matching JWK
        key = None
        for jwk in jwks['keys']:
            if jwk.get('kid') == kid:
                key = jwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(jwk))
                break
        
        if not key:
            return None
        
        # Decode and verify the token
        payload = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            audience=Config.SUPABASE_URL.replace('https://', ''),
            options={"verify_signature": True}
        )
        
        # Get user ID from the token
        return payload.get("sub")
        
    except jwt.ExpiredSignatureError:
        logging.warning("Token expired")
        return None
    except jwt.InvalidTokenError as e:
        logging.warning(f"Invalid token: {str(e)}")
        return None
    except Exception as e:
        logging.error(f"Error verifying token: {str(e)}")
        return None

def broadcast_chat_update(chat_id: str, update_type: str, data: Dict[str, Any]):
    """
    Broadcast a chat update to all clients in a chat room.
    
    Args:
        chat_id (str): Chat ID
        update_type (str): Type of update (e.g., "new_message", "message_edited")
        data (Dict[str, Any]): Update data to send
    """
    room_name = f"chat:{chat_id}"
    socketio.emit(update_type, data, room=room_name)

def send_to_user(user_id: str, event_type: str, data: Dict[str, Any]):
    """
    Send an event to a specific user.
    
    Args:
        user_id (str): User ID
        event_type (str): Type of event
        data (Dict[str, Any]): Event data to send
    """
    user_room = f"user:{user_id}"
    socketio.emit(event_type, data, room=user_room)