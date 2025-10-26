# test_supabase_upload.py
import base64
import os
from storage_agent import upload_image_to_supabase

def test_upload_jpg(image_path: str):
    """Test uploading a JPG image to Supabase"""
    print(f"📸 Testing upload of: {image_path}")
    
    # Check if file exists
    if not os.path.exists(image_path):
        print(f"❌ File not found: {image_path}")
        return None
    
    # Convert JPG to base64
    try:
        with open(image_path, 'rb') as f:
            image_data = f.read()
            image_base64 = base64.b64encode(image_data).decode('utf-8')
        print(f"✅ Image converted to base64: {len(image_base64)} characters")
    except Exception as e:
        print(f"❌ Error reading image: {e}")
        return None
    
    # Upload to Supabase
    session_id = "test_session"
    frame_id = "test_frame"
    
    print("📤 Uploading to Supabase 'meals' bucket...")
    image_url = upload_image_to_supabase(image_base64, session_id, frame_id)
    
    if image_url:
        print(f"✅ Success! Image URL: {image_url}")
        return image_url
    else:
        print("❌ Upload failed")
        return None

if __name__ == "__main__":
    print("🧪 Supabase Upload Test")
    print("=" * 30)
    
    # Use the pic1.png file automatically
    image_path = "assets/pic1.png"
    
    print(f"📸 Using image: {image_path}")
    
    # Test upload
    url = test_upload_jpg(image_path)
    
    if url:
        print(f"\n🎉 Upload successful!")
        print(f"📸 You can view your image at: {url}")
        print(f"🔗 Test the URL in your browser to verify it works")
    else:
        print(f"\n❌ Upload failed. Check your Supabase setup:")
        print(f"   1. Make sure 'meals' bucket exists")
        print(f"   2. Check SUPABASE_URL and SUPABASE_KEY in .env")
        print(f"   3. Ensure bucket is set to public access")
