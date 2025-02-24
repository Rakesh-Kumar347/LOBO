import os
import logging
from typing import List, Optional
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import OllamaEmbeddings

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

VECTOR_DB_PATH = "vector_db"  # Path to FAISS storage

def store_vectors(texts: List[str]) -> bool:
    """
    Converts a list of texts into embeddings and stores them in FAISS.

    Args:
        texts (List[str]): List of text documents to embed and store.

    Returns:
        bool: True if successful, False if an error occurs.
    """
    try:
        # Validate input
        if not texts or not all(isinstance(text, str) for text in texts):
            raise ValueError("Input must be a non-empty list of strings.")

        embeddings = OllamaEmbeddings()

        # Load existing FAISS index if available
        if os.path.exists(VECTOR_DB_PATH):
            vectorstore = FAISS.load_local(VECTOR_DB_PATH, embeddings)
            logging.info("Loaded existing FAISS index.")
        else:
            vectorstore = FAISS.from_texts([], embeddings)
            logging.info("Created new FAISS index.")

        # Add new embeddings
        vectorstore.add_texts(texts)
        vectorstore.save_local(VECTOR_DB_PATH)
        logging.info(f"Successfully stored {len(texts)} texts in FAISS.")
        return True

    except Exception as e:
        logging.error(f"Error storing vectors: {str(e)}")
        return False

def load_vector_store() -> Optional[FAISS]:
    """
    Loads the FAISS vector store from disk.

    Returns:
        Optional[FAISS]: Loaded FAISS index, or None if an error occurs.
    """
    try:
        if os.path.exists(VECTOR_DB_PATH):
            embeddings = OllamaEmbeddings()
            vectorstore = FAISS.load_local(VECTOR_DB_PATH, embeddings)
            logging.info("Successfully loaded FAISS index.")
            return vectorstore
        else:
            logging.warning("No existing FAISS index found.")
            return None
    except Exception as e:
        logging.error(f"Error loading FAISS index: {str(e)}")
        return None