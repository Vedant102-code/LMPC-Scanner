import os
import shutil
from fastapi import UploadFile
import uuid

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")

class StorageService:
    @staticmethod
    def save_upload_file(upload_file: UploadFile) -> str:
        if not os.path.exists(UPLOAD_DIR):
            os.makedirs(UPLOAD_DIR)
        
        # Ensure we have a valid extension, default to .jpg if not found
        ext = os.path.splitext(upload_file.filename)[1] if upload_file.filename else ".jpg"
        if not ext:
            ext = ".jpg"
            
        unique_filename = f"{uuid.uuid4()}{ext}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)
            
        return os.path.abspath(file_path)
