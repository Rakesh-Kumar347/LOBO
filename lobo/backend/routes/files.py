# File: lobo/backend/routes/files.py
# Enhancement: Enhanced file upload and processing endpoints

import os
import logging
import fitz  # PyMuPDF for PDF processing
import pandas as pd
from flask import Blueprint, request, jsonify, send_file, abort, g
from werkzeug.utils import secure_filename
from utils.file_handler import (
    save_uploaded_file, store_file_metadata, get_file_by_id,
    get_user_files, delete_file, ALLOWED_EXTENSIONS
)
from utils.vector_db import store_vectors, process_document_for_vectors
from middleware.auth_middleware import auth_required
from middleware.csrf_middleware import csrf_protect
from middleware.rate_limiter import tier_limit_decorator, subscription_required
from utils.api_response import success_response, error_response
from utils.cache import cache_response, invalidate_user_cache
from utils.file_processors import process_pdf, process_text_file, process_csv, process_excel

# Configure logging
logging.basicConfig(level=logging.ERROR, format="%(asctime)s - %(levelname)s - %(message)s")

files_bp = Blueprint("files", __name__)

@files_bp.route("/upload", methods=["POST"])
@auth_required
@csrf_protect
@tier_limit_decorator("files")
def upload_file(user_id):
    """
    Enhanced file upload endpoint with asynchronous processing.

    Expected:
    - multipart/form-data with 'file' field

    Returns:
        - 200: Success with file details
        - 400: Bad request if file is invalid
        - 413: Payload too large if file exceeds size limit
        - 415: Unsupported media type if file type is not allowed
        - 500: Internal error if something goes wrong
    """
    try:
        # Check if file is in request
        if 'file' not in request.files:
            return error_response(
                message="No file provided",
                status_code=400,
                error_code="missing_file"
            )

        file = request.files['file']
        if file.filename == "":
            return error_response(
                message="No file selected",
                status_code=400,
                error_code="empty_filename"
            )

        # Process upload
        success, message, metadata = save_uploaded_file(file)
        if not success:
            # Determine appropriate status code based on error
            if "size exceeds" in message:
                status_code = 413  # Payload Too Large
            elif "type not allowed" in message or "doesn't match extension" in message:
                status_code = 415  # Unsupported Media Type
            else:
                status_code = 400  # Bad Request
                
            return error_response(
                message=message,
                status_code=status_code
            )

        # Store file metadata in database with initial processing status
        file_metadata = {
            **metadata,
            "processing_status": "PENDING",
            "processing_progress": 0
        }
        file_id = store_file_metadata(user_id, file_metadata)
        
        if not file_id:
            return error_response(
                message="Failed to store file metadata",
                status_code=500
            )

        # Invalidate user files cache
        invalidate_user_cache(user_id, "files")

        # Start asynchronous processing task
        from utils.tasks import process_file
        task = process_file.delay(
            file_id,
            metadata.get("file_path", ""),
            metadata.get("mime_type", ""),
            user_id
        )

        # Return response with file details and task ID
        return success_response(
            data={
                "file_id": file_id,
                "original_filename": metadata.get("original_filename", ""),
                "file_size": metadata.get("file_size", 0),
                "mime_type": metadata.get("mime_type", ""),
                "processing_status": "PENDING",
                "processing_progress": 0,
                "task_id": task.id
            },
            message="File uploaded and processing started",
            status_code=202  # Accepted
        )

    except Exception as e:
        logging.error(f"File upload error: {str(e)}")
        return error_response(
            message="An internal error occurred while processing the file",
            status_code=500,
            exc=e
        )

