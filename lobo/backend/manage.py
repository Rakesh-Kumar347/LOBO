# File: lobo/backend/manage.py
#!/usr/bin/env python3
"""
Management CLI for LOBO backend operations.
Run with: python manage.py [command]
"""

import argparse
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def run_server(args):
    """Run the Flask development server."""
    from app import app
    
    debug = args.debug or os.getenv("FLASK_DEBUG", "True").lower() == "true"
    port = args.port or int(os.getenv("PORT", 5000))
    
    print(f"🚀 Starting Flask App (Debug: {debug}, Port: {port})")
    app.run(debug=debug, host="0.0.0.0", port=port)

def run_worker(args):
    """Run the Celery worker."""
    from celery_worker import celery_app
    
    loglevel = args.loglevel or "info"
    print(f"🚀 Starting Celery Worker (Log level: {loglevel})")
    
    celery_args = ["worker", f"--loglevel={loglevel}"]
    celery_app.worker_main(celery_args)

def run_backup(args):
    """Run database backup."""
    from scripts.backup_db import backup_database
    
    print("📦 Running database backup...")
    backup_database()

def run_seed(args):
    """Seed the database with initial data."""
    from scripts.seed_db import seed_users
    
    print("🌱 Seeding database...")
    seed_users()

def main():
    """Main entry point for the CLI."""
    parser = argparse.ArgumentParser(description="LOBO Management CLI")
    subparsers = parser.add_subparsers(dest="command", help="Command to run")
    
    # Server command
    server_parser = subparsers.add_parser("server", help="Run the Flask server")
    server_parser.add_argument("--debug", action="store_true", help="Run in debug mode")
    server_parser.add_argument("--port", type=int, help="Port to run on")
    
    # Worker command
    worker_parser = subparsers.add_parser("worker", help="Run the Celery worker")
    worker_parser.add_argument("--loglevel", help="Log level (default: info)")
    
    # Backup command
    backup_parser = subparsers.add_parser("backup", help="Backup the database")
    
    # Seed command
    seed_parser = subparsers.add_parser("seed", help="Seed the database")
    
    args = parser.parse_args()
    
    if args.command == "server":
        run_server(args)
    elif args.command == "worker":
        run_worker(args)
    elif args.command == "backup":
        run_backup(args)
    elif args.command == "seed":
        run_seed(args)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()