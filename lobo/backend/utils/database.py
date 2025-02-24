import os
import logging
import time
from typing import Dict, List, Optional
from supabase import create_client, Client
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# Load environment variables
load_dotenv()

# Initialize Supabase Client
supabase: Client = None

def initialize_db(retries: int = 3, delay: int = 2):
    """Initialize Supabase database connection with retry logic.

    Args:
        retries (int): Number of connection attempts.
        delay (int): Delay between retries in seconds.
    """
    global supabase
    for i in range(retries):
        try:
            supabase_url = os.getenv("SUPABASE_URL")
            supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # Use Service Role Key for full access
            
            if not supabase_url or not supabase_key:
                raise ValueError("Missing Supabase URL or Service Role Key in .env file.")
            
            supabase = create_client(supabase_url, supabase_key)
            logging.info("Supabase database connection initialized successfully!")
            return
        except Exception as e:
            logging.error(f"Supabase connection failed (attempt {i + 1}/{retries}): {e}")
            time.sleep(delay)
    supabase = None

# Call initialize_db() immediately when the module is loaded
initialize_db()

def execute_query(table: str, select: str = "*", filters: Optional[Dict[str, str]] = None) -> Optional[List[Dict]]:
    """
    Fetch data from a Supabase table with optional filters.

    Args:
        table (str): The name of the table.
        select (str): Columns to select (default is "*").
        filters (Optional[Dict[str, str]]): Filters to apply (e.g., {"column": "value"}).

    Returns:
        Optional[List[Dict]]: The fetched data, or None if an error occurs.
    """
    try:
        if supabase is None:
            raise ConnectionError("Supabase client is not initialized.")

        query = supabase.table(table).select(select)
        
        if filters:
            for column, value in filters.items():
                query = query.eq(column, value)

        response = query.execute()

        if response.error_message:
            logging.error(f"Supabase Query Error: {response.error_message}")

        return response.data if response.data else None

    except Exception as e:
        logging.error(f"Query Execution Error: {e}")
        return None

def insert_data(table: str, data: Dict) -> Optional[List[Dict]]:
    """
    Insert data into a Supabase table with error handling.

    Args:
        table (str): The name of the table.
        data (Dict): The data to insert.

    Returns:
        Optional[List[Dict]]: The inserted data, or None if an error occurs.
    """
    try:
        if supabase is None:
            raise ConnectionError("Supabase client is not initialized.")

        logging.info(f"Inserting data into {table}: {data}")

        response = supabase.table(table).insert(data).execute()

        if response.error_message:
            logging.error(f"Supabase Insert Error: {response.error_message}")

        logging.info(f"Insert Response: {response}")

        return response.data if response.data else None

    except Exception as e:
        logging.error(f"Data Insertion Error: {e}")
        return None

def update_data(table: str, filters: Dict[str, str], data: Dict) -> Optional[List[Dict]]:
    """
    Update existing records in a Supabase table.

    Args:
        table (str): The name of the table.
        filters (Dict[str, str]): Filters to apply (e.g., {"column": "value"}).
        data (Dict): The data to update.

    Returns:
        Optional[List[Dict]]: The updated data, or None if an error occurs.
    """
    try:
        if supabase is None:
            raise ConnectionError("Supabase client is not initialized.")

        query = supabase.table(table)
        for column, value in filters.items():
            query = query.eq(column, value)

        response = query.update(data).execute()

        if response.error_message:
            logging.error(f"Supabase Update Error: {response.error_message}")

        return response.data if response.data else None

    except Exception as e:
        logging.error(f"Data Update Error: {e}")
        return None

def delete_data(table: str, filters: Dict[str, str]) -> Optional[List[Dict]]:
    """
    Delete records from a Supabase table.

    Args:
        table (str): The name of the table.
        filters (Dict[str, str]): Filters to apply (e.g., {"column": "value"}).

    Returns:
        Optional[List[Dict]]: The deleted data, or None if an error occurs.
    """
    try:
        if supabase is None:
            raise ConnectionError("Supabase client is not initialized.")

        query = supabase.table(table)
        for column, value in filters.items():
            query = query.eq(column, value)

        response = query.delete().execute()

        if response.error_message:
            logging.error(f"Supabase Delete Error: {response.error_message}")

        return response.data if response.data else None

    except Exception as e:
        logging.error(f"Data Deletion Error: {e}")
        return None