from flask import jsonify
import logging
import traceback

def success_response(data=None, message="Operation successful", status_code=200):
    """
    Create a standardized success response.
    
    Args:
        data: The data to return (optional)
        message: Success message (optional)
        status_code: HTTP status code (default: 200)
        
    Returns:
        Flask response object with JSON data and status code
    """
    response = {
        "success": True,
        "message": message
    }
    
    if data is not None:
        response["data"] = data
        
    return jsonify(response), status_code

def error_response(message="An error occurred", error_code=None, status_code=400, log_error=True, exc=None):
    """
    Create a standardized error response.
    
    Args:
        message: Error message
        error_code: Application-specific error code (optional)
        status_code: HTTP status code (default: 400)
        log_error: Whether to log the error (default: True)
        exc: Exception object for logging (optional)
        
    Returns:
        Flask response object with JSON error data and status code
    """
    response = {
        "success": False,
        "message": message
    }
    
    if error_code:
        response["error_code"] = error_code
    
    if log_error:
        if exc:
            logging.error(f"API Error: {message} - {error_code} - {exc}")
            logging.debug(traceback.format_exc())
        else:
            logging.error(f"API Error: {message} - {error_code}")
    
    return jsonify(response), status_code