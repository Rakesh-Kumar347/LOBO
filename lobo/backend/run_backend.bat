@echo off
python setup.py
echo Activating virtual environment...
call venv\Scripts\activate
echo Running Flask backend...
python app.py
