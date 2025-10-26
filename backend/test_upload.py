# test_upload.py
import base64
import json
import time
from storage_agent import storage_agent, UploadRequest, upload_image_to_supabase

def create_test_image_base64():
    """Create a simple test image as base64"""
    # This is a minimal 1x1 red pixel JPEG
    return "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAgMDAwYDAwYMCAcIDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlbaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9/KKKKAP/2Q=="

def test_direct_upload():
    """Test direct upload to Supabase"""
    print("🧪 Testing direct Supabase upload...")
    
    session_id = f"test_session_{int(time.time())}"
    frame_id = "test_frame_001"
    
    # Test image upload only
    image_base64 = create_test_image_base64()
    image_url = upload_image_to_supabase(image_base64, session_id, frame_id)
    print(f"✅ Image uploaded: {image_url}")
    
    return image_url

def test_agent_message():
    """Test sending message to Storage Agent"""
    print("🧪 Testing Storage Agent message...")
    
    # This would require the agent to be running
    # You can use this to test the full flow
    session_id = f"test_session_{int(time.time())}"
    frame_id = "test_frame_002"
    
    upload_request = UploadRequest(
        image_base64=create_test_image_base64(),
        session_id=session_id,
        frame_id=frame_id,
        user_id="test_user"
        # No depth_data field
    )
    
    print(f"📦 Created UploadRequest for session: {session_id}")
    print(f"   Frame ID: {frame_id}")
    print(f"   Image size: {len(upload_request.image_base64)} chars")
    
    return upload_request

if __name__ == "__main__":
    print("🚀 Starting upload tests...")
    
    # Test 1: Direct Supabase upload
    image_url = test_direct_upload()
    
    # Test 2: Create agent message (for when agent is running)
    upload_request = test_agent_message()
    
    print("\n✅ Tests completed!")
    print(f"📸 Image URL: {image_url}")
    print(f"📦 UploadRequest created for agent testing")