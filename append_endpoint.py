import sys

with open('backend/main.py', 'a') as f:
    f.write('''
@app.get("/api/inspections")
def get_all_inspections(db: Session = Depends(get_db)):
    inspections = db.query(InspectionRecord).order_by(InspectionRecord.timestamp.desc()).all()
    result = []
    for r in inspections:
        failed_checks = db.query(models.ComplianceCheck).filter(
            models.ComplianceCheck.inspection_id == r.id,
            models.ComplianceCheck.status == "FAIL"
        ).all()
        failed_rules = [c.field_name for c in failed_checks]
        result.append({
            "id": r.inspection_id,
            "product": r.product_name or "Unknown Product",
            "brand": r.product_brand or "Unknown Brand",
            "address": r.location_address or "Unknown Region",
            "locationGps": r.location_gps,
            "score": r.overall_score,
            "is_compliant": r.is_compliant,
            "date": r.timestamp.strftime("%Y-%m-%d %H:%M"),
            "failed_rules": failed_rules
        })
    return {"inspections": result}
''')
