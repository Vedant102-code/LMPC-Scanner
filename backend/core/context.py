from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any

class BoundingBox(BaseModel):
    ymin: int
    xmin: int
    ymax: int
    xmax: int

class EntityValue(BaseModel):
    value: str
    unit: Optional[str] = None
    confidence: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    bbox: Optional[BoundingBox] = None

class Violation(BaseModel):
    rule_id: str
    field: str
    description: str
    severity: str  # e.g., "CRITICAL", "WARNING"

class ComplianceResult(BaseModel):
    is_compliant: bool
    severity_score: int = Field(ge=0, le=100)
    status: str  # e.g., "APPROVED", "REJECTED", "MANUAL_REVIEW"
    violations: List[Violation] = Field(default_factory=list)

class Images(BaseModel):
    raw_images: List[str] = Field(default_factory=list)
    processed_images: List[str] = Field(default_factory=list)

class InspectionContext(BaseModel):
    transaction_id: str
    images: Images
    
    # Manual Real-World Dimensions (For Rule 7)
    package_height_cm: Optional[float] = None
    package_width_cm: Optional[float] = None
    
    # Ontology / Classification
    package_type: Optional[str] = None # Retail, Wholesale, etc.
    product_category: Optional[str] = None # Food, Textile, etc.
    is_imported: Optional[bool] = False
    
    extracted_entities: Dict[str, EntityValue] = Field(default_factory=dict)
    
    multiple_products_detected: bool = False
    multiple_products_reason: Optional[str] = None
    compliance_result: Optional[ComplianceResult] = None
    
    # We can also store the raw image matrix (e.g., numpy array) during pipeline execution
    # to avoid reading from disk multiple times across different plugins.
    # The 'exclude=True' ensures it won't be serialized when we convert this to JSON for the API.
    image_matrix: Optional[Any] = Field(default=None, exclude=True)
