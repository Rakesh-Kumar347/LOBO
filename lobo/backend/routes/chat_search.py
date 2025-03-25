from flask import Blueprint, request, jsonify
from middleware.auth_middleware import auth_required
from middleware.csrf_middleware import csrf_protect
from utils.api_response import success_response, error_response
from utils.database import supabase
import logging

chat_search_bp = Blueprint("chat_search", __name__)

@chat_search_bp.route("/", methods=["GET"])
@auth_required
@csrf_protect
def search_chats(user_id):
    """
    Search for chats by query and category.
    
    Query Parameters:
        query (str): Search query
        category (str): Category filter
    """
    try:
        query = request.args.get('query', '')
        category = request.args.get('category', '')
        
        # Base query
        db_query = supabase.table("chat_history").select("*").eq("user_id", user_id)
        
        # Apply filters if provided
        if category:
            db_query = db_query.eq("category", category)
            
        if query:
            # Convert query to format suitable for to_tsquery
            # Replace spaces with & for AND search
            formatted_query = " & ".join(query.split())
            # Use Postgres text search
            db_query = db_query.textSearch("title", formatted_query)
            
        # Execute query with sorting
        response = db_query.order("updated_at", desc=True).execute()
        
        if response.error:
            return error_response(
                message=f"Failed to search chats: {response.error.message}",
                status_code=500
            )
            
        return success_response(
            data={"chats": response.data},
            message="Chats retrieved successfully"
        )
    except Exception as e:
        logging.error(f"Error searching chats: {str(e)}")
        return error_response(
            message="An error occurred while searching chats",
            status_code=500,
            exc=e
        )

@chat_search_bp.route("/categories", methods=["GET"])
@auth_required
def get_categories(user_id):
    """Get all unique categories for a user's chats."""
    try:
        response = supabase.table("chat_history") \
            .select("category") \
            .eq("user_id", user_id) \
            .execute()
            
        if response.error:
            return error_response(
                message=f"Failed to retrieve categories: {response.error.message}",
                status_code=500
            )
        
        # Extract unique categories
        categories = set()
        for item in response.data:
            if item.get("category"):
                categories.add(item.get("category"))
        
        # Ensure "General" is always included
        categories.add("General")
        
        return success_response(
            data={"categories": sorted(list(categories))},
            message="Categories retrieved successfully"
        )
    except Exception as e:
        logging.error(f"Error retrieving categories: {str(e)}")
        return error_response(
            message="An error occurred while retrieving categories",
            status_code=500,
            exc=e
        )