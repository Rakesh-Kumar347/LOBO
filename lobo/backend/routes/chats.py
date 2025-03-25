from flask import Blueprint, request, jsonify
from middleware.auth_middleware import auth_required
from middleware.csrf_middleware import csrf_protect
from utils.api_response import success_response, error_response
from utils.database import supabase
import uuid
import logging

chats_bp = Blueprint("chats", __name__)

@chats_bp.route("/", methods=["GET"])
@auth_required
@csrf_protect
def get_chats(user_id):
    """
    Get all chat histories for the authenticated user.
    """
    try:
        response = supabase.table("chat_history") \
            .select("id, title, created_at, updated_at") \
            .eq("user_id", user_id) \
            .order("updated_at", desc=True) \
            .execute()
            
        if response.error:
            return error_response(
                message=f"Failed to retrieve chats: {response.error.message}",
                status_code=500
            )
            
        return success_response(
            data={"chats": response.data},
            message="Chat histories retrieved successfully"
        )
    except Exception as e:
        logging.error(f"Error retrieving chats: {str(e)}")
        return error_response(
            message="An error occurred while retrieving chats",
            status_code=500,
            exc=e
        )

@chats_bp.route("/<chat_id>", methods=["GET"])
@auth_required
@csrf_protect
def get_chat(user_id, chat_id):
    """
    Get a specific chat history by ID.
    """
    try:
        response = supabase.table("chat_history") \
            .select("*") \
            .eq("id", chat_id) \
            .eq("user_id", user_id) \
            .single() \
            .execute()
            
        if response.error:
            return error_response(
                message=f"Failed to retrieve chat: {response.error.message}",
                status_code=404 if "404" in str(response.error) else 500
            )
            
        return success_response(
            data=response.data,
            message="Chat retrieved successfully"
        )
    except Exception as e:
        logging.error(f"Error retrieving chat {chat_id}: {str(e)}")
        return error_response(
            message="An error occurred while retrieving the chat",
            status_code=500,
            exc=e
        )
        
@chats_bp.route("/", methods=["POST"])
@auth_required
@csrf_protect
def create_chat(user_id):
    """
    Create a new chat history.
    """
    try:
        data = request.json
        
        if not data:
            return error_response(
                message="No data provided",
                status_code=400
            )
            
        if not data.get("title") or not data.get("messages"):
            return error_response(
                message="Title and messages are required",
                status_code=400
            )
            
        # Add debugging output
        print(f"Creating chat for user {user_id} with data: {data}")
            
        chat_id = str(uuid.uuid4())
        
        response = supabase.table("chat_history").insert({
            "id": chat_id,
            "user_id": user_id,
            "title": data["title"],
            "messages": data["messages"],
            "category": data.get("category", "General")
        }).execute()
        
        if response.error:
            print(f"Supabase error: {response.error}")
            return error_response(
                message=f"Failed to create chat: {response.error.message}",
                status_code=500
            )
            
        print(f"Chat created with ID: {chat_id}")
        return success_response(
            data={"chat_id": chat_id},
            message="Chat created successfully",
            status_code=201
        )
    except Exception as e:
        print(f"Error creating chat: {str(e)}")
        logging.error(f"Error creating chat: {str(e)}")
        return error_response(
            message="An error occurred while creating the chat",
            status_code=500,
            exc=e
        )

@chats_bp.route("/<chat_id>", methods=["PUT"])
@auth_required
@csrf_protect
def update_chat(user_id, chat_id):
    """
    Update an existing chat history.
    """
    try:
        data = request.json
        
        if not data:
            return error_response(
                message="No data provided",
                status_code=400
            )
            
        # Check if chat exists and belongs to user
        check_response = supabase.table("chat_history") \
            .select("id") \
            .eq("id", chat_id) \
            .eq("user_id", user_id) \
            .single() \
            .execute()
            
        if check_response.error or not check_response.data:
            return error_response(
                message="Chat not found or unauthorized",
                status_code=404
            )
            
        update_data = {}
        if "title" in data:
            update_data["title"] = data["title"]
        if "messages" in data:
            update_data["messages"] = data["messages"]
        if "updated_at" in data:
            update_data["updated_at"] = data["updated_at"]
        
        if not update_data:
            return error_response(
                message="No valid fields to update",
                status_code=400
            )
            
        response = supabase.table("chat_history") \
            .update(update_data) \
            .eq("id", chat_id) \
            .eq("user_id", user_id) \
            .execute()
            
        if response.error:
            return error_response(
                message=f"Failed to update chat: {response.error.message}",
                status_code=500
            )
            
        return success_response(
            message="Chat updated successfully"
        )
    except Exception as e:
        logging.error(f"Error updating chat {chat_id}: {str(e)}")
        return error_response(
            message="An error occurred while updating the chat",
            status_code=500,
            exc=e
        )

@chats_bp.route("/<chat_id>", methods=["DELETE"])
@auth_required
@csrf_protect
def delete_chat(user_id, chat_id):
    """
    Delete a chat history.
    """
    try:
        # Check if chat exists and belongs to user
        check_response = supabase.table("chat_history") \
            .select("id") \
            .eq("id", chat_id) \
            .eq("user_id", user_id) \
            .single() \
            .execute()
            
        if check_response.error or not check_response.data:
            return error_response(
                message="Chat not found or unauthorized",
                status_code=404
            )
            
        response = supabase.table("chat_history") \
            .delete() \
            .eq("id", chat_id) \
            .eq("user_id", user_id) \
            .execute()
            
        if response.error:
            return error_response(
                message=f"Failed to delete chat: {response.error.message}",
                status_code=500
            )
            
        return success_response(
            message="Chat deleted successfully"
        )
    except Exception as e:
        logging.error(f"Error deleting chat {chat_id}: {str(e)}")
        return error_response(
            message="An error occurred while deleting the chat",
            status_code=500,
            exc=e
        )