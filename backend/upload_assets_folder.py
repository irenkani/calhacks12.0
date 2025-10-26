# upload_assets_folder.py
import base64
import json
import time
import os
import glob
from storage_agent import upload_image_to_supabase

def image_to_base64(image_path: str) -> str:
    """Convert image file to base64 string"""
    try:
        with open(image_path, 'rb') as image_file:
            image_data = image_file.read()
            base64_string = base64.b64encode(image_data).decode('utf-8')
            return base64_string
    except Exception as e:
        print(f"❌ Error reading {image_path}: {e}")
        return ""

def upload_image_with_metadata(image_path: str, session_id: str):
    """Upload single image with metadata"""
    print(f"\n📸 Uploading: {os.path.basename(image_path)}")
    
    # Convert to base64
    image_base64 = image_to_base64(image_path)
    if not image_base64:
        return None
    
    # Upload to Supabase
    frame_id = f"frame_{int(time.time())}"
    image_url = upload_image_to_supabase(image_base64, session_id, frame_id)
    
    if image_url:
        print(f"✅ Uploaded: {image_url}")
        return {
            'filename': os.path.basename(image_path),
            'url': image_url,
            'session_id': session_id,
            'frame_id': frame_id,
            'uploaded_at': int(time.time())
        }
    else:
        print(f"❌ Failed to upload {os.path.basename(image_path)}")
        return None

def batch_upload_assets_folder(interval_seconds: int = 30):
    """Upload all images from assets folder with intervals"""
    print("🚀 Starting batch upload from assets folder")
    print(f"⏱️ Interval: {interval_seconds} seconds between uploads")
    
    assets_folder = "assets"
    if not os.path.exists(assets_folder):
        print(f"❌ Assets folder not found: {assets_folder}")
        return
    
    # Find all image files
    image_extensions = ['*.jpg', '*.jpeg', '*.png', '*.gif', '*.bmp']
    image_files = []
    
    for ext in image_extensions:
        image_files.extend(glob.glob(os.path.join(assets_folder, ext)))
        image_files.extend(glob.glob(os.path.join(assets_folder, ext.upper())))
    
    if not image_files:
        print(f"❌ No image files found in {assets_folder}")
        return
    
    print(f"📁 Found {len(image_files)} images to upload")
    
    # Create session ID
    session_id = f"assets_batch_{int(time.time())}"
    
    # Upload each image
    uploaded_images = []
    for i, image_path in enumerate(image_files, 1):
        print(f"\n{'='*50}")
        print(f"📸 Uploading image {i}/{len(image_files)}")
        
        result = upload_image_with_metadata(image_path, session_id)
        if result:
            uploaded_images.append(result)
        
        # Wait before next image (except for the last one)
        if i < len(image_files):
            print(f"⏳ Waiting {interval_seconds} seconds before next image...")
            time.sleep(interval_seconds)
    
    # Summary
    print(f"\n{'='*50}")
    print(f"🎉 BATCH UPLOAD COMPLETE!")
    print(f"📊 Total images: {len(image_files)}")
    print(f"✅ Successfully uploaded: {len(uploaded_images)}")
    print(f"❌ Failed uploads: {len(image_files) - len(uploaded_images)}")
    
    # Save results
    results_file = f"upload_results_{int(time.time())}.json"
    with open(results_file, 'w') as f:
        json.dump(uploaded_images, f, indent=2)
    print(f"📄 Results saved to: {results_file}")

if __name__ == "__main__":
    batch_upload_assets_folder(30)  # 30 second intervals