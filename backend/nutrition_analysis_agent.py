# nutrition_analysis_agent.py
from uagents import Agent, Context, Protocol, Model
from uagents.setup import fund_agent_if_low
from supabase import create_client
from test import analyze_food_with_gemini, HARDCODED_DEPTH_DATA
import requests
from PIL import Image
import io
import asyncio
import time
import os
from dotenv import load_dotenv
from typing import List, Optional

load_dotenv()

# Initialize Supabase
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

# Message Models
class AnalysisRequest(Model):
    patient_id: str
    date_range_start: Optional[str] = None
    date_range_end: Optional[str] = None
    analysis_type: str = "comprehensive"  # "comprehensive", "eating_patterns", "nutritional"

class AnalysisResult(Model):
    patient_id: str
    total_images_analyzed: int
    eating_patterns: dict
    nutritional_summary: dict
    recommendations: List[str]
    confidence_score: float
    analysis_timestamp: int

# Create Analysis Agent
analysis_agent = Agent(
    name="nutrition_analysis_agent",
    seed="nutrition_analysis_seed_phrase",
    port=8003,
    endpoint=["http://0.0.0.0:8003/submit"],
    agentverse="https://agentverse.ai",  # Connect to Agentverse
    mailbox=True
)

fund_agent_if_low(analysis_agent.wallet.address())

# Chat Protocol
analysis_protocol = Protocol(name="NutritionAnalysisChat")

@analysis_protocol.on_message(model=AnalysisRequest, replies={AnalysisResult})
async def handle_analysis_request(ctx: Context, sender: str, msg: AnalysisRequest):
    ctx.logger.info(f"📊 Analysis request from {sender} for patient {msg.patient_id}")
    
    try:
        # Query images from Supabase
        query = supabase.table('meal_images').select('*')
        
        if msg.date_range_start:
            query = query.gte('uploaded_at', int(time.mktime(time.strptime(msg.date_range_start, "%Y-%m-%d"))))
        if msg.date_range_end:
            query = query.lte('uploaded_at', int(time.mktime(time.strptime(msg.date_range_end, "%Y-%m-%d"))))
        
        response = query.execute()
        images = response.data
        
        if not images:
            await ctx.send(sender, AnalysisResult(
                patient_id=msg.patient_id,
                total_images_analyzed=0,
                eating_patterns={},
                nutritional_summary={},
                recommendations=["No images found for analysis"],
                confidence_score=0.0,
                analysis_timestamp=int(time.time())
            ))
            return
        
        ctx.logger.info(f"📸 Analyzing {len(images)} images")
        
        # Analyze all images
        analyses = []
        valid_images = 0
        for image_record in images:
            ctx.logger.info(f"Processing image {valid_images + 1}/{len(images)}")
            analysis = await analyze_single_image(image_record, ctx)
            if analysis:
                analyses.append(analysis)
                valid_images += 1
            else:
                ctx.logger.warning(f"Skipped invalid image: {image_record.get('url', 'unknown')}")
        
        ctx.logger.info(f"Successfully analyzed {valid_images}/{len(images)} images")
        
        # Generate comprehensive report
        report = generate_comprehensive_report(analyses, msg.patient_id)
        
        await ctx.send(sender, report)
        
    except Exception as e:
        ctx.logger.error(f"❌ Analysis failed: {e}")
        await ctx.send(sender, AnalysisResult(
            patient_id=msg.patient_id,
            total_images_analyzed=0,
            eating_patterns={},
            nutritional_summary={},
            recommendations=[f"Analysis failed: {str(e)}"],
            confidence_score=0.0,
            analysis_timestamp=int(time.time())
        ))

analysis_agent.include(analysis_protocol)

