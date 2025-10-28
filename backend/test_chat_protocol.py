#!/usr/bin/env python3
"""
Test Fetch.ai Agents Chat Protocol
This script tests the chat protocol between agents
"""

import asyncio
import time
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def test_chat_protocol():
    """Test chat protocol between agents"""
    print("🧪 Testing Fetch.ai Chat Protocol")
    print("=" * 40)
    
    try:
        # Import agents
        from storage_agent import storage_agent, UploadRequest
        from test import analysis_agent, CaptureRequest, AnalysisResult
        from nutrition_analysis_agent import analysis_agent as nutrition_agent, AnalysisRequest as NutritionRequest
        
        print("✅ All agents imported successfully")
        
        # Test 1: Storage Agent -> Analysis Agent
        print("\n📨 Test 1: Storage Agent -> Analysis Agent")
        
        # Create test upload request
        test_image_base64 = "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A"  # Minimal 1x1 red pixel
        
        upload_request = UploadRequest(
            image_base64=test_image_base64,
            session_id="test_session_001",
            frame_id="test_frame_001",
            user_id="test_user"
        )
        
        print(f"📤 Sending upload request to Storage Agent: {storage_agent.address}")
        
        # Send message via chat protocol
        result = await storage_agent.send(analysis_agent.address, upload_request)
        
        if result:
            print("✅ Chat protocol test successful!")
            print(f"📊 Analysis result: {result}")
        else:
            print("❌ Chat protocol test failed")
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()

def test_agent_addresses():
    """Test that agents have valid addresses"""
    print("\n📍 Testing Agent Addresses")
    print("=" * 30)
    
    try:
        from storage_agent import storage_agent
        from test import analysis_agent
        from nutrition_analysis_agent import analysis_agent as nutrition_agent
        
        print(f"Storage Agent: {storage_agent.address}")
        print(f"Analysis Agent: {analysis_agent.address}")
        print(f"Nutrition Agent: {nutrition_agent.address}")
        
        # Check if addresses are valid
        if all([storage_agent.address, analysis_agent.address, nutrition_agent.address]):
            print("✅ All agents have valid addresses")
            return True
        else:
            print("❌ Some agents have invalid addresses")
            return False
            
    except Exception as e:
        print(f"❌ Address test failed: {e}")
        return False

def main():
    """Main test function"""
    print("🚀 Fetch.ai Chat Protocol Test")
    print("=" * 50)
    
    # Test agent addresses first
    if not test_agent_addresses():
        print("❌ Agent address test failed. Check your agent configuration.")
        return
    
    print("\n🧪 Running chat protocol test...")
    print("Note: This test requires network connectivity to Fetch.ai")
    
    try:
        # Run async test
        asyncio.run(test_chat_protocol())
    except Exception as e:
        print(f"❌ Chat protocol test failed: {e}")
        print("This might be due to network connectivity issues")

if __name__ == "__main__":
    main()
