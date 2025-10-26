# test_supabase_images.py
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

# Initialize Supabase
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

def test_supabase_images():
    """Test if we have images in Supabase"""
    print("🔍 Checking Supabase for images...")
    
    try:
        # Query images from database
        response = supabase.table('meal_images').select('*').order('uploaded_at', desc=True).limit(5).execute()
        
        if not response.data:
            print("❌ No images found in Supabase")
            print("💡 You need to upload images first using:")
            print("   python upload_assets_folder.py")
            return False
        
        images = response.data
        print(f"✅ Found {len(images)} images in Supabase")
        
        for i, img in enumerate(images, 1):
            print(f"\n📸 Image {i}:")
            print(f"   Session: {img['session_id']}")
            print(f"   Frame: {img['frame_id']}")
            print(f"   URL: {img['url']}")
            print(f"   Uploaded: {img['uploaded_at']}")
            
            # Test if URL is accessible
            import requests
            try:
                test_response = requests.head(img['url'], timeout=10)
                if test_response.status_code == 200:
                    print(f"   ✅ URL accessible")
                else:
                    print(f"   ❌ URL not accessible: HTTP {test_response.status_code}")
            except Exception as e:
                print(f"   ❌ URL error: {e}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error querying Supabase: {e}")
        return False

if __name__ == "__main__":
    test_supabase_images()