# REST Endpoint for Frontend
@analysis_agent.on_rest_post("/analyze", AnalysisRequest, AnalysisResult)
async def analyze_patient_data(ctx: Context, req: AnalysisRequest) -> AnalysisResult:
    """REST endpoint for frontend web app"""
    ctx.logger.info(f"📊 REST analysis request for patient {req.patient_id}")
    
    try:
        # Query images from Supabase
        query = supabase.table('meal_images').select('*')
        
        if req.date_range_start:
            query = query.gte('uploaded_at', int(time.mktime(time.strptime(req.date_range_start, "%Y-%m-%d"))))
        if req.date_range_end:
            query = query.lte('uploaded_at', int(time.mktime(time.strptime(req.date_range_end, "%Y-%m-%d"))))
        
        response = query.execute()
        images = response.data
        
        if not images:
            return AnalysisResult(
                patient_id=req.patient_id,
                total_images_analyzed=0,
                eating_patterns={},
                nutritional_summary={},
                recommendations=["No images found for analysis"],
                confidence_score=0.0,
                analysis_timestamp=int(time.time())
            )
        
        # Analyze all images
        analyses = []
        for image_record in images:
            analysis = await analyze_single_image(image_record, ctx)
            if analysis:
                analyses.append(analysis)
        
        # Generate comprehensive report
        report = generate_comprehensive_report(analyses, req.patient_id)
        return report
        
    except Exception as e:
        ctx.logger.error(f"❌ Analysis failed: {e}")
        return AnalysisResult(
            patient_id=req.patient_id,
            total_images_analyzed=0,
            eating_patterns={},
            nutritional_summary={},
            recommendations=[f"Analysis failed: {str(e)}"],
            confidence_score=0.0,
            analysis_timestamp=int(time.time())
        )

async def analyze_single_image(image_record, ctx):
    """Analyze a single image"""
    try:
        # Download image
        ctx.logger.info(f"Downloading image: {image_record['url']}")
        response = requests.get(image_record['url'], timeout=30)
        response.raise_for_status()
        
        # Check if response is valid
        if response.status_code != 200:
            ctx.logger.error(f"Failed to download image: HTTP {response.status_code}")
            return None
        
        # Check content type
        content_type = response.headers.get('content-type', '')
        ctx.logger.info(f"Content type: {content_type}")
        
        # Try to open image with error handling
        try:
            image = Image.open(io.BytesIO(response.content))
            # Convert PNG to RGB if needed (PNG might be RGBA)
            if image.mode == 'RGBA':
                image = image.convert('RGB')
            ctx.logger.info(f"Successfully loaded image: {image.size}, format: {image.format}, mode: {image.mode}")
        except Exception as img_error:
            ctx.logger.error(f"Failed to open image: {img_error}")
            return None
        
        # Create mock request
        class MockCaptureRequest:
            def __init__(self, session_id, image_url, timestamp):
                self.session_id = session_id
                self.user_id = "nutrition_analysis"
                self.image_url = image_url
                self.timestamp = timestamp
        
        mock_request = MockCaptureRequest(
            image_record['session_id'],
            image_record['url'],
            image_record['uploaded_at']
        )
        
        # Analyze with Gemini
        analysis = await analyze_food_with_gemini(mock_request, image, HARDCODED_DEPTH_DATA, ctx)
        
        return {
            'timestamp': image_record['uploaded_at'],
            'session_id': image_record['session_id'],
            'analysis': analysis
        }
        
    except Exception as e:
        ctx.logger.error(f"❌ Failed to analyze image: {e}")
        return None

