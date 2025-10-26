#!/usr/bin/env python3
"""
Test script for the integrated eating pace scoring system
"""

import requests
import json
import time
import base64
from PIL import Image
import io

# Test configuration
BACKEND_URL = "http://localhost:8000"
TEST_SESSION_ID = "test_session_001"

def create_test_image():
    """Create a simple test image"""
    # Create a simple colored image
    img = Image.new('RGB', (100, 100), color='red')
    
    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    img_str = base64.b64encode(buffer.getvalue()).decode()
    
    return img_str

def test_scoring_system():
    """Test the complete scoring system integration"""
    print("🧪 Testing Eating Pace Scoring System Integration")
    print("=" * 50)
    
    # Test data
    test_samples = [
        {"food_remaining": 100, "consumed": 0},
        {"food_remaining": 95, "consumed": 5},
        {"food_remaining": 90, "consumed": 5},
        {"food_remaining": 85, "consumed": 5},
        {"food_remaining": 80, "consumed": 5},
        {"food_remaining": 75, "consumed": 5},
        {"food_remaining": 70, "consumed": 5},
        {"food_remaining": 65, "consumed": 5},
        {"food_remaining": 60, "consumed": 5},
        {"food_remaining": 55, "consumed": 5},
        {"food_remaining": 50, "consumed": 5},
    ]
    
    print(f"📊 Testing with {len(test_samples)} samples")
    
    # Create test image
    test_image = create_test_image()
    
    # Test each sample
    for i, sample in enumerate(test_samples):
        print(f"\n📸 Sample {i + 1}: {sample['food_remaining']}% remaining")
        
        # Prepare request
        request_data = {
            "session_id": TEST_SESSION_ID,
            "user_id": "test_user",
            "image_base64": test_image,
            "depth_cache": {
                "width": 100,
                "height": 100,
                "depth_values": [1.0] * 10000  # Simple depth data
            },
            "timestamp": int(time.time() * 1000)
        }
        
        try:
            # Send request to backend
            response = requests.post(
                f"{BACKEND_URL}/analyze",
                json=request_data,
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                
                print(f"✅ Response received")
                print(f"   🐕 Dog State: {result.get('visual_state', 'unknown')}")
                print(f"   📊 Progress: {result.get('progress', 0):.1f}%")
                print(f"   💬 Message: {result.get('message', 'No message')[:50]}...")
                
                # Check for scoring data
                scoring_data = result.get('scoring_data')
                if scoring_data:
                    print(f"   🏆 Score: {scoring_data.get('total_score', 0):.1f}")
                    print(f"   📈 Grade: {scoring_data.get('grade', 'N/A')}")
                    print(f"   ⏱️ Duration: {scoring_data.get('session_duration', 0):.1f}s")
                    print(f"   🍎 Food Consumed: {scoring_data.get('food_consumed', 0):.1f}%")
                    print(f"   📊 Average Rate: {scoring_data.get('average_rate', 0):.2f}%/s")
                    print(f"   🎯 Pace Status: {scoring_data.get('pace_status', 'unknown')}")
                    print(f"   💡 Recommendation: {scoring_data.get('recommendation', 'No recommendation')}")
                else:
                    print("   ⚠️ No scoring data in response")
                    
            else:
                print(f"❌ Request failed with status {response.status_code}")
                print(f"   Response: {response.text}")
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Request failed: {e}")
        
        # Wait between requests
        time.sleep(1)
    
    print(f"\n🏁 Test completed!")
    print(f"📊 Final session stats should show scoring data")

def test_session_endpoint():
    """Test the session endpoint"""
    print(f"\n📊 Testing session endpoint...")
    
    try:
        response = requests.get(f"{BACKEND_URL}/session/{TEST_SESSION_ID}")
        
        if response.status_code == 200:
            session_data = response.json()
            print(f"✅ Session data retrieved:")
            print(f"   Session ID: {session_data.get('session_id')}")
            print(f"   Total Consumed: {session_data.get('total_consumed', 0)}%")
            print(f"   Captures: {session_data.get('captures', 0)}")
            print(f"   Exists: {session_data.get('exists', False)}")
        else:
            print(f"❌ Session request failed with status {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Session request failed: {e}")

if __name__ == "__main__":
    print("🚀 Starting Eating Pace Scoring System Test")
    print("Make sure the backend is running on http://localhost:8000")
    print()
    
    # Test the main scoring system
    test_scoring_system()
    
    # Test session endpoint
    test_session_endpoint()
    
    print("\n✅ Integration test completed!")
    print("\nTo test the AR integration:")
    print("1. Open the Snap Spectacles project in Lens Studio")
    print("2. Assign the ScoringEngine component to the SceneController")
    print("3. Run the project and observe scoring data in the console")
    print("4. Check the ResponseUI for scoring messages")
