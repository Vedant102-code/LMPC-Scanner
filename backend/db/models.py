from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from db.database import Base
import datetime

class InspectionRecord(Base):
    __tablename__ = "inspections"

    id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(String, unique=True, index=True) # LMPC-XXXXXX
    transaction_id = Column(String, unique=True, index=True) # Internal UUID
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    inspector_id = Column(String, nullable=True)
    
    # Location & Product Details
    location_address = Column(String, nullable=True)
    location_gps = Column(String, nullable=True)
    product_brand = Column(String, nullable=True)
    product_name = Column(String, nullable=True)
    
    # Results
    overall_score = Column(Integer, default=0)
    is_compliant = Column(Boolean, default=False)
    extracted_data_json = Column(Text, nullable=True) # JSON dump of VLM extractions
    
    # Relationships
    images = relationship("InspectionImage", back_populates="inspection", cascade="all, delete-orphan")
    checks = relationship("ComplianceCheck", back_populates="inspection", cascade="all, delete-orphan")


class InspectionImage(Base):
    __tablename__ = "inspection_images"

    id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(Integer, ForeignKey("inspections.id"))
    image_type = Column(String) # 'SCAN' or 'EVIDENCE'
    file_path = Column(String) # Relative path to local upload folder (or cloud URL later)
    
    inspection = relationship("InspectionRecord", back_populates="images")


class ComplianceCheck(Base):
    __tablename__ = "compliance_checks"

    id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(Integer, ForeignKey("inspections.id"))
    
    field_name = Column(String) # e.g., 'NET_QUANTITY'
    status = Column(String) # 'PASS', 'FAIL', 'OVERRIDDEN'
    ai_confidence = Column(Float, nullable=True)
    failure_reason = Column(String, nullable=True)
    
    # If overridden, link to the specific evidence image
    evidence_image_id = Column(Integer, ForeignKey("inspection_images.id"), nullable=True)
    
    inspection = relationship("InspectionRecord", back_populates="checks")