def generate_comprehensive_report(analyses, patient_id):
    """Generate comprehensive nutrition and eating pattern report"""
    
    if not analyses:
        return AnalysisResult(
            patient_id=patient_id,
            total_images_analyzed=0,
            eating_patterns={},
            nutritional_summary={},
            recommendations=["No successful analyses"],
            confidence_score=0.0,
            analysis_timestamp=int(time.time())
        )
    
    # Group analyses by meal sessions (within 1 hour = same meal)
    meal_sessions = group_analyses_by_meal_session(analyses)
    
    # Analyze eating patterns based on meal sessions
    session_timestamps = [session['timestamp'] for session in meal_sessions]
    session_timestamps.sort()
    
    # Calculate time intervals between meal sessions
    intervals = []
    for i in range(1, len(session_timestamps)):
        interval_hours = (session_timestamps[i] - session_timestamps[i-1]) / 3600
        intervals.append(interval_hours)
    
    avg_interval = sum(intervals) / len(intervals) if intervals else 0
    
    # Analyze food consumption patterns per meal session
    total_consumed_per_session = []
    total_calories_per_session = []
    all_foods = []
    
    for session in meal_sessions:
        # Sum up consumption from all images in this meal session
        session_consumed = sum(analysis['analysis'].consumed_since_last for analysis in session['analyses'])
        session_calories = sum(analysis['analysis'].estimated_calories for analysis in session['analyses'])
        
        total_consumed_per_session.append(session_consumed)
        total_calories_per_session.append(session_calories)
        
        # Collect all food items from this session
        for analysis in session['analyses']:
            for food in analysis['analysis'].food_items:
                all_foods.append(food.name)
    
    avg_consumed_per_session = sum(total_consumed_per_session) / len(total_consumed_per_session) if total_consumed_per_session else 0
    total_calories = sum(total_calories_per_session)
    
    # Generate recommendations based on meal sessions
    recommendations = []
    
    if avg_interval < 2:
        recommendations.append("⚠️ Eating too frequently - consider spacing meals 3-4 hours apart")
    elif avg_interval > 6:
        recommendations.append("⚠️ Long gaps between meals - consider more regular eating schedule")
    else:
        recommendations.append("✅ Good meal timing - regular eating pattern detected")
    
    if avg_consumed_per_session < 20:
        recommendations.append("⚠️ Low food consumption per meal - consider increasing portion sizes")
    elif avg_consumed_per_session > 80:
        recommendations.append("⚠️ High food consumption per meal - consider portion control")
    else:
        recommendations.append("✅ Moderate food consumption per meal - good portion control")
    
    # Nutritional recommendations
    food_categories = {}
    for food in all_foods:
        # Simple categorization
        if any(word in food.lower() for word in ['vegetable', 'salad', 'broccoli', 'carrot']):
            food_categories['vegetables'] = food_categories.get('vegetables', 0) + 1
        elif any(word in food.lower() for word in ['meat', 'chicken', 'beef', 'fish']):
            food_categories['protein'] = food_categories.get('protein', 0) + 1
        elif any(word in food.lower() for word in ['bread', 'pasta', 'rice', 'potato']):
            food_categories['carbs'] = food_categories.get('carbs', 0) + 1
    
    if food_categories.get('vegetables', 0) < len(meal_sessions) * 0.3:
        recommendations.append("🥬 Consider increasing vegetable intake")
    
    return AnalysisResult(
        patient_id=patient_id,
        total_images_analyzed=len(analyses),
        eating_patterns={
            "total_meal_sessions": len(meal_sessions),
            "total_images": len(analyses),
            "avg_interval_hours": round(avg_interval, 2),
            "regular_eating": avg_interval >= 2 and avg_interval <= 6,
            "avg_consumption_per_session": round(avg_consumed_per_session, 2),
            "meal_grouping_note": "Images within 1 hour grouped as same meal"
        },
        nutritional_summary={
            "total_calories": total_calories,
            "avg_calories_per_session": round(total_calories / len(meal_sessions), 2) if meal_sessions else 0,
            "food_categories": food_categories,
            "most_common_foods": list(set(all_foods))[:5]
        },
        recommendations=recommendations,
        confidence_score=0.85,
        analysis_timestamp=int(time.time())
    )

def group_analyses_by_meal_session(analyses):
    """Group analyses by meal sessions (within 1 hour = same meal)"""
    if not analyses:
        return []
    
    # Sort by timestamp
    sorted_analyses = sorted(analyses, key=lambda x: x['timestamp'])
    
    meal_sessions = []
    current_session = {
        'timestamp': sorted_analyses[0]['timestamp'],
        'analyses': [sorted_analyses[0]]
    }
    
    for analysis in sorted_analyses[1:]:
        time_diff_hours = (analysis['timestamp'] - current_session['timestamp']) / 3600
        
        if time_diff_hours <= 1.0:  # Within 1 hour = same meal
            current_session['analyses'].append(analysis)
        else:  # New meal session
            meal_sessions.append(current_session)
            current_session = {
                'timestamp': analysis['timestamp'],
                'analyses': [analysis]
            }
    
    # Add the last session
    meal_sessions.append(current_session)
    
    return meal_sessions

if __name__ == "__main__":
    print("🚀 Starting Nutrition Analysis Agent...")
    print(f"📍 Agent address: {analysis_agent.address}")
    print(f"🌐 HTTP endpoint: http://localhost:8003")
    analysis_agent.run()