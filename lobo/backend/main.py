import os
import sys
import subprocess
from pathlib import Path

def print_status(message, symbol="ℹ️"):
    print(f"[{symbol}] {message}")

def main():
    # Initial setup messages
    print_status("This script is designed for Windows only.")
    print_status("Setting up the virtual environment...", "🔧")

    # Check if requirements.txt exists
    if not os.path.exists("requirements.txt"):
        print_status("'requirements.txt' not found.", "❌")
        input("Press Enter to exit...")
        sys.exit(1)

    # Run setup.py
    try:
        subprocess.run([sys.executable, "setup.py"], check=True)
    except subprocess.CalledProcessError:
        print_status("Failed to set up the virtual environment.", "❌")
        input("Press Enter to exit...")
        sys.exit(1)

    print_status("Virtual environment is ready.", "✅")
    print_status("Activating virtual environment...", "🔄")

    # Check if virtual environment exists
    venv_activate = Path("venv/Scripts/activate")
    if not venv_activate.exists():
        print_status("Virtual environment not found. Run setup.py first.", "❌")
        input("Press Enter to exit...")
        sys.exit(1)

    # Activate virtual environment and run Flask app
    try:
        # Construct the command to activate venv and run app.py
        activate_cmd = str(venv_activate.absolute())
        # On Windows, we need to use 'call' and chain commands with '&'
        cmd = f"call {activate_cmd} & python app.py"
        
        # Run the Flask backend
        print_status("Starting Flask backend...", "🚀")
        result = subprocess.run(cmd, shell=True)
        
        if result.returncode != 0:
            print_status("Failed to start the Flask backend.", "❌")
            sys.exit(1)

    except Exception as e:
        print_status(f"Error occurred: {str(e)}", "❌")
        sys.exit(1)

if __name__ == "__main__":
    main()