# File: lobo/backend/utils/file_handler.py
# Enhancement: Enhanced file handling with validation, processing, and storage

import os
import uuid
import logging
import tempfile
import shutil
import hashlib
from typing import Dict, List, Optional, Tuple, Union
from werkzeug.utils import secure_filename
from flask import current_app
import mimetypes
import os
import PyPDF2
from PIL import Image
import io

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# File storage configuration
UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", "uploads")
TEMP_FOLDER = os.getenv("TEMP_FOLDER", "tmp")
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", 10 * 1024 * 1024))  # 10 MB default

# Define allowed file types
ALLOWED_EXTENSIONS = {
    # Documents
    'pdf': 'application/pdf',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'doc': 'application/msword',
    'txt': 'text/plain',
    'md': 'text/markdown',
    'rtf': 'application/rtf',
    
    # Spreadsheets
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'xls': 'application/vnd.ms-excel',
    'csv': 'text/csv',
    
    # Presentations
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'ppt': 'application/vnd.ms-powerpoint',
    
    # Images
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    
    # Archives
    'zip': 'application/zip',
}

# Ensure folders exist
def ensure_folders_exist():
    """Ensure that upload and temp folders exist."""
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(TEMP_FOLDER, exist_ok=True)

# Call this function at import time
ensure_folders_exist()

def is_allowed_file(filename: str, content_type: str = None) -> bool:
    """
    Check if a file is allowed based on extension and content type.
    
    Args:
        filename (str): Filename with extension
        content_type (str, optional): MIME content type if available
        
    Returns:
        bool: Whether the file is allowed
    """
    # Check file extension
    ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
    if ext not in ALLOWED_EXTENSIONS:
        return False
    
    # If content type is provided, validate against allowed types
    if content_type and ext in ALLOWED_EXTENSIONS:
        expected_type = ALLOWED_EXTENSIONS[ext]
        return expected_type == content_type or content_type.startswith(expected_type.split('/')[0])
    
    return True

# Function to detect MIME type using file extension
def detect_mimetype(file_path: str) -> str:
    """
    Detect MIME type of a file using file extension.
    
    Args:
        file_path (str): Path to the file
        
    Returns:
        str: MIME type
    """
    try:
        # Get file extension
        _, ext = os.path.splitext(file_path)
        if ext:
            # Use mimetypes library to guess type from extension
            mime_type, _ = mimetypes.guess_type(file_path)
            if mime_type:
                return mime_type
        
        # Try to determine type based on common extensions
        ext = ext.lower()
        if ext == '.pdf':
            return 'application/pdf'
        elif ext in ['.jpg', '.jpeg']:
            return 'image/jpeg'
        elif ext == '.png':
            return 'image/png'
        elif ext == '.txt':
            return 'text/plain'
        elif ext == '.csv':
            return 'text/csv'
        elif ext == '.xlsx':
            return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        elif ext == '.xls':
            return 'application/vnd.ms-excel'
        
        # Default to octet-stream if type cannot be determined
        return 'application/octet-stream'
    except Exception as e:
        logging.error(f"Error detecting MIME type: {e}")
        return 'application/octet-stream'

def validate_file(file_path: str, filename: str) -> Tuple[bool, str]:
    """
    Validate a file's content and security.
    
    Args:
        file_path (str): Path to the file
        filename (str): Original filename
        
    Returns:
        Tuple[bool, str]: (is_valid, error_message)
    """
    # Check if file exists
    if not os.path.exists(file_path):
        return False, "File not found"
    
    # Check file size
    if os.path.getsize(file_path) > MAX_FILE_SIZE:
        return False, f"File size exceeds maximum allowed ({MAX_FILE_SIZE // 1024 // 1024} MB)"
    
    # Detect MIME type
    detected_mime = detect_mimetype(file_path)
    
    # Check if file extension matches content
    ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
    if ext in ALLOWED_EXTENSIONS:
        expected_mime = ALLOWED_EXTENSIONS[ext]
        if not (detected_mime == expected_mime or 
                detected_mime.startswith(expected_mime.split('/')[0])):
            return False, f"File content doesn't match extension (detected: {detected_mime})"
    
    # Check if MIME type is allowed
    if not any(detected_mime == mime or detected_mime.startswith(mime.split('/')[0]) 
              for mime in ALLOWED_EXTENSIONS.values()):
        return False, f"File type not allowed (detected: {detected_mime})"
    
    # For certain file types, perform additional validation
    if detected_mime == 'application/pdf':
        try:
            with open(file_path, 'rb') as pdf_file:
                pdf_reader = PyPDF2.PdfReader(pdf_file)
                # Check if the PDF has any pages
                if len(pdf_reader.pages) == 0:
                    return False, "Invalid PDF: no pages found"
        except Exception as e:
            return False, f"Invalid PDF file: {str(e)}"
    
    elif detected_mime.startswith('image/'):
        try:
            with Image.open(file_path) as img:
                img.verify()
        except Exception as e:
            return False, f"Invalid image file: {str(e)}"
    
    return True, ""

