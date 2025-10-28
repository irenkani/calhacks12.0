#!/usr/bin/env python3
"""
Eating Disorder Support Agent - Proper Chat Protocol Implementation
Based on Fetch.ai Innovation Lab documentation
"""

import os
import json
import base64
import time
from datetime import datetime, timezone
from uuid import uuid4
from typing import Any

import requests
from PIL import Image
import io
from supabase import create_client
from dotenv import load_dotenv

from uagents import Agent, Context, Protocol
from uagents_core.storage import ExternalStorage

# Import chat protocol components
from uagents_core.contrib.protocols.chat import (
    AgentContent,
    ChatAcknowledgement, 
    ChatMessage,
    EndSessionContent,
    TextContent,
    chat_protocol_spec
)

# Load environment variables
load_dotenv()

# Initialize Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY, GEMINI_API_KEY]):
    raise ValueError("Missing required environment variables: SUPABASE_URL, SUPABASE_KEY, GEMINI_API_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Configure Gemini
import google.generativeai as genai
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.0-flash-exp')

# Create agent
agent = Agent(
    name="eating_disorder_support_agent",
    seed="eating_disorder_support_seed_phrase"
)

# Storage configuration
STORAGE_URL = os.getenv("AGENTVERSE_URL", "https://agentverse.ai") + "/v1/storage"

# Create the chat protocol
chat_proto = Protocol(spec=chat_protocol_spec)

def create_text_chat(text: str) -> ChatMessage:
    """Create a text chat message"""
    return ChatMessage(
        timestamp=datetime.now(timezone.utc),
        msg_id=uuid4(),
        content=[TextContent(text=text)],
    )

# Removed metadata function - not needed for basic chat protocol

def upload_image_to_supabase(image_base64: str, session_id: str, frame_id: str) -> str:
    """Upload image to Supabase storage"""
    try:
        image_bytes = base64.b64decode(image_base64)
        timestamp = int(time.time())
        
        # Detect image format
        if image_bytes.startswith(b'\x89PNG'):
            file_path = f"{session_id}/{frame_id}_{timestamp}.png"
        elif image_bytes.startswith(b'\xff\xd8\xff'):
            file_path = f"{session_id}/{frame_id}_{timestamp}.jpg"
        else:
            file_path = f"{session_id}/{frame_id}_{timestamp}.png"
        
        # Upload to Supabase
        supabase.storage.from_('meals').upload(file_path, image_bytes)
        url = supabase.storage.from_('meals').get_public_url(file_path)
        
        # Store metadata
        supabase.table('meal_images').insert({
            'session_id': session_id,
            'frame_id': frame_id,
            'file_path': file_path,
            'url': url,
            'uploaded_at': timestamp
        }).execute()
        
        return url
    except Exception as e:
        print(f"Error uploading image: {e}")
        return None

def analyze_food_with_gemini(image_data: bytes, user_query: str = "Analyze this meal") -> str:
    """Analyze food using Gemini Vision API"""
    try:
        # Convert bytes to PIL Image
        image = Image.open(io.BytesIO(image_data))
        
        # Convert PNG to RGB if needed
        if image.mode == 'RGBA':
            image = image.convert('RGB')
        
        # Analyze with Gemini
        prompt = f"""
        Analyze this meal image and provide:
        1. List of food items visible
        2. Estimated portion sizes
        3. Nutritional assessment
        4. Eating pattern insights
        
        User query: {user_query}
        
        Provide a helpful, supportive response for someone tracking their eating habits.
        """
        
        response = model.generate_content([prompt, image])
        return response.text
        
    except Exception as e:
        return f"Error analyzing image: {str(e)}"

# Chat protocol message handler
@chat_proto.on_message(ChatMessage)
async def handle_message(ctx: Context, sender: str, msg: ChatMessage):
    ctx.logger.info(f"Got a message from {sender}")
    
    # Send acknowledgement
    await ctx.send(
        sender,
        ChatAcknowledgement(
            acknowledged_msg_id=msg.msg_id, 
            timestamp=datetime.now(timezone.utc)
        ),
    )

    prompt_content = []
    user_text = ""
    
    for item in msg.content:
        if isinstance(item, TextContent):
            ctx.logger.info(f"Got text content from {sender}: {item.text}")
            user_text = item.text
            prompt_content.append({"text": item.text, "type": "text"})
        elif isinstance(item, AgentContent):
            ctx.logger.info(f"Got agent content from {sender}")
            # Handle agent content (could be images, files, etc.)
            try:
                # For now, just log it - you can extend this for image handling
                ctx.logger.info(f"Agent content: {item}")
                prompt_content.append({"text": str(item), "type": "agent_content"})
            except Exception as ex:
                ctx.logger.error(f"Failed to process agent content: {ex}")
                await ctx.send(sender, create_text_chat("Failed to process content."))
                return
        else:
            ctx.logger.warning(f"Got unexpected content from {sender}: {type(item)}")

    # Process the content if available
    if prompt_content:
        try:
            # Handle text-only queries for now
            if "help" in user_text.lower() or "what" in user_text.lower():
                response_text = """🍽️ **Eating Disorder Support Agent**

I can help you track and analyze your meals! Here's what I can do:

📸 **Upload meal images** - I'll analyze what you're eating and provide nutritional insights
📊 **Track eating patterns** - Monitor your meal timing and portion sizes
💡 **Provide support** - Get gentle, helpful feedback about your eating habits

Just upload an image of your meal and I'll analyze it for you!"""
            else:
                response_text = f"I'm here to help with meal analysis! Please upload an image of your meal and I'll provide detailed nutritional insights.\n\nYour message: {user_text}"
            
            await ctx.send(sender, create_text_chat(response_text))
            
        except Exception as err:
            ctx.logger.error(f"Error processing meal analysis: {err}")
            await ctx.send(sender, create_text_chat("Sorry, I couldn't process your request. Please try again."))

# Chat protocol acknowledgement handler
@chat_proto.on_message(ChatAcknowledgement)
async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement):
    ctx.logger.info(
        f"Got an acknowledgement from {sender} for {msg.acknowledged_msg_id}"
    )

# Register protocols
agent.include(chat_proto, publish_manifest=True)

if __name__ == "__main__":
    print("🚀 Starting Eating Disorder Support Agent...")
    print(f"📍 Agent address: {agent.address}")
    print("🌐 Ready for Agentverse deployment!")
    agent.run()
