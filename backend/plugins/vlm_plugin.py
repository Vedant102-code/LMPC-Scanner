import os
import sys
from typing import Optional, Dict, List
from pydantic import BaseModel, Field
from google import genai
from google.genai import types
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
load_dotenv(dotenv_path=env_path)

from core.context import InspectionContext, EntityValue, BoundingBox
from plugins.base_plugin import BasePlugin

# --- Pydantic Schemas for Structured Gemini Output ---
class EntityExtraction(BaseModel):
    value: str = Field(description="The extracted value string. Must be exactly as written on the packaging.")
    bbox: Optional[List[int]] = Field(None, description="2D bounding box of the text [ymin, xmin, ymax, xmax] based on a 1000x1000 coordinate system.", min_length=4, max_length=4)
    confidence: float = Field(description="Confidence score between 0.0 and 1.0 based on visibility and clarity.", ge=0.0, le=1.0)

class ExtractedEntities(BaseModel):
    BRAND_NAME: Optional[EntityExtraction] = Field(None, description="The brand name or trademark of the product (e.g., 'Nestle', 'Samsung').")
    PRODUCT_NAME: Optional[EntityExtraction] = Field(None, description="The generic or common product name (e.g., 'Maggi Noodles', 'Galaxy S23'). Do not combine this with the brand name unless it is inseparable.")
    MANUFACTURER_NAME: Optional[EntityExtraction] = Field(None, description="Name of the manufacturer.")
    MANUFACTURER_ADDRESS: Optional[EntityExtraction] = Field(None, description="Address of the manufacturer.")
    PACKER_NAME: Optional[EntityExtraction] = Field(None, description="Name of the packer.")
    PACKER_ADDRESS: Optional[EntityExtraction] = Field(None, description="Address of the packer.")
    IMPORTER_NAME: Optional[EntityExtraction] = Field(None, description="Name of the importer (if applicable).")
    IMPORTER_ADDRESS: Optional[EntityExtraction] = Field(None, description="Address of the importer (if applicable).")
    COUNTRY_OF_ORIGIN: Optional[EntityExtraction] = Field(None, description="Country of origin.")
    NET_QUANTITY: Optional[EntityExtraction] = Field(None, description="The numeric value of the net quantity.")
    QUANTITY_UNIT: Optional[EntityExtraction] = Field(None, description="The unit of the net quantity (e.g., 'g', 'ml', 'L').")
    PACK_DATE: Optional[EntityExtraction] = Field(None, description="Date of manufacture or pre-packing.")
    MRP: Optional[EntityExtraction] = Field(None, description="Maximum Retail Price inclusive of all taxes.")
    BEST_BEFORE_USE_BY: Optional[EntityExtraction] = Field(None, description="Best before, use by, or expiry date.")
    CONSUMER_CARE_NAME: Optional[EntityExtraction] = Field(None, description="Name of the consumer care contact/office.")
    CONSUMER_CARE_ADDRESS: Optional[EntityExtraction] = Field(None, description="Customer care physical address.")
    CONSUMER_CARE_PHONE: Optional[EntityExtraction] = Field(None, description="Customer care phone number.")
    CONSUMER_CARE_EMAIL: Optional[EntityExtraction] = Field(None, description="Customer care email address.")
    DIMENSIONS: Optional[EntityExtraction] = Field(None, description="Dimensions of the product (if applicable).")
    UNIT_SALE_PRICE: Optional[EntityExtraction] = Field(None, description="The unit sale price (e.g., Rs. X per g/ml).")

class VLMResponse(BaseModel):
    package_type: Optional[str] = Field(None, description="The type of package, e.g., 'Retail', 'Wholesale'.")
    product_category: Optional[str] = Field(None, description="The category of the product, e.g., 'Food', 'Textile', 'Electronics'.")
    is_imported: Optional[bool] = Field(False, description="True if the product is imported (e.g., has an Importer Name/Address or Country of Origin).")
    multiple_products_detected: bool = Field(description="True if the images appear to belong to completely different products. False if they are just different angles of the SAME product.")
    multiple_products_reason: Optional[str] = Field(None, description="If multiple products were detected, explain why (e.g., conflicting brand names or different packaging types).")
    entities: ExtractedEntities = Field(description="The consolidated entities extracted from all provided images.")

