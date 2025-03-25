# File: lobo/backend/schemas/subscription_schemas.py
# Enhancement: Schemas for API documentation

from marshmallow import Schema, fields

class SubscriptionTierSchema(Schema):
    """Schema for subscription tier details"""
    name = fields.String(description="Tier name")
    features = fields.List(fields.String(), description="List of features")
    message_limit = fields.Integer(description="Message limit per session")
    save_limit = fields.Integer(description="Number of chats that can be saved")
    monthly_price = fields.Float(description="Monthly price")

class SubscriptionRequestSchema(Schema):
    """Schema for subscription request"""
    tier = fields.String(required=True, description="Subscription tier")
    duration_months = fields.Integer(description="Subscription duration in months")
    payment_id = fields.String(description="Payment ID from payment processor")

class SubscriptionResponseSchema(Schema):
    """Schema for subscription response"""
    success = fields.Boolean(description="Whether the request was successful")
    message = fields.String(description="Response message")
    data = fields.Dict(description="Subscription details")

class SubscriptionCancelResponseSchema(Schema):
    """Schema for subscription cancel response"""
    success = fields.Boolean(description="Whether the request was successful")
    message = fields.String(description="Response message")