#!/usr/bin/env python3
"""
Test Chat Protocol Components
Verify that all chat protocol imports work correctly
"""

def test_chat_protocol_imports():
    """Test if chat protocol components can be imported"""
    print("🧪 Testing Chat Protocol Components")
    print("=" * 40)
    
    try:
        from uagents_core.contrib.protocols.chat import (
            chat_protocol_spec,
            ChatMessage,
            ChatAcknowledgement,
            TextContent,
            ResourceContent,
            StartSessionContent,
            MetadataContent,
        )
        print("✅ All chat protocol components imported successfully!")
        
        # Test creating a message
        from datetime import datetime, timezone
        from uuid import uuid4
        
        test_message = ChatMessage(
            timestamp=datetime.now(timezone.utc),
            msg_id=uuid4(),
            content=[TextContent(type="text", text="Hello, world!")],
        )
        
        print("✅ ChatMessage created successfully!")
        print(f"   Message ID: {test_message.msg_id}")
        print(f"   Content: {test_message.content[0].text}")
        
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("💡 Make sure you have uagents-core installed:")
        print("   pip install uagents-core>=0.3.0")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_agent_creation():
    """Test if agent can be created with chat protocol"""
    print("\n🧪 Testing Agent Creation")
    print("=" * 30)
    
    try:
        from uagents import Agent, Protocol
        from uagents_core.contrib.protocols.chat import chat_protocol_spec
        
        agent = Agent(name="test_chat_agent")
        chat_proto = Protocol(spec=chat_protocol_spec)
        
        print("✅ Agent and chat protocol created successfully!")
        print(f"   Agent address: {agent.address}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Chat Protocol Test Suite")
    print("=" * 50)
    
    success = True
    
    success &= test_chat_protocol_imports()
    success &= test_agent_creation()
    
    if success:
        print("\n🎉 All tests passed!")
        print("✅ Ready for Agentverse deployment!")
    else:
        print("\n❌ Some tests failed!")
        print("🔧 Fix the issues above before deploying")

if __name__ == "__main__":
    main()
