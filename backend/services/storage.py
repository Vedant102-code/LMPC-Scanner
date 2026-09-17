import os
import shutil
import uuid
import requests
from fastapi import UploadFile

class StorageService:
    # Use standard /tmp directory for ephemeral files on cloud platforms
    TEMP_DIR = '/tmp/lmpc_temp' if os.name != 'nt' else os.path.join(os.environ.get('TEMP', ''), 'lmpc_temp')
    
    SUPABASE_URL = "https://bfljxgsdyaidrvagdlfr.supabase.co"
    SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmbGp4Z3NkeWFpZHJ2YWdkbGZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NTA5NTgsImV4cCI6MjEwNTEyNjk1OH0.qIEXKHGuDEaEF9U7_14WACc8Je_qD_0bz7KX2eyj_O4"
    BUCKET_NAME = "inspection-images"

    @classmethod
    def save_temp_file(cls, upload_file: UploadFile) -> str:
        """Saves a temporary raw image before AI processing (Ephemeral)."""
        os.makedirs(cls.TEMP_DIR, exist_ok=True)
        
        ext = os.path.splitext(upload_file.filename)[1] if upload_file.filename else ".jpg"
        if not ext: ext = ".jpg"
        unique_filename = f"{uuid.uuid4()}{ext}"
        
        file_path = os.path.join(cls.TEMP_DIR, unique_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)
        return file_path

    @classmethod
    def _upload_to_supabase(cls, file_bytes: bytes, path: str, content_type: str = "image/jpeg") -> str:
        """Uploads a file to Supabase Storage and returns the public URL."""
        url = f"{cls.SUPABASE_URL}/storage/v1/object/{cls.BUCKET_NAME}/{path}"
        headers = {
            "Authorization": f"Bearer {cls.SUPABASE_KEY}",
            "apikey": cls.SUPABASE_KEY,
            "Content-Type": content_type
        }
        
        response = requests.post(url, data=file_bytes, headers=headers)
        
        if response.status_code not in [200, 201]:
            print(f"Failed to upload to Supabase: {response.text}")
            
        return f"{cls.SUPABASE_URL}/storage/v1/object/public/{cls.BUCKET_NAME}/{path}"

    @classmethod
    def save_processed_image(cls, file_bytes: bytes, inspection_id: str, filename: str) -> str:
        """Saves the compressed OpenCV output directly to Supabase Cloud Storage."""
        path = f"{inspection_id}/processed/{filename}"
        return cls._upload_to_supabase(file_bytes, path)

    @classmethod
    def save_evidence_image(cls, upload_file: UploadFile, inspection_id: str) -> str:
        """Saves a manual override evidence photo directly to Supabase Cloud Storage."""
        ext = os.path.splitext(upload_file.filename)[1] if upload_file.filename else ".jpg"
        if not ext: ext = ".jpg"
        unique_filename = f"evidence_{uuid.uuid4()}{ext}"
        path = f"{inspection_id}/evidence/{unique_filename}"
        
        file_bytes = upload_file.file.read()
        return cls._upload_to_supabase(file_bytes, path)
