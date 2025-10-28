# setup_and_run.py
import subprocess
import time
import os
import sys

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"\n🚀 {description}")
    print(f"Command: {command}")
    
    try:
        # Run command in background
        process = subprocess.Popen(command, shell=True)
        return process
    except Exception as e:
        print(f"❌ Error running {description}: {e}")
        return None

def check_dependencies():
    """Check if required packages are installed"""
    print("🔍 Checking dependencies...")
    
    # Map package names to their import names
    package_imports = {
        'uagents': 'uagents',
        'supabase': 'supabase', 
        'google-generativeai': 'google.generativeai',
        'Pillow': 'PIL',
        'requests': 'requests',
        'python-dotenv': 'dotenv',
        'pydantic': 'pydantic',
        'Flask': 'flask'
    }
    
    missing_packages = []
    for package_name, import_name in package_imports.items():
        try:
            __import__(import_name)
            print(f"✅ {package_name}")
        except ImportError:
            missing_packages.append(package_name)
            print(f"❌ {package_name}")
    
    if missing_packages:
        print(f"\n⚠️ Missing packages: {', '.join(missing_packages)}")
        print("Run: pip install -r requirements.txt")
        return False
    
    return True

def main():
    """Main setup and run function"""
    print("🏥 Patient Nutrition Analysis System Setup")
    print("=" * 50)
    
    # Check dependencies
    if not check_dependencies():
        print("\n❌ Please install missing dependencies first")
        return
    
    
    print("\n✅ All checks passed!")
    
    # Ask user what to do
    print("\nWhat would you like to do?")
    print("1. Upload assets folder to Supabase (30s intervals)")
    print("2. Run everything (upload + agents + frontend)")
    
    choice = input("\nEnter choice (1-2): ").strip()
    
    processes = []
    
    if choice == "1":
        print("\n📤 Starting batch upload...")
        process = run_command("python upload_assets_folder.py", "Batch Upload")
        if process:
            processes.append(("Batch Upload", process))
    
    elif choice == "2":
        print("\n🚀 Starting complete system...")
        
        # Start Analysis Agent
        process1 = run_command("python nutrition_analysis_agent.py", "Analysis Agent")
        if process1:
            processes.append(("Analysis Agent", process1))
        
        # Wait a bit for agent to start
        time.sleep(3)
        
        # Start Frontend
        process2 = run_command("python nutrition_frontend.py", "Frontend Web App")
        if process2:
            processes.append(("Frontend", process2))
    
    else:
        print("❌ Invalid choice")
        return
    
    # Monitor processes
    if processes:
        print(f"\n📊 Running {len(processes)} process(es)...")
        print("\nPress Ctrl+C to stop all processes")
        
        try:
            while True:
                time.sleep(5)
                # Check if processes are still running
                for name, process in processes:
                    if process.poll() is not None:
                        print(f"⚠️ {name} has stopped")
        except KeyboardInterrupt:
            print("\n🛑 Stopping all processes...")
            for name, process in processes:
                try:
                    process.terminate()
                    print(f"✅ Stopped {name}")
                except:
                    print(f"❌ Could not stop {name}")
    
    print("\n👋 Setup complete!")

if __name__ == "__main__":
    main()
