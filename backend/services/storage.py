import os
import shutil
import uuid
from fastapi import UploadFile

class StorageService:
    BASE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')

    @classmethod
    def save_temp_file(cls, upload_file: UploadFile) -> str:
        """Saves a temporary raw image before AI processing."""
        temp_dir = os.path.join(cls.BASE_DIR, 'temp_raw')
        os.makedirs(temp_dir, exist_ok=True)
        
        # Ensure extension
        ext = os.path.splitext(upload_file.filename)[1] if upload_file.filename else ".jpg"
        if not ext: ext = ".jpg"
        unique_filename = f"{uuid.uuid4()}{ext}"
        
        file_path = os.path.join(temp_dir, unique_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)
        return file_path

    @classmethod
    def save_processed_image(cls, file_bytes: bytes, inspection_id: str, filename: str) -> str:
        """Saves the compressed OpenCV output (This simulates Cloud S3 Upload)"""
        target_dir = os.path.join(cls.BASE_DIR, inspection_id, 'processed')
        os.makedirs(target_dir, exist_ok=True)
        file_path = os.path.join(target_dir, filename)
        
        with open(file_path, "wb") as f:
            f.write(file_bytes)
        
        return f"/uploads/{inspection_id}/processed/{filename}"

    @classmethod
    def save_evidence_image(cls, upload_file: UploadFile, inspection_id: str) -> str:
        """Saves a manual override evidence photo (This simulates Cloud S3 Upload)"""
        target_dir = os.path.join(cls.BASE_DIR, inspection_id, 'evidence')
        os.makedirs(target_dir, exist_ok=True)
        
        ext = os.path.splitext(upload_file.filename)[1] if upload_file.filename else ".jpg"
        if not ext: ext = ".jpg"
        unique_filename = f"evidence_{uuid.uuid4()}{ext}"
        
        file_path = os.path.join(target_dir, unique_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)
            
        return f"/uploads/{inspection_id}/evidence/{unique_filename}"
