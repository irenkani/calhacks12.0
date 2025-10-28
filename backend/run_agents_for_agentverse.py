#!/usr/bin/env python3
"""
Simple Agentverse Deployment - Run Agents
This script runs the agents and lets them register on Agentverse automatically
"""

import os
import sys
import time
import subprocess
import signal
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def check_environment():
    """Check if all required environment variables are set"""
    required_vars = ['SUPABASE_URL', 'SUPABASE_KEY', 'GEMINI_API_KEY']
    missing_vars = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"❌ Missing environment variables: {', '.join(missing_vars)}")
        print("Please set them in your .env file")
        return False
    
    print("✅ Environment variables configured")
    return True

def run_agent(script_name, agent_name):
    """Run a single agent script"""
    print(f"\n🚀 Starting {agent_name}...")
    
    try:
        process = subprocess.Popen(
            [sys.executable, script_name],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # Give it a moment to start
        time.sleep(2)
        
        if process.poll() is None:
            print(f"✅ {agent_name} started successfully (PID: {process.pid})")
            return process
        else:
            stdout, stderr = process.communicate()
            print(f"❌ {agent_name} failed to start")
            print(f"STDOUT: {stdout}")
            print(f"STDERR: {stderr}")
            return None
            
    except Exception as e:
        print(f"❌ Failed to start {agent_name}: {e}")
        return None

def main():
    """Main deployment function"""
    print("🚀 Simple Agentverse Deployment")
    print("=" * 50)
    
    if not check_environment():
        return
    
    print("\n📋 Starting agents for Agentverse registration...")
    print("⚠️  Agents will register themselves on Agentverse when they start")
    print("⚠️  Keep this script running to keep agents alive")
    
    processes = []
    
    try:
        # Start all agents
        agents = [
            ("storage_agent.py", "Storage Agent"),
            ("test.py", "Analysis Agent"), 
            ("nutrition_analysis_agent.py", "Nutrition Analysis Agent")
        ]
        
        for script, name in agents:
            process = run_agent(script, name)
            if process:
                processes.append((process, name))
            time.sleep(3)  # Give each agent time to start
        
        if processes:
            print(f"\n🎉 {len(processes)} agents started successfully!")
            print("\n📋 Agent Addresses:")
            
            # Try to get addresses from the running processes
            for process, name in processes:
                print(f"   {name}: Check Agentverse for address")
            
            print("\n🔗 Check Agentverse at: https://agentverse.ai")
            print("📝 Look for agents with names:")
            print("   - storage_agent")
            print("   - eating_support_agent") 
            print("   - nutrition_analysis_agent")
            
            print("\n⚠️  Keep this script running to keep agents alive")
            print("Press Ctrl+C to stop all agents")
            
            # Keep running until interrupted
            try:
                while True:
                    time.sleep(1)
                    # Check if any process died
                    for process, name in processes[:]:
                        if process.poll() is not None:
                            print(f"❌ {name} stopped unexpectedly")
                            processes.remove((process, name))
            except KeyboardInterrupt:
                print("\n🛑 Stopping all agents...")
                
        else:
            print("❌ No agents started successfully")
            
    except Exception as e:
        print(f"❌ Deployment failed: {e}")
        
    finally:
        # Clean up processes
        for process, name in processes:
            try:
                process.terminate()
                process.wait(timeout=5)
                print(f"✅ {name} stopped")
            except:
                try:
                    process.kill()
                    print(f"🔪 {name} force killed")
                except:
                    pass

if __name__ == "__main__":
    main()