def save_uploaded_file(file, filename: str = None) -> Tuple[bool, str, Dict]:
    """
    Save an uploaded file with validation.
    
    Args:
        file: File object from request
        filename (str, optional): Filename to use instead of original
        
    Returns:
        Tuple[bool, str, Dict]: (success, message_or_path, metadata)
    """
    if not file:
        return False, "No file provided", {}
    
    # Get filename, either provided or from file object
    original_filename = filename or file.filename
    if not original_filename:
        return False, "No filename provided", {}
    
    # Secure the filename
    secure_name = secure_filename(original_filename)
    
    # Generate a unique filename to prevent overwriting
    file_uuid = str(uuid.uuid4())
    ext = secure_name.rsplit('.', 1)[1].lower() if '.' in secure_name else ''
    unique_filename = f"{file_uuid}.{ext}" if ext else file_uuid
    
    # Create a temporary file
    temp_path = os.path.join(TEMP_FOLDER, unique_filename)
    
    try:
        # Save the file to temp folder
        file.save(temp_path)
        
        # Validate the file
        is_valid, error_message = validate_file(temp_path, secure_name)
        if not is_valid:
            # Clean up invalid file
            if os.path.exists(temp_path):
                os.remove(temp_path)
            return False, error_message, {}
        
        # Calculate file hash
        file_hash = calculate_file_hash(temp_path)
        
        # Move file to upload folder
        upload_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        shutil.move(temp_path, upload_path)
        
        # Create metadata
        metadata = {
            "original_filename": original_filename,
            "secure_filename": secure_name,
            "storage_filename": unique_filename,
            "file_path": upload_path,
            "relative_path": unique_filename,
            "file_size": os.path.getsize(upload_path),
            "mime_type": detect_mimetype(upload_path),
            "file_hash": file_hash,
            "file_ext": ext,
            "upload_date": datetime.datetime.now().isoformat()
        }
        
        return True, upload_path, metadata
        
    except Exception as e:
        # Clean up on error
        if os.path.exists(temp_path):
            os.remove(temp_path)
        logging.error(f"File upload error: {str(e)}")
        return False, f"Error saving file: {str(e)}", {}

def calculate_file_hash(file_path: str) -> str:
    """
    Calculate SHA-256 hash of a file.
    
    Args:
        file_path (str): Path to the file
        
    Returns:
        str: SHA-256 hash as hexadecimal string
    """
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        # Read in chunks to handle large files
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

def store_file_metadata(user_id: str, metadata: Dict) -> str:
    """
    Store file metadata in the database.
    
    Args:
        user_id (str): User ID
        metadata (Dict): File metadata
        
    Returns:
        str: File ID if successful, empty string otherwise
    """
    try:
        from utils.database import supabase
        
        # Generate a unique ID for the file
        file_id = str(uuid.uuid4())
        
        # Prepare file entry
        file_entry = {
            "id": file_id,
            "user_id": user_id,
            "original_filename": metadata.get("original_filename", ""),
            "storage_filename": metadata.get("storage_filename", ""),
            "mime_type": metadata.get("mime_type", ""),
            "file_size": metadata.get("file_size", 0),
            "file_hash": metadata.get("file_hash", ""),
            "upload_date": metadata.get("upload_date", datetime.datetime.now().isoformat()),
            "metadata": metadata
        }
        
        # Insert into database
        response = supabase.table("files").insert(file_entry).execute()
        
        if response.error:
            logging.error(f"Error storing file metadata: {response.error}")
            return ""
            
        return file_id
            
    except Exception as e:
        logging.error(f"Error storing file metadata: {str(e)}")
        return ""

def get_file_by_id(file_id: str) -> Tuple[bool, Dict]:
    """
    Retrieve file information by ID.
    
    Args:
        file_id (str): File ID
        
    Returns:
        Tuple[bool, Dict]: (success, file_data)
    """
    try:
        from utils.database import supabase
        
        response = supabase.table("files").select("*").eq("id", file_id).single().execute()
        
        if response.error:
            logging.error(f"Error retrieving file: {response.error}")
            return False, {}
            
        if not response.data:
            return False, {}
            
        return True, response.data
            
    except Exception as e:
        logging.error(f"Error retrieving file: {str(e)}")
        return False, {}

def get_user_files(user_id: str, limit: int = 50, offset: int = 0) -> Tuple[bool, List[Dict]]:
    """
    Get files belonging to a user.
    
    Args:
        user_id (str): User ID
        limit (int): Maximum number of files to return
        offset (int): Offset for pagination
        
    Returns:
        Tuple[bool, List[Dict]]: (success, files)
    """
    try:
        from utils.database import supabase
        
        response = supabase.table("files") \
            .select("*") \
            .eq("user_id", user_id) \
            .order("upload_date", desc=True) \
            .range(offset, offset + limit - 1) \
            .execute()
        
        if response.error:
            logging.error(f"Error retrieving user files: {response.error}")
            return False, []
            
        return True, response.data or []
            
    except Exception as e:
        logging.error(f"Error retrieving user files: {str(e)}")
        return False, []

def delete_file(file_id: str, user_id: str) -> bool:
    """
    Delete a file and its metadata.
    
    Args:
        file_id (str): File ID
        user_id (str): User ID for authorization
        
    Returns:
        bool: True if deletion was successful
    """
    try:
        from utils.database import supabase
        
        # First get the file to check ownership and get storage filename
        success, file_data = get_file_by_id(file_id)
        if not success:
            return False
            
        # Check if user owns the file
        if file_data.get("user_id") != user_id:
            logging.error(f"Unauthorized attempt to delete file {file_id} by user {user_id}")
            return False
            
        # Get storage filename
        storage_filename = file_data.get("storage_filename")
        if not storage_filename:
            return False
            
        # Delete from filesystem
        file_path = os.path.join(UPLOAD_FOLDER, storage_filename)
        if os.path.exists(file_path):
            os.remove(file_path)
            
        # Delete from database
        response = supabase.table("files").delete().eq("id", file_id).execute()
        
        if response.error:
            logging.error(f"Error deleting file metadata: {response.error}")
            return False
            
        return True
            
    except Exception as e:
        logging.error(f"Error deleting file: {str(e)}")
        return False