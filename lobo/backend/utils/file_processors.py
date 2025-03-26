# File: lobo/backend/utils/file_processors.py
import logging
import fitz  # PyMuPDF for PDF processing
import pandas as pd

# Configure logging
logging.basicConfig(level=logging.ERROR, format="%(asctime)s - %(levelname)s - %(message)s")

def process_pdf(file_path):
    """Extract text from a PDF file and return additional information."""
    try:
        text = ""
        page_count = 0
        with fitz.open(file_path) as doc:
            page_count = len(doc)
            for page in doc:
                text += page.get_text("text") + "\n"
                
        return text.strip(), {
            "page_count": page_count,
            "word_count": len(text.split()),
            "char_count": len(text)
        }
    except Exception as e:
        logging.error(f"Error extracting text from PDF: {str(e)}")
        return None, None

def process_text_file(file_path):
    """Process a text file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        return content, {
            "line_count": content.count('\n') + 1,
            "word_count": len(content.split()),
            "char_count": len(content)
        }
    except UnicodeDecodeError:
        # Try with different encoding
        try:
            with open(file_path, 'r', encoding='latin-1') as f:
                content = f.read()
            
            return content, {
                "line_count": content.count('\n') + 1,
                "word_count": len(content.split()),
                "char_count": len(content)
            }
        except Exception as e:
            logging.error(f"Error processing text file: {str(e)}")
            return None, None
    except Exception as e:
        logging.error(f"Error processing text file: {str(e)}")
        return None, None

def process_csv(file_path):
    """Process a CSV file and extract key information."""
    try:
        df = pd.read_csv(file_path)
        
        # Generate a text representation of the CSV
        text = f"CSV file with {len(df.columns)} columns and {len(df)} rows.\n"
        text += f"Columns: {', '.join(df.columns)}\n\n"
        
        # Add sample of data
        sample_size = min(5, len(df))
        if sample_size > 0:
            text += "Sample data:\n"
            text += df.head(sample_size).to_string() + "\n"
        
        # Add statistics for numeric columns
        numeric_cols = df.select_dtypes(include=['number']).columns
        if len(numeric_cols) > 0:
            text += "\nNumeric column statistics:\n"
            for col in numeric_cols:
                text += f"{col}: min={df[col].min()}, max={df[col].max()}, mean={df[col].mean()}\n"
        
        return text, {
            "row_count": len(df),
            "column_count": len(df.columns),
            "columns": df.columns.tolist(),
            "data_types": {col: str(df[col].dtype) for col in df.columns}
        }
    except Exception as e:
        logging.error(f"Error processing CSV file: {str(e)}")
        return None, None

def process_excel(file_path):
    """Process an Excel file and extract key information."""
    try:
        # Read all sheets
        excel_file = pd.ExcelFile(file_path)
        sheet_names = excel_file.sheet_names
        
        text = f"Excel file with {len(sheet_names)} sheets: {', '.join(sheet_names)}\n\n"
        
        all_data = {}
        for sheet in sheet_names:
            df = pd.read_excel(file_path, sheet_name=sheet)
            all_data[sheet] = {
                "row_count": len(df),
                "column_count": len(df.columns),
                "columns": df.columns.tolist()
            }
            
            # Add sheet details to text
            text += f"Sheet: {sheet}\n"
            text += f"  Rows: {len(df)}, Columns: {len(df.columns)}\n"
            text += f"  Column names: {', '.join(df.columns)}\n\n"
            
            # Add sample if sheet has data
            if len(df) > 0:
                sample_size = min(3, len(df))
                text += f"  Sample data:\n{df.head(sample_size).to_string()}\n\n"
        
        return text, {
            "sheet_count": len(sheet_names),
            "sheets": all_data
        }
    except Exception as e:
        logging.error(f"Error processing Excel file: {str(e)}")
        return None, None