import os
import subprocess
import sys

# Define the virtual environment directory
VENV_DIR = "venv"

def create_virtualenv():
    """Create a virtual environment if it doesn't exist."""
    if not os.path.exists(VENV_DIR):
        print("📌 Creating virtual environment...")
        subprocess.run([sys.executable, "-m", "venv", VENV_DIR], check=True)
    else:
        print("✅ Virtual environment already exists.")

def install_requirements():
    """Install dependencies from requirements.txt inside the virtual environment."""
    print("📦 Installing dependencies...")
    venv_python = os.path.join(VENV_DIR, "Scripts", "python.exe") if os.name == "nt" else os.path.join(VENV_DIR, "bin", "python3")
    
    # Install packages
    subprocess.run([venv_python, "-m", "pip", "install", "--upgrade", "pip"], check=True)
    subprocess.run([venv_python, "-m", "pip", "install", "-r", "requirements.txt"], check=True)

def main():
    """Main function to setup the project."""
    create_virtualenv()
    install_requirements()
    print("🚀 Setup complete! Run 'run_backend.bat' to start the server.")

if __name__ == "__main__":
    main()
