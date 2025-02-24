# middleware/rate_limiter.py
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100 per minute"]
)

def init_rate_limiter(app):
    """
    Initialize rate limiting for the Flask app.
    """
    limiter.init_app(app)