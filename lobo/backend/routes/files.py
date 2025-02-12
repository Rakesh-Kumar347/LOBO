import os
import fitz  # PyMuPDF for PDF processing
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.vectorstores import FAISS
from utils.vector_db import store_vectors

files_bp = Blueprint("files", __name__)
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@files_bp.route("/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "Invalid file name"}), 400

    filename = secure_filename(file.filename)
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)

    text = extract_text_from_pdf(filepath)
    store_vectors(text)

    return jsonify({"message": "File uploaded and processed"}), 200

def extract_text_from_pdf(pdf_path):
    text = ""
    with fitz.open(pdf_path) as doc:
        for page in doc:
            text += page.get_text("text")
    return text
