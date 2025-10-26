# analysis_agent.py
from uagents import Agent, Context, Protocol, Model
from uagents.setup import fund_agent_if_low
import google.generativeai as genai
from typing import List, Optional
import requests
from PIL import Image
import io
import json
import re
import time
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Gemini
SECRET_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=SECRET_KEY)
model = genai.GenerativeModel('gemini-2.0-flash-exp')

# Message Models (reuse from test.py but modified for URLs)
class CaptureRequest(Model):
    session_id: str
    user_id: str
    image_url: str  # Changed from image_base64
    depth_url: str  # Changed from depth_cache
    timestamp: int

class AnalysisResult(Model):
    food_items: list  # [{"name": "pasta", "category": "carb"}]
    remaining_percent: float
    consumed_since_last: float
    estimated_calories: int
    confidence: float

# Session storage (from test.py)
sessions = {}

# Create Analysis Agent
analysis_agent = Agent(
    name="eating_support_agent",
    seed="eating_disorder_support_seed_phrase",
    port=8000,
    endpoint=["http://0.0.0.0:8000/submit"],
    mailbox=True
)

fund_agent_if_low(analysis_agent.wallet.address())

# Chat Protocol ONLY (no REST endpoints)
meal_protocol = Protocol(name="MealTrackingChat")

@meal_protocol.on_message(model=CaptureRequest, replies={AnalysisResult})
async def handle_meal_analysis(ctx: Context, sender: str, msg: CaptureRequest):
    ctx.logger.info(f"📨 Chat: Analysis request from {sender}")
    
    try:
        # Download from URLs
        image = download_image(msg.image_url)
        depth_data = download_depth(msg.depth_url)
        
        # Analyze with Gemini (reuse from test.py)
        analysis = await analyze_food_with_gemini(msg, image, depth_data, ctx)
        
        # Update session (from test.py)
        update_session(msg.session_id, analysis)
        
        # Return AnalysisResult (NO DogState)
        await ctx.send(sender, analysis)
        
    except Exception as e:
        ctx.logger.error(f"❌ Error: {str(e)}")
        # Send safe fallback response
        await ctx.send(sender, AnalysisResult(
            food_items=[{"name": "analysis_failed", "category": "error"}],
            remaining_percent=100.0,
            consumed_since_last=0.0,
            estimated_calories=0,
            confidence=0.0
        ))

analysis_agent.include(meal_protocol)

# Helper functions
def download_image(image_url: str) -> Image.Image:
    """Download image from URL"""
    response = requests.get(image_url)
    return Image.open(io.BytesIO(response.content))

def download_depth(depth_url: str) -> dict:
    """Download depth data from URL"""
    response = requests.get(depth_url)
    return response.json()

def update_session(session_id: str, analysis: AnalysisResult):
    """Update session state (from test.py)"""
    session = sessions.get(session_id, {
        'total_consumed': 0,
        'captures': 0,
        'start_time': int(time.time())
    })
    
    session['total_consumed'] += analysis.consumed_since_last
    session['captures'] += 1
    sessions[session_id] = session

# Reuse analyze_food_with_gemini function from test.py (modified for URL input)
async def analyze_food_with_gemini(msg: CaptureRequest, image: Image.Image, depth_data: dict, ctx: Context) -> AnalysisResult:
    """Analyze food using Gemini Vision API (modified from test.py)"""
    
    # Get previous state
    prev_state = sessions.get(msg.session_id, {})
    
    # Build prompt (same as test.py)
    prompt = f"""
    Analyze this meal plate with depth information.
    
    Previous total consumed: {prev_state.get('total_consumed', 0)}%
    Capture number: {prev_state.get('captures', 0) + 1}
    
    Depth info: {depth_data['width']}x{depth_data['height']} pixels
    Sample depth values: {depth_data['values'][:5]}...
    
    Return JSON only:
    {{
        "food_items": [{{"name": "item", "category": "protein/carb/vegetable/etc"}}],
        "remaining_percent": 75.0,
        "consumed_since_last": 25.0,
        "estimated_calories": 150,
        "confidence": 0.85
    }}
    
    Use depth data to estimate 3D volume changes accurately.
    """
    
    try:
        # Call Gemini
        ctx.logger.info("🔍 Calling Gemini Vision API...")
        response = model.generate_content([prompt, image])
        
        # Parse JSON response (same as test.py)
        json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
        if json_match:
            data = json.loads(json_match.group())
            return AnalysisResult(**data)
        
    except Exception as e:
        ctx.logger.error(f"Gemini analysis failed: {str(e)}")
    
    # Fallback (same as test.py)
    return AnalysisResult(
        food_items=[{"name": "food", "category": "unknown"}],
        remaining_percent=100.0,
        consumed_since_last=0.0,
        estimated_calories=0,
        confidence=0.0
    )

# Export agent address for storage_agent.py
ANALYSIS_AGENT_ADDRESS = analysis_agent.address

if __name__ == "__main__":
    print("🚀 Starting Analysis Agent...")
    print(f"📍 Agent address: {analysis_agent.address}")
    print(f"🌐 HTTP endpoint: http://localhost:8000")
    print("Copy this address to register on Agentverse!")
    analysis_agent.run()