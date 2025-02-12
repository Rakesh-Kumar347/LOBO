from werkzeug.security import generate_password_hash, check_password_hash
from utils.database import users_collection

class User:
    @staticmethod
    def create_user(username, password):
        hashed_password = generate_password_hash(password)
        users_collection.insert_one({"username": username, "password": hashed_password})

    @staticmethod
    def verify_user(username, password):
        user = users_collection.find_one({"username": username})
        if user and check_password_hash(user["password"], password):
            return user
        return None
