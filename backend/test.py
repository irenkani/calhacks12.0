# eating_support_agent.py
from uagents import Agent, Context, Protocol
from uagents.setup import fund_agent_if_low
import google.generativeai as genai
from pydantic import BaseModel, Field
from typing import List, Optional
import base64
from PIL import Image
import io
import json
import re

# Configure Gemini
genai.configure(api_key="AIzaSyA-k-w28qfWo6IhoDa2uABSGzlwrM2L3Po")
model = genai.GenerativeModel('gemini-2.0-flash-exp')

# Create agent
eating_agent = Agent(
    name="eating_support_agent",
    port=8000,
    seed="eating_disorder_support_seed_phrase",
    endpoint=["http://0.0.0.0:8000/submit"],
)

fund_agent_if_low(eating_agent.wallet.address())

# === Pydantic Models ===
class DepthCache(BaseModel):
    width: int
    height: int
    depth_values: List[float]

class CaptureRequest(BaseModel):
    """From Snap Spectacles"""
    session_id: str
    user_id: str
    image_base64: str
    depth_cache: DepthCache
    timestamp: int

class FoodItem(BaseModel):
    name: str
    category: Optional[str] = None

class AnalysisResult(BaseModel):
    food_items: List[FoodItem]
    remaining_percent: float
    consumed_since_last: float
    estimated_calories: int
    confidence: float

class DogState(BaseModel):
    """Response to Snap Spectacles"""
    happiness: int = Field(ge=1, le=10)
    activity: int = Field(ge=1, le=10)
    visual_state: str  # "excited", "playing", "walking", "resting"
    message: str
    progress: float
    celebration: bool = False

# Session storage
sessions = {}

# === HTTP Protocol for Snap Lens Studio ===
http_protocol = Protocol(name="SpectaclesProtocol")

@http_protocol.on_message(model=CaptureRequest, replies={DogState})
async def handle_capture(ctx: Context, sender: str, msg: CaptureRequest):
    """
    Main handler - receives from Spectacles, returns dog state
    """
    ctx.logger.info(f"📸 Received capture from session: {msg.session_id}")
    
    try:
        # 1. Decode and analyze image with Gemini
        analysis = await analyze_food_with_gemini(msg, ctx)
        
        # 2. Update session state
        session = sessions.get(msg.session_id, {
            'total_consumed': 0,
            'captures': 0,
            'start_time': msg.timestamp
        })
        
        session['total_consumed'] += analysis.consumed_since_last
        session['captures'] += 1
        sessions[msg.session_id] = session
        
        # 3. Calculate dog state based on progress
        progress = min(100, session['total_consumed'])
        dog_state = calculate_dog_state(progress, analysis.consumed_since_last)
        
        # 4. Generate encouragement message
        message = generate_message(progress, analysis.food_items)
        
        # 5. Create response
        response = DogState(
            happiness=dog_state['happiness'],
            activity=dog_state['activity'],
            visual_state=dog_state['visual'],
            message=message,
            progress=progress,
            celebration=(progress >= 80 and session['captures'] > 3)
        )
        
        ctx.logger.info(f"✅ Sending response - Progress: {progress}%, Happiness: {response.happiness}")
        await ctx.send(sender, response)
        
    except Exception as e:
        ctx.logger.error(f"❌ Error: {str(e)}")
        # Send safe fallback response
        await ctx.send(sender, DogState(
            happiness=5,
            activity=5,
            visual_state="resting",
            message="Your pup is here with you 💕",
            progress=0
        ))

async def analyze_food_with_gemini(msg: CaptureRequest, ctx: Context) -> AnalysisResult:
    """Analyze food using Gemini Vision API"""
    
    # Get previous state
    prev_state = sessions.get(msg.session_id, {})
    
    # Decode image
    image_bytes = base64.b64decode(msg.image_base64)
    image = Image.open(io.BytesIO(image_bytes))
    
    # Build prompt
    prompt = f"""
    Analyze this meal plate with depth information.
    
    Previous total consumed: {prev_state.get('total_consumed', 0)}%
    Capture number: {prev_state.get('captures', 0) + 1}
    
    Depth info: {msg.depth_cache.width}x{msg.depth_cache.height} pixels
    Sample depth values: {msg.depth_cache.depth_values[:5]}...
    
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
        
        # Parse JSON response
        json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
        if json_match:
            data = json.loads(json_match.group())
            return AnalysisResult(**data)
        
    except Exception as e:
        ctx.logger.error(f"Gemini analysis failed: {str(e)}")
    
    # Fallback
    return AnalysisResult(
        food_items=[FoodItem(name="food", category="unknown")],
        remaining_percent=100.0,
        consumed_since_last=0.0,
        estimated_calories=0,
        confidence=0.0
    )

def calculate_dog_state(progress: float, recent_consumption: float) -> dict:
    """
    Gentle, positive-only progression
    Never punitive - only varying levels of calm to energetic
    """
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
        # Even at low progress, maintain gentle positivity
        return {
            'happiness': 5,
            'activity': 4,
            'visual': 'resting'
        }

def generate_message(progress: float, foods: List[FoodItem]) -> str:
    """Generate encouraging, non-judgmental messages"""
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

# Include the protocol in the agent
eating_agent.include(http_protocol)

# === REST Endpoint (Alternative Access Method) ===
@eating_agent.on_rest_post("/analyze", CaptureRequest, DogState)
async def rest_analyze(ctx: Context, req: CaptureRequest) -> DogState:
    """
    REST endpoint for direct HTTP calls from Spectacles
    This is simpler than using Fetch.ai messaging
    """
    ctx.logger.info(f"📡 REST request from session: {req.session_id}")
    
    # Same logic as message handler
    analysis = await analyze_food_with_gemini(req, ctx)
    
    session = sessions.get(req.session_id, {
        'total_consumed': 0,
        'captures': 0,
        'start_time': req.timestamp
    })
    
    session['total_consumed'] += analysis.consumed_since_last
    session['captures'] += 1
    sessions[req.session_id] = session
    
    progress = min(100, session['total_consumed'])
    dog_state = calculate_dog_state(progress, analysis.consumed_since_last)
    message = generate_message(progress, analysis.food_items)
    
    return DogState(
        happiness=dog_state['happiness'],
        activity=dog_state['activity'],
        visual_state=dog_state['visual'],
        message=message,
        progress=progress,
        celebration=(progress >= 80)
    )

# === Session Management Endpoints ===
@eating_agent.on_rest_get("/session/{session_id}")
async def get_session(ctx: Context, session_id: str) -> dict:
    """Get session info"""
    session = sessions.get(session_id, {})
    return {
        "session_id": session_id,
        "total_consumed": session.get('total_consumed', 0),
        "captures": session.get('captures', 0),
        "exists": session_id in sessions
    }

@eating_agent.on_rest_post("/session/{session_id}/end")
async def end_session(ctx: Context, session_id: str) -> dict:
    """End a meal session"""
    if session_id in sessions:
        session = sessions.pop(session_id)
        return {
            "success": True,
            "final_progress": session.get('total_consumed', 0),
            "total_captures": session.get('captures', 0)
        }
    return {"success": False, "error": "Session not found"}

if __name__ == "__main__":
    ctx.logger.info("🚀 Starting Eating Support Agent...")
    ctx.logger.info(f"📍 Agent address: {eating_agent.address}")
    ctx.logger.info(f"🌐 HTTP endpoint: http://localhost:8000")
    eating_agent.run()
