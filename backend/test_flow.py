# Quick test script
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

# Test table access
try:
    result = supabase.table('meal_images').select('*').limit(1).execute()
    print("✅ Tables exist and accessible!")
except Exception as e:
    print(f"❌ Error: {e}")
    print("You need to create the tables first!")