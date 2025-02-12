from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import OllamaEmbeddings

def store_vectors(text):
    """
    Converts text into embeddings and stores them in FAISS.
    """
    embeddings = OllamaEmbeddings()
    vectorstore = FAISS.from_texts([text], embeddings)
    vectorstore.save_local("vector_db")
