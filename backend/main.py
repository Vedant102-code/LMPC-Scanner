import os
import uuid
import json
import secrets
from fastapi import FastAPI, File, UploadFile, Depends, Form
from sqlalchemy.orm import Session
from typing import Optional, List

from db.database import engine, Base, get_db
import db.models as models
from db.models import InspectionRecord
from services.storage import StorageService

from core.context import InspectionContext, Images
from core.pipeline import CompliancePipeline
from plugins.opencv_plugin import OpenCVPlugin
from plugins.vlm_plugin import VLMPlugin
from plugins.rule_engine_plugin import RuleEnginePlugin

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Legal Metrology Compliance Checker")

# Instantiate Pipeline
pipeline = CompliancePipeline(plugins=[OpenCVPlugin(), VLMPlugin(), RuleEnginePlugin()])

@app.get("/api/inspections/new")
async def create_new_inspection():
    """Generates a secure, unique inspection ID for the mobile app to use."""
    # Using secrets to generate a cryptographically secure 6-character hex string
    secure_hash = secrets.token_hex(3).upper()
    inspection_id = f"LMPC-{secure_hash}"
    return {"inspection_id": inspection_id}

@app.post("/api/analyze")
async def analyze_image(
    inspection_id: str = Form(...),
    files: list[UploadFile] = File(...),
    width: Optional[float] = Form(None),
    height: Optional[float] = Form(None)
):
    # Save the files temporarily
    file_paths = []
    for f in files:
        file_paths.append(StorageService.save_temp_file(f))
    
    # Prepare context
    transaction_id = str(uuid.uuid4())
    context = InspectionContext(
        transaction_id=transaction_id,
        images=Images(raw_images=file_paths),
        package_width_cm=width,
        package_height_cm=height
    )
    
    # Run pipeline
    result_context = pipeline.run(context)
    
    # Simulate saving processed images to cloud
    processed_urls = []
    if result_context.images.processed_images:
        for idx, proc_path in enumerate(result_context.images.processed_images):
            with open(proc_path, "rb") as f:
                url = StorageService.save_processed_image(f.read(), inspection_id, f"scan_{idx}.jpg")
                processed_urls.append(url)
    
    cr = result_context.compliance_result
    
    # TEMPORARILY DISABLED DB SAVING HERE.
    # We will build a new /api/save_inspection endpoint that handles the saving 
    # AFTER the inspector manually reviews and overrides on the mobile app.
        
    return {
        "transaction_id": transaction_id,
        "inspection_id": inspection_id,
        "processed_urls": processed_urls,
        "compliance_report": cr.dict() if cr else None,
        "extracted_entities": {k: v.dict() for k, v in result_context.extracted_entities.items()}
    }

@app.post("/api/save_inspection")
async def save_inspection(
    payload: str = Form(...), # JSON stringified payload
    evidence_files: Optional[List[UploadFile]] = File(None),
    db: Session = Depends(get_db)
):
    data = json.loads(payload)
    inspection_id = data.get("inspectionId")
    
    # 1. Create Master Inspection Record
    inspection = InspectionRecord(
        inspection_id=inspection_id,
        transaction_id=str(uuid.uuid4()),
        location_address=data.get("locationAddress"),
        location_gps=data.get("locationGps"),
        product_brand=data.get("productBrand"),
        product_name=data.get("productName"),
        overall_score=data.get("overallScore", 0),
        is_compliant=data.get("isCompliant", False),
        extracted_data_json=json.dumps(data.get("extractedData", {}))
    )
    db.add(inspection)
    db.commit()
    db.refresh(inspection)
    
    # 2. Save Processed Scan URLs to InspectionImages
    processed_urls = data.get("processedUrls", [])
    for url in processed_urls:
        img_record = models.InspectionImage(
            inspection_id=inspection.id,
            image_type="SCAN",
            file_path=url
        )
        db.add(img_record)
        
    # 3. Save Evidence Images & Map them by field
    evidence_map = {}
    if evidence_files:
        for f in evidence_files:
            # We expect the frontend to send the field name as the filename!
            field_name = os.path.splitext(f.filename)[0] 
            path = StorageService.save_evidence_image(f, inspection_id)
            
            ev_record = models.InspectionImage(
                inspection_id=inspection.id,
                image_type="EVIDENCE",
                file_path=path
            )
            db.add(ev_record)
            db.commit()
            db.refresh(ev_record)
            evidence_map[field_name] = ev_record.id
            
    # 4. Save the full Checklist (ComplianceChecks)
    checklist = data.get("checklist", [])
    for item in checklist:
        field = item.get("field")
        check = models.ComplianceCheck(
            inspection_id=inspection.id,
            field_name=field,
            status=item.get("status"),
            ai_confidence=item.get("confidence"),
            failure_reason=item.get("reason"),
            evidence_image_id=evidence_map.get(field) if item.get("status") == "OVERRIDDEN" else None
        )
        db.add(check)
        
    db.commit()
    
    return {"status": "success", "message": "Inspection completely saved to Supabase!"}
