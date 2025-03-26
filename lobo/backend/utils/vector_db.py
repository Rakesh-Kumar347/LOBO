# File: lobo/backend/utils/vector_db.py
import os
import logging
from typing import List, Dict, Optional, Any, Union
import numpy as np
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import OllamaEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# Configuration
VECTOR_DB_PATH = os.getenv("VECTOR_DB_PATH", "vector_db")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "deepseek-r1:1.5b")
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200

# Initialize embeddings model
def get_embeddings():
    """Get embeddings model."""
    return OllamaEmbeddings(model=OLLAMA_MODEL)

def store_vectors(text: str, metadata: Dict[str, Any] = None) -> bool:
    """
    Convert text into embeddings and store in FAISS.

    Args:
        text (str): Text document to embed and store
        metadata (Dict[str, Any], optional): Metadata to associate with the text

    Returns:
        bool: True if successful, False if an error occurs
    """
    try:
        # Validate input
        if not text or not isinstance(text, str):
            logging.warning("Invalid input: text must be a non-empty string.")
            return False
            
        # Create directory if it doesn't exist
        os.makedirs(VECTOR_DB_PATH, exist_ok=True)
        
        # Process text
        text_processed = process_document_for_vectors(text)
        
        # Split text into chunks
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=CHUNK_SIZE,
            chunk_overlap=CHUNK_OVERLAP,
            length_function=len,
        )
        texts = text_splitter.split_text(text_processed)
        
        # Create metadata for each chunk
        metadatas = [metadata or {}] * len(texts)
        
        # Get embeddings
        embeddings = get_embeddings()
        
        # Load existing or create new FAISS index
        if os.path.exists(os.path.join(VECTOR_DB_PATH, "index.faiss")):
            vectorstore = FAISS.load_local(VECTOR_DB_PATH, embeddings)
            logging.info(f"Loaded existing FAISS index from {VECTOR_DB_PATH}")
        else:
            vectorstore = FAISS.from_texts([], embeddings)
            logging.info("Created new FAISS index")
        
        # Add new embeddings
        vectorstore.add_texts(texts, metadatas=metadatas)
        vectorstore.save_local(VECTOR_DB_PATH)
        
        logging.info(f"Successfully stored {len(texts)} text chunks in FAISS")
        return True
    
    except Exception as e:
        logging.error(f"Error storing vectors: {str(e)}")
        return False

def search_vectors(query: str, top_k: int = 5) -> List[Dict[str, Any]]:
    """
    Search for similar texts in the vector store.
    
    Args:
        query (str): Search query
        top_k (int): Number of results to return
        
    Returns:
        List[Dict]: List of results with text and metadata
    """
    try:
        if not os.path.exists(os.path.join(VECTOR_DB_PATH, "index.faiss")):
            logging.warning("No FAISS index found.")
            return []
        
        embeddings = get_embeddings()
        vectorstore = FAISS.load_local(VECTOR_DB_PATH, embeddings)
        
        # Search for similar documents
        results = vectorstore.similarity_search_with_score(query, k=top_k)
        
        # Format results
        formatted_results = []
        for doc, score in results:
            formatted_results.append({
                "text": doc.page_content,
                "metadata": doc.metadata,
                "score": float(score)  # Convert numpy float to Python float
            })
            
        return formatted_results
        
    except Exception as e:
        logging.error(f"Error searching vectors: {str(e)}")
        return []

def process_document_for_vectors(text: str) -> str:
    """
    Process a document to prepare it for vector storage.
    
    Args:
        text (str): Text to process
        
    Returns:
        str: Processed text ready for vector embedding
    """
    if not text:
        return ""
    
    # Basic processing - remove extra whitespace
    processed_text = " ".join(text.split())
    
    # Remove very long sequences of the same character (noise)
    import re
    processed_text = re.sub(r'(.)\1{50,}', r'\1\1\1', processed_text)
    
    # Replace non-UTF8 characters
    processed_text = processed_text.encode('utf-8', 'ignore').decode('utf-8')
    
    return processed_text