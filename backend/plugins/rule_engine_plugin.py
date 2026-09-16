import time
import os
import yaml
from typing import List

from core.context import InspectionContext, ComplianceResult, Violation, BoundingBox, EntityValue
from plugins.base_plugin import BasePlugin

class RuleEnginePlugin(BasePlugin):
    def __init__(self, rules_path: str = None):
        if rules_path is None:
            rules_path = os.path.join(os.path.dirname(__file__), '..', 'rules', 'lmpc_rules.yaml')
            
        # 1. Wait for backend/rules/lmpc_rules.yaml to exist.
        while not os.path.exists(rules_path):
            print(f"Waiting for {rules_path} to exist...")
            time.sleep(5)
            
        with open(rules_path, 'r') as f:
            self.rules = yaml.safe_load(f)

    def process(self, context: InspectionContext) -> InspectionContext:
        score = 100
        violations = []
        is_compliant = True

        extracted = context.extracted_entities
        
        # Stage 1: Exemptions
        is_exempt = False
        
        if context.package_type and context.package_type.lower() == "wholesale":
            is_exempt = True
            
        if not is_exempt and "NET_QUANTITY" in extracted and extracted["NET_QUANTITY"].unit:
            try:
                val = float(extracted["NET_QUANTITY"].value)
                unit = extracted["NET_QUANTITY"].unit.strip().lower()
                
                exemptions = self.rules.get("LMPC_2011_Rules", {}).get("Rule_3_and_26_Exemptions", {})
                max_g = exemptions.get("exempt_if_qty_less_than_g", 10)
                max_ml = exemptions.get("exempt_if_qty_less_than_ml", 10)
                max_kg = exemptions.get("exempt_if_qty_greater_than_kg", 25)
                max_L = exemptions.get("exempt_if_qty_greater_than_L", 25)
                
                if unit == "g" and val <= max_g:
                    is_exempt = True
                elif unit == "ml" and val <= max_ml:
                    is_exempt = True
                elif unit == "kg" and val >= max_kg:
                    is_exempt = True
                elif unit in ["l", "litre"] and val >= max_L:
                    is_exempt = True
            except ValueError:
                pass
                
        if is_exempt:
            context.compliance_result = ComplianceResult(
                is_compliant=True,
                severity_score=100,
                status="APPROVED (EXEMPT)",
                violations=[]
            )
            return context
            
        # Stage 1.5: Multi-Product Consistency Check
        if context.multiple_products_detected:
            violations.append(Violation(
                rule_id="Image_Consistency",
                field="Images",
                description=f"Inconsistent images detected: {context.multiple_products_reason or 'The uploaded images belong to different products.'}",
                severity="CRITICAL"
            ))
            score -= 100

        # Stage 2: Mandatory Checks
        mandatory = self.rules.get("LMPC_2011_Rules", {}).get("Rule_6_and_10_Mandatory_Declarations", {})
        always_req = mandatory.get("always_required", [])
        
        for field in always_req:
            if field not in extracted or not extracted[field].value:
                violations.append(Violation(
                    rule_id="Rule_6",
                    field=field,
                    description=f"Missing mandatory field: {field}",
                    severity="CRITICAL"
                ))
                score -= 20
                
        cond_req = mandatory.get("conditional", [])
        for cond in cond_req:
            field = cond.get("field")
            condition = cond.get("condition")
            
            trigger = False
            if condition == "is_imported == True" and context.is_imported:
                trigger = True
            elif condition == "is_imported == False" and not context.is_imported:
                trigger = True
            elif condition == "product_category == 'Food'" and context.product_category == "Food":
                trigger = True
                
            if trigger:
                if field not in extracted or not extracted[field].value:
                    violations.append(Violation(
                        rule_id="Rule_6",
                        field=field,
                        description=f"Missing conditional field: {field} (Required because {condition})",
                        severity="CRITICAL"
                    ))
                    score -= 10
                    
        # Stage 2b: Category Specific Checks
        cat_req = self.rules.get("LMPC_2011_Rules", {}).get("Rule_14_and_16_Category_Specific", {}).get("conditional", [])
        for cond in cat_req:
            req_fields = cond.get("required_fields", [])
            condition = cond.get("condition")
            if f"product_category == '{context.product_category}'" == condition:
                for field in req_fields:
                    if field not in extracted or not extracted[field].value:
                        violations.append(Violation(
                            rule_id="Rule_14_16",
                            field=field,
                            description=f"Missing category-specific field: {field} for {context.product_category}",
                            severity="CRITICAL"
                        ))
                        score -= 10

        # Stage 3: Formatting (Rule 12 and 13)
        rule_13 = self.rules.get("LMPC_2011_Rules", {}).get("Rule_13_Unit_Formats", {})
        allowed_units = rule_13.get("allowed_metric_units", [])
        
        if "NET_QUANTITY" in extracted and extracted["NET_QUANTITY"].unit:
            unit_val = extracted["NET_QUANTITY"].unit.lower()
            if unit_val not in allowed_units:
                violations.append(Violation(
                    rule_id="Rule_13",
                    field="NET_QUANTITY (Unit)",
                    description=f"Invalid unit format: '{unit_val}'. Allowed: {allowed_units}",
                    severity="WARNING"
                ))
                score -= 10
                
        rule_12 = self.rules.get("LMPC_2011_Rules", {}).get("Rule_12_Prohibited_Words", {})
        forbidden_words = rule_12.get("forbidden_quantity_modifiers", [])
        if "NET_QUANTITY" in extracted:
            val_str = extracted["NET_QUANTITY"].value.lower()
            for word in forbidden_words:
                if word in val_str:
                    violations.append(Violation(
                        rule_id="Rule_12",
                        field="NET_QUANTITY",
                        description=f"Prohibited word '{word}' found in quantity declaration.",
                        severity="WARNING"
                    ))
                    score -= 10

        # Stage 4: Rule 7 Size Checks.
        # TEMPORARILY DISABLED as requested by user.
        if False and context.package_height_cm is not None and context.package_width_cm is not None:
            area = context.package_height_cm * context.package_width_cm
            
            ranges = self.rules.get("LMPC_2011_Rules", {}).get("Rule_7_PDP_Area_Minimum_Heights", {}).get("ranges", [])
            min_height_mm = 0
            for r in ranges:
                cond = r.get("condition")
                parts = cond.split(" and ")
                eval_str = " and ".join([f"area {p}" for p in parts])
                try:
                    if eval(eval_str, {"area": area}):
                        min_height_mm = r.get("min_height_mm", 0)
                        break
                except Exception:
                    pass
                    
            if min_height_mm > 0:
                for field, entity in extracted.items():
                    if entity.bbox is not None:
                        h_mm = (entity.bbox.ymax - entity.bbox.ymin) / 1000.0 * context.package_height_cm * 10.0
                        if h_mm < min_height_mm:
                            violations.append(Violation(
                                rule_id="Rule_7",
                                field=field,
                                description=f"Font size for {field} is {h_mm:.2f}mm, less than minimum required {min_height_mm}mm",
                                severity="WARNING"
                            ))
                            score -= 5

        # 5. Calculate a final severity_score
        score = max(0, score)
        if score < 100 or context.multiple_products_detected:
            is_compliant = False
            
        status = "REJECTED" if not is_compliant else "APPROVED"
        
        # 6. Attach a ComplianceResult to the context
        context.compliance_result = ComplianceResult(
            is_compliant=is_compliant,
            severity_score=score,
            status=status,
            violations=violations
        )
        return context

