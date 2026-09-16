# LMPC Storage & Data Architecture

This document breaks down exactly what data we are collecting, where it lives, and how it is linked together. It serves as the blueprint for upgrading our backend to support the new Manual Override and Multi-Image features.

## 1. File Storage (The Image Vault)
*Currently stored locally in `backend/uploads/`. (Easily migratable to AWS S3 or Google Cloud Storage).*

We need to store three distinct types of images. To keep things organized, we will partition them by `inspection_id`:

- **Raw Scans** (`/uploads/{inspection_id}/scans/`): The original, pristine high-res photos taken by the inspector's phone.
- **Processed Scans** (`/uploads/{inspection_id}/processed/`): The downscaled, compressed versions that we actually feed to Gemini (to save on bandwidth/API costs).
- **Evidence Photos** (`/uploads/{inspection_id}/evidence/`): The photos taken *specifically* when an inspector manually overrides a failed rule.

---

## 2. Relational Database (SQLite)
*Currently using `lmpc.db` via SQLAlchemy. (Easily migratable to PostgreSQL).*

We need to upgrade from our basic 2-table setup to a more robust 3-table setup to handle the new checklist and overrides.

### Table A: `inspections`
*The master record for a single field inspection event.*
- `id` (Integer, Primary Key)
- `inspection_id` (String) ➔ *The human-readable ID generated on the Landing Screen (e.g., LMPC-7F2A9).*
- `timestamp` (DateTime) ➔ *When the scan occurred.*
- `inspector_id` (String) ➔ *(For later) Which officer performed the scan.*
- `location_address` (String) ➔ *Manual entry of the store/location (e.g., "Reliance Smart, Sec 14").*
- `location_gps` (String) ➔ *Automatically captured Latitude/Longitude from the device.*
- `product_brand` (String) ➔ *Brand of the product being inspected.*
- `product_name` (String) ➔ *Name of the product being inspected.*
- `overall_score` (Integer) ➔ *0 to 100.*
- `is_compliant` (Boolean) ➔ *True if APPROVED, False if REJECTED.*
- `extracted_data_json` (Text) ➔ *A raw dump of everything Gemini extracted (for future auditing).*

### Table B: `inspection_images`
*A registry of every physical file tied to an inspection.*
- `id` (Integer, Primary Key)
- `inspection_id` (Foreign Key ➔ `inspections.id`)
- `image_type` (String) ➔ *Can be either 'SCAN' or 'EVIDENCE'.*
- `file_path` (String) ➔ *The relative path to the image on the server.*

### Table C: `compliance_checks`
*This replaces the old "violations" table. Instead of just logging failures, we log the entire checklist so we have a paper trail of Overrides.*
- `id` (Integer, Primary Key)
- `inspection_id` (Foreign Key ➔ `inspections.id`)
- `field_name` (String) ➔ *e.g., 'NET_QUANTITY', 'MANUFACTURER_ADDRESS'.*
- `status` (String) ➔ *'PASS', 'FAIL', or 'OVERRIDDEN'.*
- `ai_confidence` (Float) ➔ *The percentage confidence Gemini had.*
- `failure_reason` (String, Nullable) ➔ *If it failed, why? (e.g., "Missing mandatory field").*
- `evidence_image_id` (Foreign Key ➔ `inspection_images.id`, Nullable) ➔ *If the status is 'OVERRIDDEN', this links directly to the specific photo the inspector took to prove it.*

---

## The "Save" Flow (How it all connects)

When the inspector presses "SUBMIT FINAL REPORT" on the app:
1. The app sends a massive payload to a new FastAPI endpoint (e.g., `/api/save_inspection`).
2. The payload includes the `inspection_id`, the final `overall_score`, and the `checklist` array.
3. It also uploads the actual binary image files for the original scans AND any evidence photos taken.
4. The backend saves the files to the hard drive, gets their file paths, and then creates the SQL rows linking everything together using the structure above.
