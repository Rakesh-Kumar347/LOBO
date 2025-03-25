# File: lobo/backend/utils/database.py
# Enhancement: Database connection pooling and improved error handling

import os
import logging
import time
from typing import Dict, List, Optional, Tuple, Union, Any
from supabase import create_client, Client
# from postgres_pool import PoolHelper
# from postgres_pool.conn_pool import ConnectionPool
from dotenv import load_dotenv
from functools import wraps
from contextlib import contextmanager
from psycopg2 import pool


# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# Load environment variables
load_dotenv()

# Supabase client
supabase: Client = None

# Initialize Postgres connection pool only if all required env vars are present
db_pool = None
if all([
    os.getenv("POSTGRES_HOST"),
    os.getenv("POSTGRES_USER"),
    os.getenv("POSTGRES_PASSWORD"),
    os.getenv("POSTGRES_DB")
]):
    try:
        db_pool = pool.ThreadedConnectionPool(
            minconn=5,
            maxconn=20,
            host=os.getenv("POSTGRES_HOST"),
            port=int(os.getenv("POSTGRES_PORT", "5432")),
            user=os.getenv("POSTGRES_USER"),
            password=os.getenv("POSTGRES_PASSWORD"),
            database=os.getenv("POSTGRES_DB")
        )
        logging.info("PostgreSQL connection pool initialized successfully!")
    except Exception as e:
        logging.warning(f"Could not initialize PostgreSQL pool: {e}")
        db_pool = None
else:
    logging.info("Direct PostgreSQL connection disabled - missing configuration")

def initialize_db(retries: int = 3, delay: int = 2):
    """Initialize Supabase database connection with retry logic."""
    global supabase, db_pool
    
    for i in range(retries):
        try:
            # Initialize Supabase client
            supabase_url = os.getenv("SUPABASE_URL")
            supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
            
            if not supabase_url or not supabase_key:
                logging.warning("Missing Supabase URL or Service Role Key in .env file.")
                return  # Return without raising exception
            
            supabase = create_client(supabase_url, supabase_key)
            logging.info("Supabase client initialized successfully!")
            
            # Try to initialize Postgres connection pool, but don't fail if it's not available
            try:
                from psycopg2 import pool
                
                # Initialize pool only if all required env vars are present
                db_url = os.getenv("SUPABASE_DB_URL")
                pg_host = os.getenv("POSTGRES_HOST")
                pg_user = os.getenv("POSTGRES_USER")
                pg_pass = os.getenv("POSTGRES_PASSWORD")
                pg_db = os.getenv("POSTGRES_DB")
                
                if all([pg_host, pg_user, pg_pass, pg_db]):
                    db_pool = pool.ThreadedConnectionPool(
                        minconn=5,
                        maxconn=20,
                        host=pg_host,
                        port=int(os.getenv("POSTGRES_PORT", "5432")),
                        user=pg_user,
                        password=pg_pass,
                        database=pg_db
                    )
                    logging.info("PostgreSQL connection pool initialized successfully!")
                else:
                    logging.info("Direct PostgreSQL connection disabled - missing configuration")
            except Exception as e:
                logging.warning(f"Could not initialize PostgreSQL pool: {e}")
                logging.info("The application will continue with Supabase client only")
                db_pool = None
                
            # Successfully initialized Supabase client
            return
                
        except Exception as e:
            logging.error(f"Database connection failed (attempt {i + 1}/{retries}): {e}")
            if i < retries - 1:
                time.sleep(delay)
    
    # If we reached here, Supabase initialization failed
    logging.error("Failed to initialize database connections after multiple attempts.")
    supabase = None
    db_pool = None
    
    # Attempt to continue with mock/dummy database for development
    try:
        logging.warning("Attempting to initialize mock database for development...")
        # Create a simple mock for supabase
        from unittest.mock import MagicMock
        supabase = MagicMock()
        supabase.table.return_value.select.return_value.execute.return_value.data = []
        logging.info("Mock database initialized for development")
    except Exception as mock_error:
        logging.error(f"Failed to initialize mock database: {mock_error}")
        # Don't raise error - allow app to start with limited functionality
    
    # If we reached here, all attempts failed
    logging.error("Failed to initialize database connections after multiple attempts.")
    supabase = None
    db_pool = None
    raise RuntimeError("Failed to initialize database connections")

@contextmanager
def get_db_connection():
    """Context manager for getting a database connection from the pool."""
    if db_pool is None:
        raise RuntimeError("Database connection pool is not initialized. Check your configuration.")
        
    conn = None
    try:
        conn = db_pool.getconn()
        yield conn
    finally:
        if conn is not None:
            db_pool.putconn(conn)

def with_db_connection(f):
    """
    Decorator that provides a database connection to the decorated function.
    
    Example:
        @with_db_connection
        def my_function(conn, *args, **kwargs):
            # Use connection
    """
    @wraps(f)
    def wrapper(*args, **kwargs):
        with get_db_connection() as conn:
            return f(conn, *args, **kwargs)
    return wrapper

def execute_query(
    query: str, 
    params: tuple = None, 
    fetch_all: bool = True
) -> Union[List[Dict], Dict, None]:
    """
    Execute a SQL query with proper connection handling.
    
    Args:
        query (str): SQL query to execute.
        params (tuple, optional): Parameters for the query.
        fetch_all (bool): Whether to fetch all results or just one.
        
    Returns:
        Union[List[Dict], Dict, None]: Query results or None on error.
    """
    try:
        if db_pool is None:
            raise RuntimeError("Database connection pool is not initialized")
            
        with get_db_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(query, params or ())
                
                # Check if query is a SELECT
                if query.strip().upper().startswith("SELECT"):
                    columns = [desc[0] for desc in cursor.description]
                    
                    if fetch_all:
                        rows = cursor.fetchall()
                        result = [dict(zip(columns, row)) for row in rows]
                        return result
                    else:
                        row = cursor.fetchone()
                        if row:
                            return dict(zip(columns, row))
                        return None
                else:
                    # For INSERT, UPDATE, DELETE, just return affected rows
                    return {"affected_rows": cursor.rowcount}
                    
    except Exception as e:
        logging.error(f"Database query error: {e}")
        logging.error(f"Query: {query}")
        if params:
            logging.error(f"Params: {params}")
        return None

