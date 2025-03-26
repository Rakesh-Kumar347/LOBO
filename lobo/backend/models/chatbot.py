import logging
from typing import Optional
from langchain_ollama import OllamaLLM
from config import Config

# Configure logging
logging.basicConfig(level=logging.ERROR, format="%(asctime)s - %(levelname)s - %(message)s")

class Chatbot:
    """A chatbot powered by LangChain and Ollama.

    Attributes:
        llm (OllamaLLM): The language model used for generating responses.
    """

    def __init__(self):
        """Initialize the chatbot with the configured Ollama model."""
        if not Config.OLLAMA_MODEL:
            raise ValueError("Ollama model is not configured in Config.")
        self.llm = OllamaLLM(model=Config.OLLAMA_MODEL)

    def generate_response(self, prompt: str, temperature: float = 0.7, max_tokens: int = 512) -> Optional[str]:
        """
        Generates a response from the AI model.

        Args:
            prompt (str): The user input prompt.
            temperature (float): Controls randomness (higher = more creative). Defaults to 0.7.
            max_tokens (int): Limits the length of the response. Defaults to 512.

        Returns:
            Optional[str]: AI-generated response, or None if an error occurs.
        """
        try:
            response = self.llm.invoke(prompt)
            return response
        except Exception as e:
            logging.error(f"Error generating response for prompt: '{prompt}'. Error: {str(e)}")
            return None