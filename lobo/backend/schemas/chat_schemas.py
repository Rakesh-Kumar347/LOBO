# File: lobo/backend/schemas/chat_schemas.py
# Enhancement: Schemas for API documentation

from marshmallow import Schema, fields

class MessageSchema(Schema):
    """Schema for chat message"""
    role = fields.String(required=True, description="Message role (user/assistant)")
    content = fields.String(required=True, description="Message content")

class ChatRequestSchema(Schema):
    """Schema for chat request"""
    message = fields.String(required=True, description="User message")
    chat_id = fields.String(description="Chat ID for existing conversation")
    regenerate = fields.Boolean(description="Whether to regenerate the last response")

class ChatResponseSchema(Schema):
    """Schema for chat response"""
    success = fields.Boolean(description="Whether the request was successful")
    response = fields.String(description="AI response")
    chat_id = fields.String(description="ID of the chat")

class ChatHistoryRequestSchema(Schema):
    """Schema for creating or updating chat history"""
    title = fields.String(required=True, description="Chat title")
    messages = fields.List(fields.Nested(MessageSchema), required=True, description="Chat messages")
    category = fields.String(description="Chat category")

class ChatHistoryResponseSchema(Schema):
    """Schema for chat history response"""
    success = fields.Boolean(description="Whether the request was successful")
    message = fields.String(description="Response message")
    chat_id = fields.String(description="ID of the chat")

class ChatListResponseSchema(Schema):
    """Schema for chat list response"""
    success = fields.Boolean(description="Whether the request was successful")
    message = fields.String(description="Response message")
    data = fields.Dict(description="Data containing chat list")

class ChatSearchRequestSchema(Schema):
    """Schema for chat search request"""
    query = fields.String(description="Search query")
    category = fields.String(description="Category filter")