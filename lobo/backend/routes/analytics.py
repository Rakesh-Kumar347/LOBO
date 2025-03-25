from flask import Blueprint, jsonify, request
from middleware.auth_middleware import auth_required
from middleware.csrf_middleware import csrf_protect
from utils.api_response import success_response, error_response
from utils.database import supabase
import logging
from datetime import datetime, timedelta

analytics_bp = Blueprint("analytics", __name__)

@analytics_bp.route("/user", methods=["GET"])
@auth_required
@csrf_protect
def get_user_analytics(user_id):
    """
    Get usage analytics for the authenticated user.
    
    Returns:
        Chat count, message count, response time stats, etc.
    """
    try:
        # Get time range from query params (default to last 30 days)
        days = request.args.get('days', 30, type=int)
        start_date = (datetime.now() - timedelta(days=days)).isoformat()
        
        # Get all user's chats
        chat_response = supabase.table("chat_history") \
            .select("id, created_at, updated_at") \
            .eq("user_id", user_id) \
            .gte("created_at", start_date) \
            .execute()
            
        if chat_response.error:
            return error_response(
                message=f"Failed to retrieve chats: {chat_response.error.message}",
                status_code=500
            )
        
        chats = chat_response.data
        chat_count = len(chats)
        
        # Get message counts from chat messages
        message_response = supabase.table("chat_history") \
            .select("messages") \
            .eq("user_id", user_id) \
            .gte("created_at", start_date) \
            .execute()
            
        if message_response.error:
            return error_response(
                message=f"Failed to retrieve messages: {message_response.error.message}",
                status_code=500
            )
        
        # Calculate message stats
        total_messages = 0
        user_messages = 0
        assistant_messages = 0
        
        for chat in message_response.data:
            if not chat.get("messages"):
                continue
                
            messages = chat.get("messages", [])
            total_messages += len(messages)
            
            for msg in messages:
                if msg.get("role") == "user":
                    user_messages += 1
                elif msg.get("role") == "assistant":
                    assistant_messages += 1
        
        # Calculate active days (days with chat activity)
        active_days = set()
        for chat in chats:
            if chat.get("created_at"):
                chat_date = chat.get("created_at").split("T")[0]  # Get date part only
                active_days.add(chat_date)
        
        # Calculate average chats per active day
        avg_chats_per_active_day = chat_count / len(active_days) if active_days else 0
        
        # Return analytics data
        analytics_data = {
            "time_range": f"Last {days} days",
            "chat_count": chat_count,
            "total_messages": total_messages,
            "user_messages": user_messages,
            "assistant_messages": assistant_messages,
            "active_days": len(active_days),
            "avg_chats_per_active_day": round(avg_chats_per_active_day, 2),
            "first_active_date": min(active_days) if active_days else None,
            "last_active_date": max(active_days) if active_days else None
        }
        
        return success_response(
            data=analytics_data,
            message="User analytics retrieved successfully"
        )
    except Exception as e:
        logging.error(f"Error retrieving user analytics: {str(e)}")
        return error_response(
            message="An error occurred while retrieving analytics",
            status_code=500,
            exc=e
        )

@analytics_bp.route("/system", methods=["GET"])
@auth_required
@csrf_protect
def get_system_analytics(user_id):
    """
    Get system-wide analytics (admin only).
    """
    try:
        # Check if user is admin
        user_response = supabase.table("profiles") \
            .select("is_admin") \
            .eq("id", user_id) \
            .single() \
            .execute()
            
        if user_response.error:
            return error_response(
                message="Failed to verify user role",
                status_code=500
            )
        
        if not user_response.data or not user_response.data.get("is_admin"):
            return error_response(
                message="Unauthorized. Admin access required.",
                status_code=403
            )
        
        # Get time range from query params (default to last 30 days)
        days = request.args.get('days', 30, type=int)
        start_date = (datetime.now() - timedelta(days=days)).isoformat()
        
        # Get total user count
        user_count_response = supabase.table("profiles") \
            .select("id", count="exact") \
            .execute()
            
        if user_count_response.error:
            return error_response(
                message="Failed to retrieve user count",
                status_code=500
            )
        
        total_users = user_count_response.count
        
        # Get active users in the period
        active_users_response = supabase.table("chat_history") \
            .select("user_id") \
            .gte("created_at", start_date) \
            .execute()
            
        if active_users_response.error:
            return error_response(
                message="Failed to retrieve active users",
                status_code=500
            )
        
        unique_active_users = set()
        for item in active_users_response.data:
            if item.get("user_id"):
                unique_active_users.add(item.get("user_id"))
        
        active_user_count = len(unique_active_users)
        
        # Get total chats and messages
        total_chats_response = supabase.table("chat_history") \
            .select("id", count="exact") \
            .gte("created_at", start_date) \
            .execute()
            
        if total_chats_response.error:
            return error_response(
                message="Failed to retrieve chat count",
                status_code=500
            )
        
        total_chats = total_chats_response.count
        
        # Get daily user registrations for the period
        registrations_response = supabase.table("profiles") \
            .select("created_at") \
            .gte("created_at", start_date) \
            .execute()
            
        if registrations_response.error:
            return error_response(
                message="Failed to retrieve registration data",
                status_code=500
            )
        
        # Group registrations by day
        daily_registrations = {}
        for user in registrations_response.data:
            if user.get("created_at"):
                day = user.get("created_at").split("T")[0]
                daily_registrations[day] = daily_registrations.get(day, 0) + 1
        
        # Return system analytics
        system_data = {
            "time_range": f"Last {days} days",
            "total_users": total_users,
            "active_users": active_user_count,
            "active_rate": round((active_user_count / total_users * 100), 2) if total_users else 0,
            "total_chats": total_chats,
            "avg_chats_per_active_user": round(total_chats / active_user_count, 2) if active_user_count else 0,
            "daily_registrations": daily_registrations,
            "new_users": len(registrations_response.data),
            "new_user_rate": round(len(registrations_response.data) / total_users * 100, 2) if total_users else 0
        }
        
        return success_response(
            data=system_data,
            message="System analytics retrieved successfully"
        )
    except Exception as e:
        logging.error(f"Error retrieving system analytics: {str(e)}")
        return error_response(
            message="An error occurred while retrieving system analytics",
            status_code=500,
            exc=e
        )