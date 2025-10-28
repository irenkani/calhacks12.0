# analysis_agent.py (renamed from test.py)
from uagents import Agent, Context, Protocol, Model
from uagents.setup import fund_agent_if_low
import google.generativeai as genai
from pydantic import BaseModel, Field
from typing import List, Optional
import requests
from PIL import Image
import io
import json
import re
import time
import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("GEMINI_API_KEY")
# Configure Gemini
genai.configure(api_key=SECRET_KEY)
model = genai.GenerativeModel('gemini-2.0-flash-exp')

# Create agent
analysis_agent = Agent(
    name="eating_support_agent",
    seed="eating_disorder_support_seed_phrase",
    port=8000,
    endpoint=["http://0.0.0.0:8000/submit"],
    agentverse="https://agentverse.ai",  # Connect to Agentverse
    mailbox=True
)

fund_agent_if_low(analysis_agent.wallet.address())

# === Pydantic Models (KEEP ALL FROM test.py) ===
class FoodItem(BaseModel):
    name: str
    category: Optional[str] = None

class AnalysisResult(BaseModel):
    food_items: List[FoodItem]
    remaining_percent: float
    consumed_since_last: float
    estimated_calories: int
    confidence: float

# MODIFIED: Use URLs instead of base64
class CaptureRequest(Model):
    session_id: str
    user_id: str
    image_url: str  # JPEG URL only
    timestamp: int

# Session storage (KEEP FROM test.py)
sessions = {}

# Hardcoded depth data
HARDCODED_DEPTH_DATA = {
    "width": 64,
    "height": 64,
    "values": [1.2, 1.5, 1.3, 1.8, 2.1] * 100  # Repeat pattern
}

# === Chat Protocol ONLY (NO REST ENDPOINTS) ===
meal_protocol = Protocol(name="MealTrackingChat")

@meal_protocol.on_message(model=CaptureRequest, replies={AnalysisResult})
async def handle_meal_analysis(ctx: Context, sender: str, msg: CaptureRequest):
    """Main handler - receives from Storage Agent, returns analysis"""
    ctx.logger.info(f"📨 Chat: Analysis request from {sender}")
    
    try:
        # Download JPEG from URL
        image = download_image(msg.image_url)
        
        # Use hardcoded depth data
        depth_data = HARDCODED_DEPTH_DATA
        
        # Analyze with Gemini (REUSE FROM test.py)
        analysis = await analyze_food_with_gemini(msg, image, depth_data, ctx)
        
        # Update session (REUSE FROM test.py)
        session = sessions.get(msg.session_id, {
            'total_consumed': 0,
            'captures': 0,
            'start_time': msg.timestamp
        })
        
        session['total_consumed'] += analysis.consumed_since_last
        session['captures'] += 1
        sessions[msg.session_id] = session
        
        # Return AnalysisResult (NO DogState as per plan)
        await ctx.send(sender, analysis)
        
    except Exception as e:
        ctx.logger.error(f"❌ Error: {str(e)}")
        # Send safe fallback response
        await ctx.send(sender, AnalysisResult(
            food_items=[FoodItem(name="analysis_failed", category="error")],
            remaining_percent=100.0,
            consumed_since_last=0.0,
            estimated_calories=0,
            confidence=0.0
        ))

analysis_agent.include(meal_protocol)

# === Helper Functions (NEW) ===
def download_image(image_url: str) -> Image.Image:
    """Download image from URL"""
    response = requests.get(image_url)
    image = Image.open(io.BytesIO(response.content))
    # Convert PNG to RGB if needed (PNG might be RGBA)
    if image.mode == 'RGBA':
        image = image.convert('RGB')
    return image

def download_depth(depth_url: str) -> dict:
    """Download depth data from URL"""
    response = requests.get(depth_url)
    return response.json()

# === REUSE ALL FUNCTIONS FROM test.py ===
async def analyze_food_with_gemini(msg: CaptureRequest, image: Image.Image, depth_data: dict, ctx: Context) -> AnalysisResult:
    """Analyze food using Gemini Vision API (MODIFIED FROM test.py)"""
    
    # Get previous state
    prev_state = sessions.get(msg.session_id, {})
    
    # Build prompt (SAME AS test.py)
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
        
        # Parse JSON response (SAME AS test.py)
        json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
        if json_match:
            data = json.loads(json_match.group())
            return AnalysisResult(**data)
        
    except Exception as e:
        ctx.logger.error(f"Gemini analysis failed: {str(e)}")
    
    # Fallback (SAME AS test.py)
    return AnalysisResult(
        food_items=[FoodItem(name="food", category="unknown")],
        remaining_percent=100.0,
        consumed_since_last=0.0,
        estimated_calories=0,
        confidence=0.0
    )

# KEEP THESE FUNCTIONS FOR POTENTIAL FUTURE USE IN SPECTACLES
def calculate_dog_state(progress: float, recent_consumption: float) -> dict:
    """Gentle, positive-only progression (KEEP FROM test.py)"""
    if progress >= 80:
        return {
            'happiness': 10,
            'activity': 10,
            'visual': 'excited'
        }
    elif progress >= 60:
        return {
            'happiness': 8,
            'activity': 8,
            'visual': 'playing'
        }
    elif progress >= 40:
        return {
            'happiness': 7,
            'activity': 6,
            'visual': 'walking'
        }
    elif progress >= 20:
        return {
            'happiness': 6,
            'activity': 5,
            'visual': 'walking'
        }
    else:
        return {
            'happiness': 5,
            'activity': 4,
            'visual': 'resting'
        }

def generate_message(progress: float, foods: List[FoodItem]) -> str:
    """Generate encouraging, non-judgmental messages (KEEP FROM test.py)"""
    import random
    
    if progress >= 80:
        return random.choice([
            "Your pup is so energetic! You're doing amazing! 🐕✨",
            "Look how happy your dog is! Great job nourishing yourself! 🌟",
            "Your dog is bouncing with joy! Wonderful progress! 💫"
        ])
    elif progress >= 50:
        return random.choice([
            "Your pup is getting more playful! Keep going at your pace. 💛",
            "Nice progress! Your dog loves spending time with you. 🐾",
            "Your dog's tail is wagging! You're doing great! 🤗"
        ])
    elif progress >= 20:
        return random.choice([
            "Every bite counts! Your pup believes in you. 💕",
            "Take your time - your dog is here with you. 🌸",
            "Your pup is by your side. You've got this! 💙"
        ])
    else:
        return random.choice([
            "Your pup is here, supporting you. Take it one bite at a time. 🤗",
            "No pressure - your dog loves you no matter what. 💕",
            "Your pup is resting peacefully with you. You're safe. 🌟"
        ])

# Export agent address for storage_agent.py
ANALYSIS_AGENT_ADDRESS = analysis_agent.address

if __name__ == "__main__":
    print("🚀 Starting Analysis Agent...")
    print(f"📍 Agent address: {analysis_agent.address}")
    print(f"🌐 HTTP endpoint: http://localhost:8000")
    print("Copy this address to register on Agentverse!")
    analysis_agent.run()