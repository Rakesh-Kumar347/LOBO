# scripts/seed_db.py
from utils.database import insert_data

def seed_users():
    users = [
        {"email": "user1@example.com", "password": "password1", "full_name": "User One"},
        {"email": "user2@example.com", "password": "password2", "full_name": "User Two"},
    ]
    for user in users:
        insert_data("users", user)

if __name__ == "__main__":
    seed_users()
    print("✅ Database seeded successfully!")