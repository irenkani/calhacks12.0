# storage_agent.py
from uagents import Agent, Context, Protocol, Model
from uagents.setup import fund_agent_if_low
from supabase import create_client
import base64
import json
import os
import time
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Initialize Supabase client
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Message Models
class UploadRequest(Model):
    image_base64: str
    session_id: str
    frame_id: str
    user_id: str

class AnalysisResult(Model):
    food_items: list
    remaining_percent: float
    consumed_since_last: float
    estimated_calories: int
    confidence: float

# Supabase upload functions
def upload_image_to_supabase(image_base64: str, session_id: str, frame_id: str) -> str:
    """Upload image to Supabase storage and return public URL"""
    try:
        image_bytes = base64.b64decode(image_base64)
        timestamp = int(time.time())
        
        # Detect image format and use appropriate extension
        if image_bytes.startswith(b'\x89PNG'):
            file_path = f"{session_id}/{frame_id}_{timestamp}.png"
        elif image_bytes.startswith(b'\xff\xd8\xff'):
            file_path = f"{session_id}/{frame_id}_{timestamp}.jpg"
        else:
            # Default to PNG for unknown formats
            file_path = f"{session_id}/{frame_id}_{timestamp}.png"
        
        # Upload to Supabase storage
        supabase.storage.from_('meals').upload(file_path, image_bytes)
        
        # Get public URL
        url = supabase.storage.from_('meals').get_public_url(file_path)
        
        # Also store metadata in Supabase database table
        supabase.table('meal_images').insert({
            'session_id': session_id,
            'frame_id': frame_id,
            'file_path': file_path,
            'url': url,
            'uploaded_at': timestamp,
            'created_at': 'now()'
        }).execute()
        
        return url
    except Exception as e:
        print(f"Error uploading image: {e}")
        return ""

def upload_depth_to_supabase(depth_data: dict, session_id: str, frame_id: str) -> str:
    """Upload depth data to Supabase storage and return public URL"""
    try:
        depth_json = json.dumps(depth_data).encode('utf-8')
        timestamp = int(time.time())
        file_path = f"{session_id}/{frame_id}_{timestamp}_depth.json"  # Include timestamp
        
        # Upload to Supabase storage
        supabase.storage.from_('depth-data').upload(file_path, depth_json)
        
        # Get public URL
        url = supabase.storage.from_('depth-data').get_public_url(file_path)
        
        # Store metadata in database
        supabase.table('depth_data').insert({
            'session_id': session_id,
            'frame_id': frame_id,
            'file_path': file_path,
            'url': url,
            'uploaded_at': timestamp,
            'created_at': 'now()'
        }).execute()
        
        return url
    except Exception as e:
        print(f"Error uploading depth data: {e}")
        return ""

# Create Storage Agent
storage_agent = Agent(
    name="storage_agent",
    seed="storage_agent_seed_phrase",
    port=8001,
    endpoint=["http://0.0.0.0:8001/submit"],
    agentverse="https://agentverse.ai",  # Connect to Agentverse
    mailbox=True
)

fund_agent_if_low(storage_agent.wallet.address())

# Chat Protocol ONLY (no REST endpoints)
storage_protocol = Protocol(name="StorageChat")

@storage_protocol.on_message(model=UploadRequest, replies={AnalysisResult})
async def handle_upload_and_analyze(ctx: Context, sender: str, msg: UploadRequest):
    ctx.logger.info(f"📨 Chat: Upload and analyze from {sender}")
    
    # Upload only JPEG to Supabase
    image_url = upload_image_to_supabase(msg.image_base64, msg.session_id, msg.frame_id)
    
    if not image_url:
        await ctx.send(sender, AnalysisResult(
            food_items=[{"name": "upload_failed", "category": "error"}],
            remaining_percent=100.0,
            consumed_since_last=0.0,
            estimated_calories=0,
            confidence=0.0
        ))
        return
    
    # Send to Analysis Agent with hardcoded depth data
    from test import CaptureRequest, ANALYSIS_AGENT_ADDRESS
    
    capture_req = CaptureRequest(
        session_id=msg.session_id,
        user_id=msg.user_id,
        image_url=image_url,
        timestamp=int(time.time())
    )
    
    # Wait for Analysis Agent response
    analysis_result = await ctx.send(ANALYSIS_AGENT_ADDRESS, capture_req)
    
    # Forward to original sender
    await ctx.send(sender, analysis_result)

storage_agent.include(storage_protocol)

if __name__ == "__main__":
    print("🚀 Starting Storage Agent...")
    print(f"📍 Agent address: {storage_agent.address}")
    print(f"🌐 HTTP endpoint: http://localhost:8001")
    print("Copy this address to register on Agentverse!")
    storage_agent.run()