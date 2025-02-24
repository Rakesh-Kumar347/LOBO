import os
import logging
import fitz  # PyMuPDF for PDF processing
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from utils.vector_db import store_vectors

# Configure logging
logging.basicConfig(level=logging.ERROR, format="%(asctime)s - %(levelname)s - %(message)s")

files_bp = Blueprint("files", __name__)
UPLOAD_FOLDER = "uploads"
ALLOWED_EXTENSIONS = {"pdf"}  # Only allow PDFs
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB limit

# Ensure the upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    """Check if the file extension is allowed."""
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

@files_bp.route("/upload", methods=["POST"])
def upload_file():
    """
    Handles file upload and processing.

    Expected:
    - File: A PDF document.

    Returns:
        - 200: Success with extracted text.
        - 400: Bad request if file is invalid.
        - 500: Internal error if something goes wrong.
    """
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file provided"}), 400

        file = request.files["file"]
        if file.filename == "" or not allowed_file(file.filename):
            return jsonify({"error": "Invalid or unsupported file format"}), 400

        # Check file size
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        if file_size > MAX_FILE_SIZE:
            return jsonify({"error": "File size exceeds 10 MB"}), 400

        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)

        # Extract text from the uploaded PDF
        extracted_text = extract_text_from_pdf(filepath)
        
        if not extracted_text.strip():
            return jsonify({"error": "Could not extract text from the PDF"}), 400

        # Store extracted text as vector embeddings
        store_vectors(extracted_text)

        return jsonify({"message": "File uploaded and processed successfully", "text": extracted_text[:500]}), 200  # Return only a preview

    except Exception as e:
        logging.error(f"File upload error: {str(e)}")
        return jsonify({"error": "An internal error occurred while processing the file"}), 500
    finally:
        # Clean up uploaded file
        if os.path.exists(filepath):
            os.remove(filepath)

def extract_text_from_pdf(pdf_path):
    """
    Extracts text from a PDF file.

    Args:
        pdf_path (str): Path to the PDF file.

    Returns:
        str: Extracted text.
    """
    text = ""
    try:
        with fitz.open(pdf_path) as doc:
            for page in doc:
                text += page.get_text("text") + "\n"
    except Exception as e:
        logging.error(f"Error extracting text from PDF: {str(e)}")
    return text.strip()