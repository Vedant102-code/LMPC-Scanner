import uuid
import json
from fastapi import FastAPI, File, UploadFile, Depends, Form
from sqlalchemy.orm import Session
from typing import Optional

from db.database import engine, Base, get_db
from db.models import InspectionRecord, ViolationRecord
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

@app.post("/api/analyze")
async def analyze_image(
    files: list[UploadFile] = File(...),
    width: Optional[float] = Form(None),
    height: Optional[float] = Form(None),
    db: Session = Depends(get_db)
):
    # Save the files
    file_paths = []
    for f in files:
        file_paths.append(StorageService.save_upload_file(f))
    
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
    
    cr = result_context.compliance_result
    
    # Save to DB
    inspection = InspectionRecord(
        transaction_id=transaction_id,
        status=cr.status if cr else "FAILED",
        score=cr.severity_score if cr else 0,
        is_compliant=cr.is_compliant if cr else False,
        raw_image_path=",".join(file_paths),
        processed_image_path=",".join(result_context.images.processed_images) if result_context.images.processed_images else None,
        extracted_json=json.dumps({k: v.dict() for k, v in result_context.extracted_entities.items()}) if result_context.extracted_entities else "{}"
    )
    db.add(inspection)
    db.commit()
    db.refresh(inspection)
    
    if cr and cr.violations:
        for v in cr.violations:
            violation = ViolationRecord(
                inspection_id=inspection.id,
                rule_id=v.rule_id,
                field=v.field,
                description=v.description,
                severity=v.severity
            )
            db.add(violation)
        db.commit()
        
    return {
        "transaction_id": transaction_id,
        "compliance_report": cr.dict() if cr else None,
        "extracted_entities": {k: v.dict() for k, v in result_context.extracted_entities.items()}
    }
