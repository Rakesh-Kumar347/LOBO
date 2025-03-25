# File: lobo/backend/schemas/file_schemas.py
# Enhancement: Schemas for API documentation

from marshmallow import Schema, fields

class FileUploadResponseSchema(Schema):
    """Schema for file upload response"""
    success = fields.Boolean(description="Whether the request was successful")
    message = fields.String(description="Response message")
    file_id = fields.String(description="ID of the uploaded file")
    original_filename = fields.String(description="Original filename")
    file_size = fields.Integer(description="File size in bytes")
    mime_type = fields.String(description="MIME type of the file")
    text_extracted = fields.Boolean(description="Whether text was extracted from the file")
    vectors_stored = fields.Boolean(description="Whether vectors were stored for search")
    preview = fields.String(description="Preview of extracted text")
    processing_result = fields.Dict(description="Additional processing information")

class FileListResponseSchema(Schema):
    """Schema for file list response"""
    success = fields.Boolean(description="Whether the request was successful")
    message = fields.String(description="Response message")
    data = fields.Dict(description="Data containing file list")

class FileDeleteResponseSchema(Schema):
    """Schema for file deletion response"""
    success = fields.Boolean(description="Whether the request was successful")
    message = fields.String(description="Response message")