class VLMPlugin(BasePlugin):
    """
    VLM Plugin utilizing Gemini to extract structured entities from one or multiple images simultaneously.
    """
    def __init__(self):
        self.client = genai.Client()

    def process(self, context: InspectionContext) -> InspectionContext:
        image_paths = context.images.processed_images or context.images.raw_images
        
        if not image_paths:
            raise ValueError("No images found in context.")

        from PIL import Image
        pil_images = []
        for path in image_paths:
            if not os.path.exists(path):
                print(f"[WARNING] Image not found at path: {path}")
                continue
            pil_images.append(Image.open(path))
            
        if not pil_images:
            raise FileNotFoundError("Could not load any of the provided images.")

        prompt = (
            "You are an expert OCR and Legal Metrology Compliance extraction AI.\n"
            "I have provided one or more images of product packaging. "
            "These images are SUPPOSED to show different sides of the SAME product.\n\n"
            "Task 1 (Consistency & Product Details):\n"
            "- Check if these images actually belong to the same product. If they show conflicting brand names, completely different commodities, or obviously different items, set 'multiple_products_detected' to true and explain why in 'multiple_products_reason'.\n"
            "- Extract the 'package_type' (e.g., Retail, Wholesale), 'product_category' (e.g., Food, Textile, Electronics), and 'is_imported' flag (True/False).\n\n"
            "Task 2 (Consolidated Extraction):\n"
            "- Consolidate the information from ALL provided images into a single, cohesive JSON object.\n"
            "- If a field is cut off in one image but clearly visible in another, combine the information seamlessly.\n"
            "- Extract EVERY single detail required by the schema. All text on the packaging must be accounted for.\n"
            "- If a field is simply not present, leave it empty (null).\n"
            "- Ensure the 'value' exactly matches the text written on the packaging.\n"
            "- Estimate a realistic confidence score (0.0 to 1.0) based on how clearly you can read the final consolidated value.\n\n"
            "Task 3 (Cross-Referencing & Implied Values):\n"
            "- Packages frequently use implied references to save space (e.g., 'For complaints, contact Manufacturer Address', or 'Mfg Date: See Neck').\n"
            "- If a field explicitly references another field or location for its value, you MUST mentally resolve that reference and extract the ACTUAL value into the referenced field.\n"
            "- For example, if it says 'For complaints, contact manufacturer address', you must copy the full manufacturer address into the CONSUMER_CARE_ADDRESS field. Do not extract the phrase 'contact manufacturer address'.\n"
            "- For imported goods, the 'Month and Year of Import' satisfies the packing date requirement.\n"
            "- For electronics or solid items sold by count, 'Net Quantity' is often written as '1 U' (Unit), '1 N' (Number), or '1 piece'. Extract this count as the NET_QUANTITY and the 'U', 'N', or 'piece' as the QUANTITY_UNIT.\n"
            "- Do NOT blindly assign a lone date to the expiry field without reading the surrounding instructions. If it says 'Use before 36 months', extract '36 months' for BEST_BEFORE_USE_BY.\n\n"
            "Task 4 (Bounding Boxes):\n"
            "- For every extracted entity, you MUST provide a 2D bounding box representing its location in the image.\n"
            "- The bounding box must be specified as an array of 4 integers: [ymin, xmin, ymax, xmax].\n"
            "- The coordinates should be based on a normalized 1000x1000 coordinate system (0-1000) spanning the image dimensions."
        )

        contents_payload = pil_images + [prompt]

        response = self.client.models.generate_content(
            model='gemini-3.1-flash-lite',
            contents=contents_payload,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=VLMResponse,
                temperature=0.1
            ),
        )

        try:
            vlm_data = VLMResponse.model_validate_json(response.text)
        except Exception as e:
            print(f"Failed to parse VLM output: {response.text}")
            raise e
        
        context.multiple_products_detected = vlm_data.multiple_products_detected
        context.multiple_products_reason = vlm_data.multiple_products_reason
        context.package_type = vlm_data.package_type
        context.product_category = vlm_data.product_category
        context.is_imported = vlm_data.is_imported
        
        context.extracted_entities = {}
        for key, entity_data in vlm_data.entities.model_dump().items():
            if key == 'QUANTITY_UNIT':
                continue # We will process this together with NET_QUANTITY

            if entity_data and entity_data.get('value'):
                bbox_data = entity_data.get('bbox')
                bbox_obj = BoundingBox(ymin=bbox_data[0], xmin=bbox_data[1], ymax=bbox_data[2], xmax=bbox_data[3]) if bbox_data and len(bbox_data) == 4 else None
                
                if key == 'NET_QUANTITY':
                    unit_val = None
                    if vlm_data.entities.QUANTITY_UNIT and vlm_data.entities.QUANTITY_UNIT.value:
                        unit_val = vlm_data.entities.QUANTITY_UNIT.value
                    
                    context.extracted_entities['NET_QUANTITY'] = EntityValue(
                        value=entity_data['value'],
                        unit=unit_val,
                        confidence=entity_data['confidence'],
                        bbox=bbox_obj
                    )
                else:
                    context.extracted_entities[key] = EntityValue(
                        value=entity_data['value'],
                        confidence=entity_data['confidence'],
                        bbox=bbox_obj
                    )

        return context