@files_bp.route("/download/<file_id>", methods=["GET"])
@auth_required
@csrf_protect
@tier_limit_decorator("files")
def download_file(user_id, file_id):
    """
    Download a file by ID.
    """
    try:
        # Check if user has access to file
        success, file_data = get_file_by_id(file_id)
        if not success:
            return error_response(
                message="File not found",
                status_code=404
            )
            
        # Verify file ownership
        if file_data.get("user_id") != user_id:
            return error_response(
                message="Unauthorized",
                status_code=403
            )
            
        # Get file path
        metadata = file_data.get("metadata", {})
        file_path = metadata.get("file_path")
        if not file_path or not os.path.exists(file_path):
            return error_response(
                message="File not found on server",
                status_code=404
            )
            
        # Send file
        return send_file(
            file_path,
            as_attachment=True,
            download_name=metadata.get("original_filename", "download"),
            mimetype=metadata.get("mime_type")
        )
            
    except Exception as e:
        logging.error(f"File download error: {str(e)}")
        return error_response(
            message="An error occurred while downloading the file",
            status_code=500,
            exc=e
        )

@files_bp.route("/list", methods=["GET"])
@auth_required
@csrf_protect
@tier_limit_decorator("files")
@cache_response(300)  # Cache for 5 minutes
def list_files(user_id):
    """
    List files uploaded by the user.
    """
    try:
        # Get query parameters
        limit = request.args.get('limit', 50, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        # Get user files
        success, files = get_user_files(user_id, limit, offset)
        if not success:
            return error_response(
                message="Failed to retrieve files",
                status_code=500
            )
            
        # Simplify response data
        simplified_files = []
        for file in files:
            metadata = file.get("metadata", {})
            simplified_files.append({
                "id": file.get("id"),
                "original_filename": file.get("original_filename"),
                "mime_type": file.get("mime_type"),
                "file_size": file.get("file_size"),
                "upload_date": file.get("upload_date"),
                "file_ext": metadata.get("file_ext")
            })
            
        return success_response(
            data={"files": simplified_files, "count": len(simplified_files)},
            message="Files retrieved successfully"
        )
            
    except Exception as e:
        logging.error(f"File listing error: {str(e)}")
        return error_response(
            message="An error occurred while retrieving files",
            status_code=500,
            exc=e
        )

@files_bp.route("/<file_id>", methods=["DELETE"])
@auth_required
@csrf_protect
def delete_user_file(user_id, file_id):
    """
    Delete a file and its metadata.
    """
    try:
        # Delete file
        success = delete_file(file_id, user_id)
        if not success:
            return error_response(
                message="Failed to delete file",
                status_code=404
            )
            
        # Invalidate user files cache
        invalidate_user_cache(user_id, "files")
            
        return success_response(
            message="File deleted successfully"
        )
            
    except Exception as e:
        logging.error(f"File deletion error: {str(e)}")
        return error_response(
            message="An error occurred while deleting the file",
            status_code=500,
            exc=e
        )

@files_bp.route("/types", methods=["GET"])
@auth_required
def get_allowed_file_types(user_id):
    """
    Get a list of allowed file types.
    """
    try:
        # Get user tier from rate limiter middleware
        user_tier = getattr(g, 'user_tier', 'free')
        
        # Check if premium formats should be included
        include_premium = user_tier in ['premium', 'enterprise']
        
        # Get maximum file size
        MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", 10 * 1024 * 1024))  # Default 10MB
        
        file_types = {}
        for ext, mime in ALLOWED_EXTENSIONS.items():
            # Skip premium formats for free/standard users
            if not include_premium and ext in ['pptx', 'ppt', 'docx', 'doc']:
                continue
                
            category = 'document'
            if ext in ['jpg', 'jpeg', 'png', 'gif', 'svg']:
                category = 'image'
            elif ext in ['xlsx', 'xls', 'csv']:
                category = 'spreadsheet'
            elif ext in ['pptx', 'ppt']:
                category = 'presentation'
            elif ext == 'zip':
                category = 'archive'
                
            if category not in file_types:
                file_types[category] = []
                
            file_types[category].append({
                'extension': ext,
                'mime_type': mime,
                'max_size': MAX_FILE_SIZE // (1024 * 1024)  # Convert to MB
            })
            
        return success_response(
            data={"file_types": file_types},
            message="Allowed file types retrieved successfully"
        )
            
    except Exception as e:
        logging.error(f"Error retrieving file types: {str(e)}")
        return error_response(
            message="An error occurred while retrieving file types",
            status_code=500,
            exc=e
        )

# New endpoint to check file processing status
@files_bp.route("/status/<file_id>", methods=["GET"])
@auth_required
@csrf_protect
def get_file_status(user_id, file_id):
    """
    Get file processing status.
    """
    try:
        # Check if user has access to file
        success, file_data = get_file_by_id(file_id)
        if not success:
            return error_response(
                message="File not found",
                status_code=404
            )
            
        # Verify file ownership
        if file_data.get("user_id") != user_id:
            return error_response(
                message="Unauthorized",
                status_code=403
            )
            
        # Return processing status
        return success_response(
            data={
                "file_id": file_id,
                "processing_status": file_data.get("processing_status", "UNKNOWN"),
                "processing_progress": file_data.get("processing_progress", 0),
                "processing_error": file_data.get("processing_error"),
                "text_extracted": file_data.get("text_extracted", False),
                "vectors_stored": file_data.get("vectors_stored", False),
                "preview": file_data.get("text_preview")
            },
            message="File status retrieved successfully"
        )
            
    except Exception as e:
        logging.error(f"Error retrieving file status: {str(e)}")
        return error_response(
            message="An error occurred while retrieving file status",
            status_code=500,
            exc=e
        )

@files_bp.route("/process/<file_id>", methods=["POST"])
@auth_required
@csrf_protect
def process_file_manually(user_id, file_id):
    """
    Trigger manual processing of a file.
    """
    try:
        # Check if user has access to file
        success, file_data = get_file_by_id(file_id)
        if not success:
            return error_response(
                message="File not found",
                status_code=404
            )
            
        # Verify file ownership
        if file_data.get("user_id") != user_id:
            return error_response(
                message="Unauthorized",
                status_code=403
            )
            
        # Check if file is already processing
        if file_data.get("processing_status") == "PROCESSING":
            return error_response(
                message="File is already being processed",
                status_code=400
            )
            
        # Get file details
        metadata = file_data.get("metadata", {})
        file_path = metadata.get("file_path")
        mime_type = metadata.get("mime_type")
        
        if not file_path or not os.path.exists(file_path):
            return error_response(
                message="File not found on server",
                status_code=404
            )
            
        # Update status to processing
        supabase.table("files").update({
            "processing_status": "PROCESSING",
            "processing_progress": 0,
            "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }).eq("id", file_id).execute()
        
        # Trigger asynchronous processing
        from utils.tasks import process_file
        task = process_file.delay(file_id, file_path, mime_type, user_id)
        
        return success_response(
            data={"task_id": task.id},
            message="File processing triggered successfully"
        )
            
    except Exception as e:
        logging.error(f"Error triggering file processing: {str(e)}")
        return error_response(
            message="An error occurred while triggering file processing",
            status_code=500,
            exc=e
        )

@files_bp.route("/search", methods=["GET"])
@auth_required
@csrf_protect
@subscription_required
def search_files(user_id):
    """
    Search files using vector similarity.
    """
    try:
        # Get query parameter
        query = request.args.get('query', '')
        if not query:
            return error_response(
                message="Query parameter is required",
                status_code=400
            )
            
        # Search vectors
        from utils.vector_db import search_vectors
        results = search_vectors(query, top_k=5)
        
        # Extract file IDs from results
        file_ids = [result.get("metadata", {}).get("file_id") for result in results if result.get("metadata", {}).get("file_id")]
        
        # Get file details for the results
        file_details = []
        for file_id in file_ids:
            success, file_data = get_file_by_id(file_id)
            if success and file_data.get("user_id") == user_id:
                file_details.append({
                    "id": file_data.get("id"),
                    "original_filename": file_data.get("original_filename"),
                    "mime_type": file_data.get("mime_type"),
                    "relevance_score": next((r.get("score") for r in results if r.get("metadata", {}).get("file_id") == file_id), 0)
                })
        
        return success_response(
            data={"results": file_details},
            message=f"Found {len(file_details)} files matching your query"
        )
            
    except Exception as e:
        logging.error(f"Error searching files: {str(e)}")
        return error_response(
            message="An error occurred while searching files",
            status_code=500,
            exc=e
        )