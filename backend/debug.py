# debug_image_processing.py
import requests
from PIL import Image
import io
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

# Initialize Supabase
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

def debug_image_processing():
    """Debug image processing step by step"""
    print("🔍 Debugging image processing...")
    
    try:
        # Get first image
        response = supabase.table('meal_images').select('*').order('uploaded_at', desc=True).limit(1).execute()
        
        if not response.data:
            print("❌ No images found")
            return
        
        image_record = response.data[0]
        image_url = image_record['url']
        
        print(f"📸 Testing image: {image_url}")
        
        # Step 1: Download image
        print("\n1️⃣ Downloading image...")
        download_response = requests.get(image_url, timeout=30)
        print(f"   Status code: {download_response.status_code}")
        print(f"   Content type: {download_response.headers.get('content-type', 'unknown')}")
        print(f"   Content length: {len(download_response.content)} bytes")
        
        if download_response.status_code != 200:
            print("❌ Download failed")
            return
        
        # Step 2: Check content
        print("\n2️⃣ Checking content...")
        content = download_response.content
        print(f"   First 20 bytes: {content[:20]}")
        print(f"   Is JPEG header? {content.startswith(b'\\xff\\xd8\\xff')}")
        
        # Step 3: Try to open with PIL
        print("\n3️⃣ Opening with PIL...")
        try:
            # Create BytesIO object
            image_buffer = io.BytesIO(content)
            print(f"   BytesIO object created: {type(image_buffer)}")
            
            # Try to open image
            image = Image.open(image_buffer)
            print(f"   ✅ Image opened successfully!")
            print(f"   Format: {image.format}")
            print(f"   Mode: {image.mode}")
            print(f"   Size: {image.size}")
            
            # Try to verify
            image.verify()
            print(f"   ✅ Image verified successfully!")
            
            # Reopen for actual use
            image_buffer.seek(0)
            image = Image.open(image_buffer)
            print(f"   ✅ Image ready for processing!")
            
        except Exception as e:
            print(f"   ❌ PIL error: {e}")
            print(f"   Error type: {type(e)}")
            
            # Try alternative approach
            print("\n4️⃣ Trying alternative approach...")
            try:
                # Save to temp file and open
                with open('temp_image.jpg', 'wb') as f:
                    f.write(content)
                
                temp_image = Image.open('temp_image.jpg')
                print(f"   ✅ Opened via temp file: {temp_image.size}")
                
                # Clean up
                os.remove('temp_image.jpg')
                
            except Exception as e2:
                print(f"   ❌ Alternative approach failed: {e2}")
        
    except Exception as e:
        print(f"❌ Debug failed: {e}")

if __name__ == "__main__":
    debug_image_processing()