# File: lobo/backend/utils/cache.py
# Enhancement: Redis caching implementation for improved performance

import os
import redis
import json
import logging
import time
import hashlib
import pickle
from functools import wraps
from typing import Any, Callable, Dict, List, Optional, Union

# Configure Redis connection
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_DB = int(os.getenv("REDIS_CACHE_DB", 2))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", None)

# Initialize Redis client with connection pooling
redis_pool = redis.ConnectionPool(
    host=REDIS_HOST,
    port=REDIS_PORT,
    db=REDIS_DB,
    password=REDIS_PASSWORD,
    decode_responses=False,  # We'll handle decoding ourselves for flexibility
    max_connections=10       # Adjust based on your application needs
)

# Create redis client
redis_client = redis.Redis(connection_pool=redis_pool)

def initialize_cache():
    """
    Initialize the Redis cache.
    
    Returns:
        bool: True if initialization was successful, False otherwise.
    """
    try:
        if is_redis_available():
            logging.info("Redis cache initialized successfully!")
            return True
        else:
            logging.warning("Redis is not available. Cache functionality will be disabled.")
            return False
    except Exception as e:
        logging.error(f"Error initializing cache: {e}")
        return False

def get_cache_key(prefix: str, *args, **kwargs) -> str:
    """
    Generate a cache key based on function arguments.
    
    Args:
        prefix (str): A prefix for the cache key, typically the function name.
        *args: Positional arguments.
        **kwargs: Keyword arguments.
        
    Returns:
        str: A unique cache key.
    """
    key_parts = [prefix]
    
    # Add all arguments to key parts
    for arg in args:
        if isinstance(arg, (str, int, float, bool)):
            key_parts.append(str(arg))
        else:
            # For complex objects, use their hash or representation
            try:
                key_parts.append(hashlib.md5(str(arg).encode()).hexdigest()[:10])
            except:
                key_parts.append("complex")
    
    # Add sorted keyword arguments
    for k in sorted(kwargs.keys()):
        v = kwargs[k]
        if isinstance(v, (str, int, float, bool)):
            key_parts.append(f"{k}={v}")
        else:
            try:
                key_parts.append(f"{k}={hashlib.md5(str(v).encode()).hexdigest()[:10]}")
            except:
                key_parts.append(f"{k}=complex")
    
    # Join all parts and hash the result
    key_base = ":".join(key_parts)
    return f"cache:{hashlib.md5(key_base.encode()).hexdigest()}"

def cache_response(expiry: int = 300):
    """
    Decorator to cache function responses in Redis.
    
    Args:
        expiry (int): Cache expiration time in seconds. Default is 5 minutes.
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Skip caching if Redis is not available
            if not is_redis_available():
                return func(*args, **kwargs)
            
            # Skip cache for write operations
            if kwargs.get('skip_cache', False):
                return func(*args, **kwargs)
            
            # Generate cache key
            cache_key = get_cache_key(func.__name__, *args, **kwargs)
            
            # Try to get from cache
            cached_data = redis_client.get(cache_key)
            if cached_data:
                try:
                    return pickle.loads(cached_data)
                except Exception as e:
                    logging.error(f"Cache deserialization error: {e}")
            
            # Execute function if not cached
            result = func(*args, **kwargs)
            
            # Cache the result
            try:
                redis_client.setex(
                    cache_key,
                    expiry,
                    pickle.dumps(result)
                )
            except Exception as e:
                logging.error(f"Error caching result: {e}")
            
            return result
        return wrapper
    return decorator

def is_redis_available() -> bool:
    """Check if Redis server is available."""
    try:
        return redis_client.ping()
    except Exception:
        return False

def cache_set(key: str, value: Any, expiry: int = 300) -> bool:
    """
    Store a value in the cache.
    
    Args:
        key (str): Cache key.
        value (Any): Value to cache.
        expiry (int): Cache expiration time in seconds.
        
    Returns:
        bool: True if successful, False otherwise.
    """
    try:
        redis_client.setex(
            f"cache:{key}", 
            expiry, 
            pickle.dumps(value)
        )
        return True
    except Exception as e:
        logging.error(f"Cache set error: {e}")
        return False

def cache_get(key: str) -> Optional[Any]:
    """
    Retrieve a value from the cache.
    
    Args:
        key (str): Cache key.
        
    Returns:
        Optional[Any]: Cached value or None if not found.
    """
    try:
        cached_data = redis_client.get(f"cache:{key}")
        if cached_data:
            return pickle.loads(cached_data)
        return None
    except Exception as e:
        logging.error(f"Cache get error: {e}")
        return None

def cache_delete(key: str) -> bool:
    """
    Delete a value from the cache.
    
    Args:
        key (str): Cache key.
        
    Returns:
        bool: True if successful, False otherwise.
    """
    try:
        redis_client.delete(f"cache:{key}")
        return True
    except Exception as e:
        logging.error(f"Cache delete error: {e}")
        return False

def cache_flush() -> bool:
    """
    Flush all keys in the current Redis database.
    
    Returns:
        bool: True if successful, False otherwise.
    """
    try:
        redis_client.flushdb()
        return True
    except Exception as e:
        logging.error(f"Cache flush error: {e}")
        return False

def cache_invalidate_pattern(pattern: str) -> int:
    """
    Invalidate all keys matching a pattern.
    
    Args:
        pattern (str): Redis key pattern.
        
    Returns:
        int: Number of keys deleted.
    """
    try:
        keys = redis_client.keys(f"cache:{pattern}*")
        if keys:
            return redis_client.delete(*keys)
        return 0
    except Exception as e:
        logging.error(f"Cache pattern invalidation error: {e}")
        return 0

def user_cache_key(user_id: str, resource_type: str, resource_id: str = "") -> str:
    """
    Generate a cache key for user-specific resources.
    
    Args:
        user_id (str): User ID.
        resource_type (str): Type of resource (e.g., 'profile', 'chats').
        resource_id (str, optional): Resource ID when applicable.
        
    Returns:
        str: Cache key.
    """
    if resource_id:
        return f"cache:user:{user_id}:{resource_type}:{resource_id}"
    return f"cache:user:{user_id}:{resource_type}"

def invalidate_user_cache(user_id: str, resource_type: Optional[str] = None) -> int:
    """
    Invalidate all cache entries for a user or specific resource type.
    
    Args:
        user_id (str): User ID.
        resource_type (str, optional): Type of resource to invalidate.
        
    Returns:
        int: Number of keys deleted.
    """
    pattern = f"cache:user:{user_id}"
    if resource_type:
        pattern += f":{resource_type}"
    
    try:
        keys = redis_client.keys(f"{pattern}*")
        if keys:
            return redis_client.delete(*keys)
        return 0
    except Exception as e:
        logging.error(f"User cache invalidation error: {e}")
        return 0