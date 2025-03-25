# File: lobo/backend/utils/tasks.py
# Enhancement: Asynchronous task processing with Celery

import os
import logging
from typing import Dict, List, Optional, Union, Any
from celery import Celery
from dotenv import load_dotenv
import time
import traceback

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# Load environment variables
load_dotenv()

# Configure Celery
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", REDIS_URL)
CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", REDIS_URL)

# Create Celery app
celery_app = Celery(
    "lobo_tasks",
    broker=CELERY_BROKER_URL,
    backend=CELERY_RESULT_BACKEND
)

# Configure Celery
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    worker_max_tasks_per_child=1000,  # Restart worker after 1000 tasks to prevent memory leaks
    task_acks_late=True,  # Tasks are acknowledged after execution
    task_reject_on_worker_lost=True,  # Reject tasks when workers are lost
    worker_prefetch_multiplier=1,  # Do not prefetch tasks
    task_track_started=True,  # Track when tasks are started
    task_time_limit=3600,  # 1 hour time limit
    task_soft_time_limit=1800,  # 30 minute soft time limit
    broker_transport_options={
        "visibility_timeout": 3600  # 1 hour
    }
)

# Task status tracking
class TaskStatus:
    """Task status constants."""
    PENDING = "PENDING"
    STARTED = "STARTED"
    SUCCESS = "SUCCESS"
    FAILURE = "FAILURE"
    RETRY = "RETRY"
    REVOKED = "REVOKED"
    PROGRESS = "PROGRESS"  # Custom status for tracking progress

