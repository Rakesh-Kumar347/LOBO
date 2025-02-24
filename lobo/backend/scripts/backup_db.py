# scripts/backup_db.py
import os
import shutil
from datetime import datetime

def backup_database():
    backup_dir = "backups"
    os.makedirs(backup_dir, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = os.path.join(backup_dir, f"backup_{timestamp}.sql")

    # Example: Use pg_dump to back up PostgreSQL database
    os.system(f"pg_dump your_database_name > {backup_file}")
    print(f"✅ Database backed up to {backup_file}")

if __name__ == "__main__":
    backup_database()