# 7. Write an independent test block that mocks the VLM output and tests the engine.
if __name__ == "__main__":
    from core.context import Images
    import uuid
    import sys
    
    print("Testing RuleEnginePlugin...")
    
    # Create mock context
    context = InspectionContext(
        transaction_id=str(uuid.uuid4()),
        images=Images(raw_images=["mock.jpg"]),
        package_height_cm=10.0,
        package_width_cm=8.0,
        package_type="Retail",
        is_imported=True,
        extracted_entities={
            "MRP": EntityValue(value="100", bbox=BoundingBox(ymin=100, xmin=100, ymax=110, xmax=200)),
            "NET_QUANTITY": EntityValue(value="500", unit="g", bbox=BoundingBox(ymin=200, xmin=100, ymax=215, xmax=200)),
            "COUNTRY_OF_ORIGIN": EntityValue(value="USA", bbox=BoundingBox(ymin=300, xmin=100, ymax=310, xmax=200)),
            # MANUFACTURER_NAME, CONSUMER_CARE_PHONE, etc are intentionally missing to test Stage 2
        }
    )
    
    # Area = 10 * 8 = 80 cm^2.
    # From rules, 50 <= Area <= 100 -> min_height_mm = 1.5 mm
    # Bbox for MRP: ymax-ymin = 10. height = 10/1000 * 10 * 10 = 1.0 mm (violates Rule 7)
    # Bbox for Net_Quantity_Value: ymax-ymin = 15. height = 15/1000 * 10 * 10 = 1.5 mm (Compliant)
    
    plugin = RuleEnginePlugin()
    result_context = plugin.process(context)
    
    print("\n--- Compliance Result ---")
    print(f"Is Compliant: {result_context.compliance_result.is_compliant}")
    print(f"Severity Score: {result_context.compliance_result.severity_score}")
    print(f"Status: {result_context.compliance_result.status}")
    print("Violations:")
    for v in result_context.compliance_result.violations:
        print(f" - [{v.severity}] {v.rule_id} on {v.field}: {v.description}")
    
    print("\nTest completed.")
