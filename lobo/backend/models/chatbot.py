from langchain_ollama import OllamaLLM
from config import Config

class Chatbot:
    """Chatbot using LangChain and Ollama."""

    def __init__(self):
        self.llm = OllamaLLM(model=Config.OLLAMA_MODEL)

    def generate_response(self, prompt: str) -> str:
        """Generates a response from the AI model."""
        try:
            response = self.llm.invoke(prompt)
            return response
        except Exception as e:
            return f"Error generating response: {str(e)}"
