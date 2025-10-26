# query_uploads.py
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

def query_recent_uploads(limit=10):
    """Query recent uploads from database"""
    print("📊 Querying recent uploads...")
    
    # Query meal images only
    meal_images = supabase.table('meal_images')\
        .select('*')\
        .order('uploaded_at', desc=True)\
        .limit(limit)\
        .execute()
    
    print(f"\n🖼️ Recent Meal Images ({len(meal_images.data)}):")
    for img in meal_images.data:
        print(f"  Session: {img['session_id']}")
        print(f"  Frame: {img['frame_id']}")
        print(f"  Uploaded: {img['uploaded_at']}")
        print(f"  URL: {img['url']}")
        print(f"  Created: {img['created_at']}")
        print()

def query_by_session(session_id):
    """Query uploads by session ID"""
    print(f"🔍 Querying uploads for session: {session_id}")
    
    meal_images = supabase.table('meal_images')\
        .select('*')\
        .eq('session_id', session_id)\
        .order('uploaded_at', desc=True)\
        .execute()
    
    print(f"📸 Images: {len(meal_images.data)}")
    
    return meal_images.data

if __name__ == "__main__":
    # Query recent uploads
    query_recent_uploads(5)
    
    # Query specific session (replace with actual session ID)
    # query_by_session("test_session_1234567890")