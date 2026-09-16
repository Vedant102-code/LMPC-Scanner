import os
import uuid
import cv2
import sys
from pathlib import Path

# Fix python path for local imports when running as a script
current_dir = Path(__file__).resolve().parent
backend_dir = current_dir.parent
if str(backend_dir) not in sys.path:
    sys.path.append(str(backend_dir))

from core.context import InspectionContext
from plugins.base_plugin import BasePlugin

class ImageLoadError(Exception):
    pass

class OpenCVPlugin(BasePlugin):
    """
    OpenCV Pre-processing plugin.
    Reads context.images.raw_images, finds the largest contour to crop the product from the background,
    resizes, denoises, and enhances contrast.
    Saves the processed images and updates context.images.processed_images.
    """
    
    def __init__(self, output_dir=None):
        if output_dir is None:
            self.output_dir = os.path.join(backend_dir, "temp_processed")
        else:
            self.output_dir = output_dir
            
        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir, exist_ok=True)
            
    def process(self, context: InspectionContext) -> InspectionContext:
        raw_image_paths = context.images.raw_images
        
        if not raw_image_paths:
            raise ImageLoadError("No raw_images found in context.")
            
        context.images.processed_images = []
        
        for raw_image_path in raw_image_paths:
            if not os.path.exists(raw_image_path):
                print(f"[WARNING] Raw image path is invalid or missing: {raw_image_path}")
                continue
                
            # Read the high-res original image
            original_img = cv2.imread(raw_image_path)
            if original_img is None:
                print(f"[WARNING] Failed to load image from: {raw_image_path}")
                continue
                
            h_orig, w_orig = original_img.shape[:2]
            
            # --- Smart Resizing & Compression ---
            # VLMs don't need aggressive cropping, they just need to not exceed payload limits.
            # We scale down massive 4K phone photos to a max dimension of 1500px.
            max_dimension = 1500
            
            if h_orig > max_dimension or w_orig > max_dimension:
                if h_orig > w_orig:
                    scale_ratio = max_dimension / h_orig
                else:
                    scale_ratio = max_dimension / w_orig
                    
                final_img = cv2.resize(original_img, (0, 0), fx=scale_ratio, fy=scale_ratio, interpolation=cv2.INTER_AREA)
            else:
                final_img = original_img
                
            # Save the compressed image (Quality 85 to save bandwidth)
            filename = f"processed_{uuid.uuid4().hex}.jpg"
            processed_path = os.path.join(self.output_dir, filename)
            cv2.imwrite(processed_path, final_img, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
            
            context.images.processed_images.append(processed_path)
        
        return context

if __name__ == '__main__':
    from core.context import Images
    
    print("--- OpenCV Pre-processing Plugin Test ---")
    
    if len(sys.argv) > 1:
        test_img_paths = sys.argv[1:]
    else:
        user_input = input("Enter the absolute paths to the images (separated by commas): ").strip()
        test_img_paths = [p.strip() for p in user_input.split(",") if p.strip()]
        
    valid_paths = [p for p in test_img_paths if os.path.exists(p)]
    if not valid_paths:
        print("Error: No valid image paths provided.")
        sys.exit(1)
        
    test_dir = os.path.join(backend_dir, "test_images", "processed")
    
    ctx = InspectionContext(
        transaction_id="test-txn-123",
        images=Images(raw_images=valid_paths)
    )
    
    plugin = OpenCVPlugin(output_dir=test_dir)
    try:
        updated_ctx = plugin.process(ctx)
        print("\nSuccess! OpenCV processing complete.")
        
        for i, (orig_path, proc_path) in enumerate(zip(updated_ctx.images.raw_images, updated_ctx.images.processed_images)):
            print(f"\nImage {i+1}:")
            print(f"Original: {orig_path}")
            print(f"Processed saved to: {proc_path}")
            
            # Load images for display
            orig_img = cv2.imread(orig_path)
            proc_img = cv2.imread(proc_path)
            
            # Resize for display purposes so they fit on screen
            def resize_for_display(img, max_h=600):
                h, w = img.shape[:2]
                if h > max_h:
                    scale = max_h / h
                    return cv2.resize(img, None, fx=scale, fy=scale)
                return img
                
            orig_disp = resize_for_display(orig_img)
            proc_disp = resize_for_display(proc_img)
            
            cv2.imshow(f"Original {i+1}", orig_disp)
            cv2.imshow(f"Processed (Cropped & Enhanced) {i+1}", proc_disp)
            
        print("\nPress any key in the image windows to close them and exit...")
        cv2.waitKey(0)
        cv2.destroyAllWindows()
        
    except Exception as e:
        print(f"Test failed: {e}")
