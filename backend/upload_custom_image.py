# upload_custom_image.py
import base64
import json
import time
import os
from storage_agent import upload_image_to_supabase
from test import analyze_food_with_gemini, HARDCODED_DEPTH_DATA, AnalysisResult, FoodItem
import requests
from PIL import Image
import io

def image_to_base64(image_path: str) -> str:
    """Convert JPG image file to base64 string"""
    try:
        with open(image_path, 'rb') as image_file:
            image_data = image_file.read()
            base64_string = base64.b64encode(image_data).decode('utf-8')
            return base64_string
    except Exception as e:
        print(f"❌ Error reading image: {e}")
        return ""

def upload_and_analyze_image(image_path: str):
    """Upload your JPG image and get analysis"""
    print(f"📸 Processing image: {image_path}")
    
    # Check if file exists
    if not os.path.exists(image_path):
        print(f"❌ File not found: {image_path}")
        return
    
    # Convert to base64
    print("🔄 Converting image to base64...")
    image_base64 = image_to_base64(image_path)
    
    if not image_base64:
        print("❌ Failed to convert image to base64")
        return
    
    print(f"✅ Image converted: {len(image_base64)} characters")
    
    # Upload to Supabase
    session_id = f"custom_test_{int(time.time())}"
    frame_id = f"frame_{int(time.time())}"
    
    print("📤 Uploading to Supabase...")
    image_url = upload_image_to_supabase(image_base64, session_id, frame_id)
    
    if not image_url:
        print("❌ Failed to upload to Supabase")
        return
    
    print(f"✅ Image uploaded: {image_url}")
    
    # Test analysis
    print("🔍 Testing analysis...")
    try:
        # Download image for analysis
        response = requests.get(image_url)
        image = Image.open(io.BytesIO(response.content))
        
        # Create mock CaptureRequest
        class MockCaptureRequest:
            def __init__(self):
                self.session_id = session_id
                self.user_id = "test_user"
                self.image_url = image_url
                self.timestamp = int(time.time())
        
        mock_request = MockCaptureRequest()
        
        # Analyze with Gemini (run in async context)
        import asyncio
        
        # Create a mock context with logger
        class MockContext:
            def __init__(self):
                self.logger = MockLogger()
        
        class MockLogger:
            def info(self, msg):
                print(f"ℹ️ {msg}")
            def error(self, msg):
                print(f"❌ {msg}")
        
        async def run_analysis():
            mock_context = MockContext()
            return await analyze_food_with_gemini(mock_request, image, HARDCODED_DEPTH_DATA, mock_context)
        
        # Run the async function
        analysis = asyncio.run(run_analysis())
        
        print("\n🎉 ANALYSIS RESULTS:")
        print(f"📊 Food items found: {len(analysis.food_items)}")
        for item in analysis.food_items:
            print(f"   - {item.name} ({item.category})")
        
        print(f"📈 Remaining: {analysis.remaining_percent}%")
        print(f"🍽️ Consumed since last: {analysis.consumed_since_last}%")
        print(f"🔥 Estimated calories: {analysis.estimated_calories}")
        print(f"🎯 Confidence: {analysis.confidence}")
        
        return analysis
        
    except Exception as e:
        print(f"❌ Analysis failed: {e}")
        return None

def test_with_sample_images():
    """Test with common food images"""
    print("🧪 Testing with sample food images...")
    
    # You can replace these with your own image paths
    sample_images = [
        "pasta.jpg",
        "salad.jpg", 
        "sandwich.jpg",
        "pizza.jpg"
    ]
    
    for image_name in sample_images:
        if os.path.exists(image_name):
            print(f"\n--- Testing {image_name} ---")
            upload_and_analyze_image(image_name)
        else:
            print(f"⚠️ {image_name} not found, skipping...")

if __name__ == "__main__":
    print("🚀 Custom Image Upload & Analysis Test")
    print("=" * 50)
    
    # Use the pic1.png file automatically
    image_path = "assets/pic1.png"
    
    print(f"📸 Using image: {image_path}")
    upload_and_analyze_image(image_path)
    
    print("\n✅ Test completed!")