if __name__ == '__main__':
    import uuid
    from core.context import Images
    
    print("--- Gemini VLM Plugin Test (Multi-Image Support) ---")
    
    if len(sys.argv) > 1:
        test_img_paths = sys.argv[1:]
    else:
        print("You can test multiple images of the same product at once (e.g., front side, back side, curved edges).")
        user_input = input("Enter the absolute paths to the images (separated by commas): ").strip()
        test_img_paths = [p.strip() for p in user_input.split(",") if p.strip()]
        
    if not test_img_paths:
        print("Error: No image paths provided.")
        sys.exit(1)
        
    if "GEMINI_API_KEY" not in os.environ:
        print("\n[WARNING] GEMINI_API_KEY environment variable is not set.")
        api_key = input("Enter your Gemini API Key now (or press Enter if you've set it elsewhere): ").strip()
        if api_key:
            os.environ["GEMINI_API_KEY"] = api_key

    context = InspectionContext(
        transaction_id=str(uuid.uuid4()),
        images=Images(raw_images=test_img_paths)
    )
    
    print(f"\nInitializing VLM Plugin...")
    plugin = VLMPlugin()
    
    print(f"Uploading {len(test_img_paths)} image(s) to Gemini and processing...")
    try:
        result_context = plugin.process(context)
        
        print("\n==============================================")
        print("   CONSOLIDATED TAGGED ENTITIES (JSON)")
        print("==============================================")
        
        print(f"Package Type: {result_context.package_type}")
        print(f"Product Category: {result_context.product_category}")
        print(f"Is Imported: {result_context.is_imported}\n")

        if result_context.multiple_products_detected:
            print("🚨 [ALERT] MULTIPLE DIFFERENT PRODUCTS DETECTED! 🚨")
            print(f"Reason: {result_context.multiple_products_reason}\n")
            
        if not result_context.extracted_entities:
            print("No entities found.")
        else:
            for entity_name, entity_val in result_context.extracted_entities.items():
                conf_percent = (entity_val.confidence * 100) if entity_val.confidence else 0
                bbox_str = f"bbox: {entity_val.bbox.ymin},{entity_val.bbox.xmin},{entity_val.bbox.ymax},{entity_val.bbox.xmax}" if entity_val.bbox else "bbox: None"
                unit_str = f" (Unit: {entity_val.unit})" if entity_val.unit else ""
                print(f"{entity_name+':':<25} {entity_val.value:<25}{unit_str} (Conf: {conf_percent:.1f}%, {bbox_str})")
            
        print("==============================================\n")
        print("Test Passed: VLM successfully evaluated the images.")
        
    except Exception as e:
        print(f"\nPlugin Execution Failed: {e}")
