#!/usr/bin/env python3
"""
Check Agentverse Agent Status
This script checks if our agents are visible on Agentverse
"""

import requests
import json
from dotenv import load_dotenv

load_dotenv()

def check_agent_on_agentverse(agent_address):
    """Check if an agent is visible on Agentverse"""
    try:
        url = f"https://agentverse.ai/v1/agents/{agent_address}"
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            agent_data = response.json()
            return True, agent_data
        else:
            return False, f"HTTP {response.status_code}: {response.text}"
            
    except Exception as e:
        return False, str(e)

def main():
    """Check all agents on Agentverse"""
    print("🔍 Checking Agent Status on Agentverse")
    print("=" * 50)
    
    # Get agent addresses
    try:
        from storage_agent import storage_agent
        from test import analysis_agent
        from nutrition_analysis_agent import analysis_agent as nutrition_agent
        
        agents = [
            ("Storage Agent", storage_agent.address),
            ("Analysis Agent", analysis_agent.address),
            ("Nutrition Analysis Agent", nutrition_agent.address)
        ]
        
        print("📋 Checking agent visibility...")
        
        for name, address in agents:
            print(f"\n🔍 Checking {name}...")
            print(f"   Address: {address}")
            print(f"   URL: https://agentverse.ai/agents/{address}")
            
            is_visible, result = check_agent_on_agentverse(address)
            
            if is_visible:
                print(f"   ✅ {name} is visible on Agentverse!")
                if isinstance(result, dict):
                    print(f"   📊 Status: {result.get('status', 'unknown')}")
                    print(f"   📝 Name: {result.get('name', 'unknown')}")
            else:
                print(f"   ❌ {name} not found on Agentverse")
                print(f"   📝 Error: {result}")
        
        print("\n📋 Summary:")
        print("If agents show as 'not found', they may need to be:")
        print("1. Running continuously (keep the agents running)")
        print("2. Properly registered with Agentverse")
        print("3. Have sufficient funding")
        
        print("\n🔗 Manual Check:")
        print("Visit https://agentverse.ai and search for:")
        print("- storage_agent")
        print("- eating_support_agent")
        print("- nutrition_analysis_agent")
        
    except Exception as e:
        print(f"❌ Error checking agents: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