def transaction(func):
    """
    Decorator to wrap a function in a database transaction.
    
    Example:
        @transaction
        def transfer_funds(conn, from_account, to_account, amount):
            # All operations inside will be in a transaction
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        if db_pool is None:
            raise RuntimeError("Database connection pool is not initialized")
            
        with get_db_connection() as conn:
            try:
                # Start transaction
                conn.autocommit = False
                
                # Execute function with the connection
                result = func(conn, *args, **kwargs)
                
                # Commit the transaction
                conn.commit()
                return result
                
            except Exception as e:
                # Rollback transaction on error
                conn.rollback()
                logging.error(f"Transaction error: {e}")
                raise
                
            finally:
                # Reset autocommit mode
                conn.autocommit = True
                
    return wrapper

# Supabase table helper functions
def get_supabase_table(table_name: str):
    """Get a Supabase table query builder."""
    if supabase is None:
        raise RuntimeError("Supabase client is not initialized")
    return supabase.table(table_name)

def fetch_data(
    table: str, 
    columns: str = "*", 
    filters: Dict = None, 
    order_by: str = None,
    desc: bool = False,
    limit: int = None,
    offset: int = None
) -> Tuple[bool, List[Dict]]:
    """
    Fetch data from a Supabase table with error handling.
    
    Args:
        table (str): Table name.
        columns (str): Columns to select.
        filters (Dict): Filters to apply.
        order_by (str): Column to order by.
        desc (bool): Whether to order in descending order.
        limit (int): Maximum number of rows to return.
        offset (int): Offset for pagination.
        
    Returns:
        Tuple[bool, List[Dict]]: (success, data)
    """
    try:
        if supabase is None:
            raise RuntimeError("Supabase client is not initialized")
            
        query = supabase.table(table).select(columns)
        
        # Apply filters
        if filters:
            for column, value in filters.items():
                if isinstance(value, list):
                    query = query.in_(column, value)
                else:
                    query = query.eq(column, value)
        
        # Apply order
        if order_by:
            query = query.order(order_by, desc=desc)
            
        # Apply limit and offset
        if limit is not None:
            query = query.limit(limit)
        if offset is not None:
            query = query.offset(offset)
            
        # Execute query
        response = query.execute()
        
        if response.error:
            logging.error(f"Supabase query error: {response.error}")
            return False, []
            
        return True, response.data or []
        
    except Exception as e:
        logging.error(f"Error fetching data: {e}")
        return False, []

def insert_data(
    table: str, 
    data: Union[Dict, List[Dict]]
) -> Tuple[bool, List[Dict]]:
    """
    Insert data into a Supabase table with error handling.
    
    Args:
        table (str): Table name.
        data (Union[Dict, List[Dict]]): Data to insert.
        
    Returns:
        Tuple[bool, List[Dict]]: (success, inserted_data)
    """
    try:
        if supabase is None:
            raise RuntimeError("Supabase client is not initialized")
            
        response = supabase.table(table).insert(data).execute()
        
        if response.error:
            logging.error(f"Supabase insert error: {response.error}")
            return False, []
            
        return True, response.data or []
        
    except Exception as e:
        logging.error(f"Error inserting data: {e}")
        return False, []

def update_data(
    table: str, 
    data: Dict, 
    filters: Dict
) -> Tuple[bool, List[Dict]]:
    """
    Update data in a Supabase table with error handling.
    
    Args:
        table (str): Table name.
        data (Dict): Data to update.
        filters (Dict): Filters to apply.
        
    Returns:
        Tuple[bool, List[Dict]]: (success, updated_data)
    """
    try:
        if supabase is None:
            raise RuntimeError("Supabase client is not initialized")
            
        query = supabase.table(table).update(data)
        
        # Apply filters
        for column, value in filters.items():
            if isinstance(value, list):
                query = query.in_(column, value)
            else:
                query = query.eq(column, value)
            
        # Execute query
        response = query.execute()
        
        if response.error:
            logging.error(f"Supabase update error: {response.error}")
            return False, []
            
        return True, response.data or []
        
    except Exception as e:
        logging.error(f"Error updating data: {e}")
        return False, []

def delete_data(
    table: str, 
    filters: Dict
) -> Tuple[bool, List[Dict]]:
    """
    Delete data from a Supabase table with error handling.
    
    Args:
        table (str): Table name.
        filters (Dict): Filters to apply.
        
    Returns:
        Tuple[bool, List[Dict]]: (success, deleted_data)
    """
    try:
        if supabase is None:
            raise RuntimeError("Supabase client is not initialized")
            
        query = supabase.table(table).delete()
        
        # Apply filters
        for column, value in filters.items():
            if isinstance(value, list):
                query = query.in_(column, value)
            else:
                query = query.eq(column, value)
            
        # Execute query
        response = query.execute()
        
        if response.error:
            logging.error(f"Supabase delete error: {response.error}")
            return False, []
            
        return True, response.data or []
        
    except Exception as e:
        logging.error(f"Error deleting data: {e}")
        return False, []

# Initialize database connections when module is imported
try:
    initialize_db()
except Exception as e:
    logging.error(f"Failed to initialize database: {e}")
    # Let the application decide how to handle this
    # Don't raise here to allow importing the module without crashes