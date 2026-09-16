from typing import List
from core.context import InspectionContext
from plugins.base_plugin import BasePlugin
from plugins.opencv_plugin import OpenCVPlugin
from plugins.vlm_plugin import VLMPlugin
from plugins.rule_engine_plugin import RuleEnginePlugin
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CompliancePipeline:
    def __init__(self, plugins: List[BasePlugin]):
        self.plugins = plugins

    def run(self, context: InspectionContext) -> InspectionContext:
        """
        Executes the pipeline by passing the context sequentially through all active plugins.
        """
        logger.info(f"Starting pipeline execution for transaction: {context.transaction_id}")
        
        for plugin in self.plugins:
            plugin_name = plugin.__class__.__name__
            logger.info(f"Running plugin: {plugin_name}")
            try:
                context = plugin.process(context)
            except Exception as e:
                logger.error(f"Error executing {plugin_name}: {e}")
                # Stop execution if a critical plugin fails
                raise e
                
        logger.info(f"Pipeline execution completed for transaction: {context.transaction_id}")
        return context

if __name__ == "__main__":
    from core.context import InspectionContext, Images
    import uuid
    import sys
    import os
    
    if len(sys.argv) > 1:
        test_img_paths = sys.argv[1:]
    else:
        user_input = input("Enter the absolute paths to the images (separated by commas): ").strip()
        test_img_paths = [p.strip() for p in user_input.split(",") if p.strip()]

    valid_paths = [p for p in test_img_paths if os.path.exists(p)]
    if not valid_paths:
        print(f"Error: None of the provided files exist.")
        sys.exit(1)

    print("\n--- Physical Dimensions (For Rule 7 Validation) ---")
    height_input = input("Enter the physical height of the package in cm (or press Enter to skip): ").strip()
    width_input = input("Enter the physical width of the package in cm (or press Enter to skip): ").strip()
    
    pkg_h = float(height_input) if height_input else None
    pkg_w = float(width_input) if width_input else None

    test_context = InspectionContext(
        transaction_id=str(uuid.uuid4()),
        images=Images(raw_images=valid_paths),
        package_height_cm=pkg_h,
        package_width_cm=pkg_w
    )
    
    pipeline = CompliancePipeline(plugins=[OpenCVPlugin(), VLMPlugin(), RuleEnginePlugin()])
    
    result_context = pipeline.run(test_context)
    
    print("\n==============================================")
    print("   1. OPENCV PRE-PROCESSING")
    print("==============================================")
    for path in result_context.images.processed_images:
        print(f"Processed Image Saved: {path}")

    print("\n==============================================")
    print("   2. VLM EXTRACTED ENTITIES (GEMINI)")
    print("==============================================")
    if result_context.extracted_entities:
        for entity_name, entity_val in result_context.extracted_entities.items():
            conf_percent = (entity_val.confidence * 100) if entity_val.confidence else 0
            bbox_str = f"bbox: {entity_val.bbox.ymin},{entity_val.bbox.xmin},{entity_val.bbox.ymax},{entity_val.bbox.xmax}" if entity_val.bbox else "bbox: None"
            unit_str = f" (Unit: {entity_val.unit})" if entity_val.unit else ""
            print(f"{entity_name+':':<25} {entity_val.value:<25}{unit_str} (Conf: {conf_percent:.1f}%, {bbox_str})")
    else:
        print("No entities were extracted.")
        
    print("\n==============================================")
    print("   3. LMPC 2011 COMPLIANCE REPORT")
    print("==============================================")
    cr = result_context.compliance_result
    if cr:
        print(f"Status:         {cr.status}")
        print(f"Score:          {cr.severity_score}/100")
        print(f"Is Compliant:   {cr.is_compliant}\n")
        
        if cr.violations:
            print("Violations Found:")
            for v in cr.violations:
                print(f" ❌ [{v.severity}] {v.rule_id} ({v.field}): {v.description}")
        else:
            print("✅ No violations found. Package is fully compliant.")
    else:
        print("Error: No compliance result was generated.")
        
    print("==============================================\n")
    print("Pipeline run successfully!")
