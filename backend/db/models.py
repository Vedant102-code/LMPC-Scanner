from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from db.database import Base
import datetime

class InspectionRecord(Base):
    __tablename__ = "inspections"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String, unique=True, index=True)
    status = Column(String)
    score = Column(Integer)
    is_compliant = Column(Boolean)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    
    raw_image_path = Column(String)
    processed_image_path = Column(String)
    extracted_json = Column(String)
    
    violations = relationship("ViolationRecord", back_populates="inspection")


class ViolationRecord(Base):
    __tablename__ = "violations"

    id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(Integer, ForeignKey("inspections.id"))
    rule_id = Column(String)
    field = Column(String)
    description = Column(String)
    severity = Column(String)

    inspection = relationship("InspectionRecord", back_populates="violations")
