import os
import platform
import subprocess
import sys
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# Define Virtual Environment Directory
VENV_DIR = "venv"

def get_venv_python():
    """Get the path to the Python executable in the virtual environment."""
    if platform.system() == "Windows":
        return os.path.join(VENV_DIR, "Scripts", "python.exe")
    else:
        return os.path.join(VENV_DIR, "bin", "python3")

def create_virtualenv():
    """Create a virtual environment if it doesn't exist."""
    try:
        if not os.path.exists(VENV_DIR):
            logging.info("📌 Creating virtual environment...")
            subprocess.run([sys.executable, "-m", "venv", VENV_DIR], check=True)
            logging.info("✅ Virtual environment created successfully.")
        else:
            logging.info("✅ Virtual environment already exists.")
    except subprocess.CalledProcessError as e:
        logging.error(f"❌ Error creating virtual environment: {e}")
        sys.exit(1)

def install_requirements():
    """Install dependencies from requirements.txt inside the virtual environment."""
    try:
        if not os.path.exists("requirements.txt"):
            logging.error("❌ 'requirements.txt' not found.")
            sys.exit(1)

        logging.info("📦 Installing dependencies...")
        venv_python = get_venv_python()

        # Upgrade pip first
        subprocess.run([venv_python, "-m", "pip", "install", "--upgrade", "pip"], check=True)

        # Install dependencies
        subprocess.run([venv_python, "-m", "pip", "install", "-r", "requirements.txt"], check=True)

        logging.info("✅ Dependencies installed successfully!")

    except subprocess.CalledProcessError as e:
        logging.error(f"❌ Error installing dependencies: {e}")
        sys.exit(1)

def main():
    """Main function to set up the backend environment."""
    logging.info("\n🔧 Starting Backend Setup...\n")
    
    create_virtualenv()
    install_requirements()
    
    logging.info("\n🚀 Setup complete! Run 'run_backend.bat' (Windows) or 'python app.py' to start the server.")

if __name__ == "__main__":
    main()