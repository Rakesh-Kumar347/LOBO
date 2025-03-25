# File: lobo/backend/celery_worker.py
# Enhancement: Celery worker script

import os
from dotenv import load_dotenv
from utils.tasks import celery_app

if __name__ == "__main__":
    # Load environment variables
    load_dotenv()
    
    # Start Celery worker
    celery_app.worker_main(["worker", "--loglevel=info"])