import sys
import os

with open('backend/main.py', 'r') as f:
    content = f.read()

# Add StaticFiles import if missing
if 'StaticFiles' not in content:
    content = content.replace('from fastapi.middleware.cors import CORSMiddleware', 'from fastapi.middleware.cors import CORSMiddleware\nfrom fastapi.staticfiles import StaticFiles')

# Add mount directive after app = FastAPI(...)
if 'app.mount("/uploads"' not in content:
    mount_code = """
# Mount the uploads directory to serve static evidence images
import os
uploads_path = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(uploads_path, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_path), name="uploads")
"""
    content = content.replace('app = FastAPI(title="Legal Metrology Compliance Checker")', 'app = FastAPI(title="Legal Metrology Compliance Checker")\n' + mount_code)

# Add GET /api/inspections/{id}
new_endpoint = """
@app.get("/api/inspections/{inspection_id}")
def get_inspection_detail(inspection_id: str, db: Session = Depends(get_db)):
    r = db.query(InspectionRecord).filter(InspectionRecord.inspection_id == inspection_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Inspection not found")
        
    checks = db.query(models.ComplianceCheck).filter(models.ComplianceCheck.inspection_id == r.id).all()
    images = db.query(models.InspectionImage).filter(models.InspectionImage.inspection_id == r.id).all()
    
    return {
        "id": r.inspection_id,
        "product": r.product_name,
        "brand": r.product_brand,
        "address": r.location_address,
        "locationGps": r.location_gps,
        "score": r.overall_score,
        "is_compliant": r.is_compliant,
        "date": r.timestamp.strftime("%Y-%m-%d %H:%M"),
        "raw_json": r.extracted_data_json,
        "checks": [
            {
                "rule": c.field_name,
                "status": c.status,
                "confidence": c.ai_confidence,
                "reason": c.failure_reason
            } for c in checks
        ],
        "images": [img.file_path for img in images]
    }
"""
if 'def get_inspection_detail' not in content:
    content += new_endpoint

with open('backend/main.py', 'w') as f:
    f.write(content)