# File processing task
@celery_app.task(bind=True, name="process_file")
def process_file(self, file_id: str, file_path: str, mime_type: str, user_id: str):
    """
    Process an uploaded file asynchronously.
    
    Args:
        file_id (str): ID of the file to process
        file_path (str): Path to the file
        mime_type (str): MIME type of the file
        user_id (str): ID of the user who uploaded the file
    """
    from utils.database import supabase
    from utils.vector_db import store_vectors
    
    try:
        # First update status to started
        supabase.table("files").update({
            "processing_status": TaskStatus.STARTED,
            "processing_progress": 0,
            "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }).eq("id", file_id).execute()
        
        # Report progress (10%)
        self.update_state(
            state=TaskStatus.PROGRESS,
            meta={
                "progress": 10,
                "status": "Processing started"
            }
        )
        supabase.table("files").update({
            "processing_progress": 10,
            "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }).eq("id", file_id).execute()
        
        # Extract content based on file type
        extracted_text = None
        processing_result = None
        
        if mime_type == "application/pdf":
            # Report progress (20%)
            self.update_state(
                state=TaskStatus.PROGRESS,
                meta={
                    "progress": 20,
                    "status": "Extracting text from PDF"
                }
            )
            supabase.table("files").update({
                "processing_progress": 20,
                "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            }).eq("id", file_id).execute()
            
            from utils.file_handler import process_pdf
            extracted_text, processing_result = process_pdf(file_path)
            
        elif mime_type == "text/plain":
            # Report progress (20%)
            self.update_state(
                state=TaskStatus.PROGRESS,
                meta={
                    "progress": 20,
                    "status": "Processing text file"
                }
            )
            supabase.table("files").update({
                "processing_progress": 20,
                "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            }).eq("id", file_id).execute()
            
            from utils.file_handler import process_text_file
            extracted_text, processing_result = process_text_file(file_path)
            
        elif mime_type == "text/csv":
            # Report progress (20%)
            self.update_state(
                state=TaskStatus.PROGRESS,
                meta={
                    "progress": 20,
                    "status": "Processing CSV file"
                }
            )
            supabase.table("files").update({
                "processing_progress": 20,
                "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            }).eq("id", file_id).execute()
            
            from utils.file_handler import process_csv
            extracted_text, processing_result = process_csv(file_path)
            
        elif mime_type in ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 
                          "application/vnd.ms-excel"]:
            # Report progress (20%)
            self.update_state(
                state=TaskStatus.PROGRESS,
                meta={
                    "progress": 20,
                    "status": "Processing Excel file"
                }
            )
            supabase.table("files").update({
                "processing_progress": 20,
                "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            }).eq("id", file_id).execute()
            
            from utils.file_handler import process_excel
            extracted_text, processing_result = process_excel(file_path)
        
        # Report progress (50%)
        self.update_state(
            state=TaskStatus.PROGRESS,
            meta={
                "progress": 50,
                "status": "Text extraction complete"
            }
        )
        supabase.table("files").update({
            "processing_progress": 50,
            "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }).eq("id", file_id).execute()
        
        # Store vectors for search if text was extracted
        vectors_stored = False
        if extracted_text:
            # Report progress (70%)
            self.update_state(
                state=TaskStatus.PROGRESS,
                meta={
                    "progress": 70,
                    "status": "Generating vector embeddings"
                }
            )
            supabase.table("files").update({
                "processing_progress": 70,
                "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            }).eq("id", file_id).execute()
            
            vectors_stored = store_vectors(extracted_text, {
                "file_id": file_id,
                "user_id": user_id
            })
        
        # Report progress (90%)
        self.update_state(
            state=TaskStatus.PROGRESS,
            meta={
                "progress": 90,
                "status": "Finalizing processing"
            }
        )
        supabase.table("files").update({
            "processing_progress": 90,
            "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }).eq("id", file_id).execute()
        
        # Update file metadata with processing results
        update_data = {
            "processing_status": TaskStatus.SUCCESS,
            "processing_progress": 100,
            "text_extracted": bool(extracted_text),
            "vectors_stored": vectors_stored,
            "processing_result": processing_result or {},
            "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }
        
        if extracted_text:
            # Store the extracted text and its preview
            update_data["extracted_text"] = extracted_text[:10000]  # Store first 10K chars
            update_data["text_preview"] = extracted_text[:500]  # Store first 500 chars as preview
        
        supabase.table("files").update(update_data).eq("id", file_id).execute()
        
        return {
            "success": True,
            "file_id": file_id,
            "text_extracted": bool(extracted_text),
            "vectors_stored": vectors_stored,
            "processing_result": processing_result
        }
        
    except Exception as e:
        logging.error(f"Error processing file {file_id}: {str(e)}")
        logging.error(traceback.format_exc())
        
        # Update status to failure
        try:
            supabase.table("files").update({
                "processing_status": TaskStatus.FAILURE,
                "processing_error": str(e),
                "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            }).eq("id", file_id).execute()
        except Exception:
            pass
        
        # Re-raise exception for Celery to handle
        raise

# Vector embedding generation task
@celery_app.task(bind=True, name="generate_embeddings")
def generate_embeddings(self, text: str, metadata: Dict = None):
    """
    Generate vector embeddings for text.
    
    Args:
        text (str): Text to generate embeddings for
        metadata (Dict, optional): Additional metadata for the embeddings
    """
    from utils.vector_db import store_vectors
    
    try:
        # Generate embeddings
        vectors_stored = store_vectors(text, metadata or {})
        
        return {
            "success": True,
            "vectors_stored": vectors_stored,
            "metadata": metadata
        }
        
    except Exception as e:
        logging.error(f"Error generating embeddings: {str(e)}")
        logging.error(traceback.format_exc())
        # Re-raise exception for Celery to handle
        raise

# Chat processing task
@celery_app.task(bind=True, name="process_chat_message")
def process_chat_message(self, user_id: str, chat_id: str, message: str):
    """
    Process a chat message asynchronously.
    
    Args:
        user_id (str): ID of the user
        chat_id (str): ID of the chat
        message (str): User message
    """
    from utils.database import supabase
    import ollama
    from config import Config
    
    try:
        # Get the existing chat history
        response = supabase.table("chat_history") \
            .select("messages") \
            .eq("id", chat_id) \
            .eq("user_id", user_id) \
            .single() \
            .execute()
            
        if response.error:
            logging.error(f"Error fetching chat history: {response.error}")
            return {
                "success": False,
                "error": str(response.error)
            }
            
        # Get chat messages
        chat_data = response.data
        messages = chat_data.get("messages", [])
        
        # Add user message
        messages.append({"role": "user", "content": message})
        
        # Add temporary assistant message
        messages.append({"role": "assistant", "content": "Thinking..."})
        
        # Update chat with user message
        supabase.table("chat_history").update({
            "messages": messages,
            "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }).eq("id", chat_id).execute()
        
        # Get response from Ollama
        response = ollama.chat(
            model=Config.OLLAMA_MODEL,
            messages=messages[:-1]  # Exclude the temporary assistant message
        )
        
        # Extract assistant response
        bot_response = response.get("message", {}).get("content", "Sorry, I couldn't generate a response.")
        
        # Update messages with real assistant response
        messages[-1] = {"role": "assistant", "content": bot_response}
        
        # Update chat with assistant response
        supabase.table("chat_history").update({
            "messages": messages,
            "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }).eq("id", chat_id).execute()
        
        return {
            "success": True,
            "response": bot_response,
            "chat_id": chat_id
        }
        
    except Exception as e:
        logging.error(f"Error processing chat message: {str(e)}")
        logging.error(traceback.format_exc())
        
        # Try to update chat with error message
        try:
            # Get the existing chat history again
            response = supabase.table("chat_history") \
                .select("messages") \
                .eq("id", chat_id) \
                .eq("user_id", user_id) \
                .single() \
                .execute()
                
            if not response.error and response.data:
                messages = response.data.get("messages", [])
                # Update last message or add error message
                if messages and messages[-1]["role"] == "assistant":
                    messages[-1] = {
                        "role": "assistant", 
                        "content": "Sorry, I encountered an error while processing your request."
                    }
                else:
                    messages.append({
                        "role": "assistant", 
                        "content": "Sorry, I encountered an error while processing your request."
                    })
                
                # Update chat
                supabase.table("chat_history").update({
                    "messages": messages,
                    "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
                }).eq("id", chat_id).execute()
        except Exception:
            pass
        
        # Re-raise exception for Celery to handle
        raise

# Analytics data processing task
@celery_app.task(name="process_analytics")
def process_analytics():
    """Process analytics data from Redis and store in database."""
    from utils.database import supabase
    import redis
    import json
    
    try:
        # Initialize Redis client
        redis_client = redis.Redis(
            host=os.getenv("REDIS_HOST", "localhost"),
            port=int(os.getenv("REDIS_PORT", 6379)),
            db=int(os.getenv("REDIS_DB", 1)),
            decode_responses=True
        )
        
        # Get all usage keys
        usage_keys = redis_client.keys("usage:*")
        
        for key in usage_keys:
            try:
                # Parse the key to get user_id and date
                parts = key.split(":")
                if len(parts) < 3:
                    continue
                
                user_id = parts[1]
                date_key = parts[2]
                
                # Skip any keys that don't match the expected format
                if not user_id or not date_key:
                    continue
                
                # Get usage data
                usage_data = redis_client.hgetall(key)
                
                if not usage_data:
                    continue
                
                # Convert usage data to the right format
                formatted_usage = {}
                for endpoint, count in usage_data.items():
                    formatted_usage[endpoint] = int(count)
                
                # Update analytics in database
                supabase.table("api_usage").upsert({
                    "user_id": user_id,
                    "date": date_key,
                    "usage": formatted_usage,
                    "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
                }).execute()
                
                # Delete key from Redis only if upserting succeeded
                # redis_client.delete(key)
                
            except Exception as e:
                logging.error(f"Error processing usage key {key}: {str(e)}")
        
        return {
            "success": True,
            "keys_processed": len(usage_keys)
        }
        
    except Exception as e:
        logging.error(f"Error processing analytics: {str(e)}")
        logging.error(traceback.format_exc())
        # Re-raise exception for Celery to handle
        raise

# Periodic task to clean up old data
@celery_app.task(name="cleanup_old_data")
def cleanup_old_data(days: int = 30):
    """
    Clean up old data from the database.
    
    Args:
        days (int): Number of days to keep data for
    """
    from utils.database import supabase
    import datetime
    
    try:
        # Calculate cutoff date
        cutoff_date = (datetime.datetime.now() - datetime.timedelta(days=days)).isoformat()
        
        # Delete old API usage records
        response = supabase.table("api_usage") \
            .delete() \
            .lt("date", cutoff_date) \
            .execute()
        
        api_usage_deleted = len(response.data) if response.data else 0
        
        # Delete old logs
        response = supabase.table("logs") \
            .delete() \
            .lt("created_at", cutoff_date) \
            .execute()
        
        logs_deleted = len(response.data) if response.data else 0
        
        return {
            "success": True,
            "api_usage_deleted": api_usage_deleted,
            "logs_deleted": logs_deleted
        }
        
    except Exception as e:
        logging.error(f"Error cleaning up old data: {str(e)}")
        logging.error(traceback.format_exc())
        # Re-raise exception for Celery to handle
        raise

# Set up periodic tasks
@celery_app.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    """Set up periodic tasks."""
    # Process analytics every hour
    sender.add_periodic_task(
        3600.0,  # 1 hour
        process_analytics.s(),
        name="process analytics every hour"
    )
    
    # Clean up old data every day
    sender.add_periodic_task(
        86400.0,  # 24 hours
        cleanup_old_data.s(30),  # Keep data for 30 days
        name="clean up old data every day"
    )