# File: lobo/backend/schemas/auth_schemas.py
# Enhancement: Schemas for API documentation

from marshmallow import Schema, fields

class LoginRequestSchema(Schema):
    """Schema for login request"""
    email = fields.Email(required=True, description="User email address")
    password = fields.String(required=True, description="User password")

class LoginResponseSchema(Schema):
    """Schema for login response"""
    success = fields.Boolean(description="Whether the request was successful")
    message = fields.String(description="Response message")
    access_token = fields.String(description="JWT access token")
    refresh_token = fields.String(description="JWT refresh token")
    user = fields.Dict(description="User information")

class SignupRequestSchema(Schema):
    """Schema for signup request"""
    email = fields.Email(required=True, description="User email address")
    password = fields.String(required=True, description="User password")
    full_name = fields.String(required=True, description="User's full name")

class SignupResponseSchema(Schema):
    """Schema for signup response"""
    success = fields.Boolean(description="Whether the request was successful")
    message = fields.String(description="Response message")
    user_id = fields.String(description="ID of the created user")

class RefreshTokenRequestSchema(Schema):
    """Schema for token refresh request"""
    refresh_token = fields.String(required=True, description="JWT refresh token")

class RefreshTokenResponseSchema(Schema):
    """Schema for token refresh response"""
    success = fields.Boolean(description="Whether the request was successful")
    access_token = fields.String(description="New JWT access token")
    refresh_token = fields.String(description="New JWT refresh token")