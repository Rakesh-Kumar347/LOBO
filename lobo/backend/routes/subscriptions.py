from flask import Blueprint, jsonify, request
from middleware.auth_middleware import auth_required
from middleware.csrf_middleware import csrf_protect
from utils.api_response import success_response, error_response
from utils.database import supabase
import logging
import uuid
from datetime import datetime, timedelta

subscriptions_bp = Blueprint("subscriptions", __name__)

# Define subscription tiers
SUBSCRIPTION_TIERS = {
    "free": {
        "name": "Free",
        "features": ["Basic chatbot access", "10 messages per session", "No saving chats"],
        "message_limit": 10,
        "save_limit": 0,
        "monthly_price": 0
    },
    "standard": {
        "name": "Standard",
        "features": ["Unlimited messages", "50 saved chats", "Chat organization", "Export/Import"],
        "message_limit": -1,  # unlimited
        "save_limit": 50,
        "monthly_price": 4.99
    },
    "premium": {
        "name": "Premium",
        "features": ["Unlimited messages", "Unlimited saved chats", "Advanced organization", "Priority support", "All themes"],
        "message_limit": -1,  # unlimited
        "save_limit": -1,  # unlimited
        "monthly_price": 9.99
    },
    "enterprise": {
        "name": "Enterprise",
        "features": ["Everything in Premium", "Custom AI training", "API access", "Team management"],
        "message_limit": -1,
        "save_limit": -1,
        "monthly_price": 49.99
    }
}

@subscriptions_bp.route("/tiers", methods=["GET"])
def get_subscription_tiers():
    """
    Get all available subscription tiers.
    """
    try:
        return success_response(
            data={"tiers": SUBSCRIPTION_TIERS},
            message="Subscription tiers retrieved successfully"
        )
    except Exception as e:
        logging.error(f"Error retrieving subscription tiers: {str(e)}")
        return error_response(
            message="An error occurred while retrieving subscription tiers",
            status_code=500,
            exc=e
        )

@subscriptions_bp.route("/user", methods=["GET"])
@auth_required
@csrf_protect
def get_user_subscription(user_id):
    """
    Get the current user's subscription info.
    """
    try:
        # Query user's subscription from the database
        subscription_response = supabase.table("subscriptions") \
            .select("*") \
            .eq("user_id", user_id) \
            .single() \
            .execute()
            
        if subscription_response.error and "404" not in str(subscription_response.error):
            return error_response(
                message=f"Failed to retrieve subscription: {subscription_response.error.message}",
                status_code=500
            )
            
        # If no subscription found, default to free tier
        if not subscription_response.data:
            return success_response(
                data={
                    "tier": "free", 
                    "tier_info": SUBSCRIPTION_TIERS["free"], 
                    "status": "active",
                    "expiry_date": None
                },
                message="User subscription retrieved successfully"
            )
            
        subscription = subscription_response.data
        tier = subscription.get("tier", "free")
        
        # Add tier details to response
        subscription["tier_info"] = SUBSCRIPTION_TIERS.get(tier, SUBSCRIPTION_TIERS["free"])
        
        return success_response(
            data=subscription,
            message="User subscription retrieved successfully"
        )
    except Exception as e:
        logging.error(f"Error retrieving user subscription: {str(e)}")
        return error_response(
            message="An error occurred while retrieving user subscription",
            status_code=500,
            exc=e
        )

@subscriptions_bp.route("/", methods=["POST"])
@auth_required
@csrf_protect
def create_subscription(user_id):
    """
    Create or update a subscription for the user.
    
    In a real implementation, this would integrate with a payment processor
    like Stripe, but for this example, we'll just update the database.
    """
    try:
        data = request.json
        if not data:
            return error_response(
                message="No data provided",
                status_code=400
            )
            
        tier = data.get("tier")
        if not tier or tier not in SUBSCRIPTION_TIERS:
            return error_response(
                message="Invalid subscription tier",
                status_code=400
            )
            
        # Check if user already has a subscription
        existing_sub_response = supabase.table("subscriptions") \
            .select("id") \
            .eq("user_id", user_id) \
            .single() \
            .execute()
            
        is_update = not (existing_sub_response.error and "404" in str(existing_sub_response.error))
        
        # Calculate expiry date (1 month from now by default)
        duration_months = data.get("duration_months", 1)
        expiry_date = (datetime.now() + timedelta(days=30 * duration_months)).isoformat()
        
        subscription_data = {
            "user_id": user_id,
            "tier": tier,
            "status": "active",
            "payment_id": data.get("payment_id", str(uuid.uuid4())),  # In real app, this comes from payment processor
            "expiry_date": expiry_date,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        if is_update:
            # Update existing subscription
            subscription_id = existing_sub_response.data.get("id")
            response = supabase.table("subscriptions") \
                .update(subscription_data) \
                .eq("id", subscription_id) \
                .execute()
        else:
            # Create new subscription
            subscription_data["id"] = str(uuid.uuid4())
            response = supabase.table("subscriptions") \
                .insert(subscription_data) \
                .execute()
                
        if response.error:
            return error_response(
                message=f"Failed to {'update' if is_update else 'create'} subscription: {response.error.message}",
                status_code=500
            )
            
        # Add tier details to response
        subscription_data["tier_info"] = SUBSCRIPTION_TIERS.get(tier)
            
        return success_response(
            data=subscription_data,
            message=f"Subscription {'updated' if is_update else 'created'} successfully",
            status_code=200 if is_update else 201
        )
    except Exception as e:
        logging.error(f"Error {'updating' if is_update else 'creating'} subscription: {str(e)}")
        return error_response(
            message=f"An error occurred while {'updating' if is_update else 'creating'} the subscription",
            status_code=500,
            exc=e
        )

@subscriptions_bp.route("/<subscription_id>", methods=["DELETE"])
@auth_required
@csrf_protect
def cancel_subscription(user_id, subscription_id):
    """
    Cancel a user's subscription.
    """
    try:
        # First check if the subscription belongs to the user
        subscription_response = supabase.table("subscriptions") \
            .select("*") \
            .eq("id", subscription_id) \
            .eq("user_id", user_id) \
            .single() \
            .execute()
            
        if subscription_response.error:
            return error_response(
                message="Subscription not found or unauthorized",
                status_code=404 if "404" in str(subscription_response.error) else 403
            )
            
        # Update subscription status to cancelled
        response = supabase.table("subscriptions") \
            .update({"status": "cancelled", "updated_at": datetime.now().isoformat()}) \
            .eq("id", subscription_id) \
            .execute()
            
        if response.error:
            return error_response(
                message=f"Failed to cancel subscription: {response.error.message}",
                status_code=500
            )
            
        return success_response(
            message="Subscription cancelled successfully"
        )
    except Exception as e:
        logging.error(f"Error cancelling subscription: {str(e)}")
        return error_response(
            message="An error occurred while cancelling the subscription",
            status_code=500,
            exc=e
        )