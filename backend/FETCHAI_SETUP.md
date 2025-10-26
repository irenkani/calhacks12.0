# Fetch.ai Agentverse Deployment Guide

## Overview
This guide walks you through deploying the eating support agents to Fetch.ai Agentverse with chat protocols enabled.

## Prerequisites
- Supabase account and project set up
- Gemini API key
- Fetch.ai Agentverse account

## Step 1: Environment Setup

Create `.env` file in `backend/` directory:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-public-key
GEMINI_API_KEY=your-gemini-api-key
```

## Step 1: Environment Setup

Create `.env` file in `backend/` directory:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-public-key
GEMINI_API_KEY=your-gemini-api-key
```

## Step 2: Supabase Setup

1. **Create Supabase project** at supabase.com
2. **Create storage bucket**: `meal-images` (set to public)
3. **Run SQL setup**: Execute `supabase_setup.sql` in Supabase SQL Editor
4. **No depth-data bucket needed** - using hardcoded depth data

## Step 3: Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

## Step 4: Run Agents Locally First

Get agent addresses by running both agents:

### Terminal 1 - Storage Agent
```bash
cd backend
python storage_agent.py
```
Copy the agent address: `Agent Address: agent1q...`

### Terminal 2 - Analysis Agent  
```bash
cd backend
python test.py
```
Copy the agent address: `Agent Address: agent1q...`

## Step 5: Update Agent Addresses

Edit `backend/storage_agent.py` and update:
```python
ANALYSIS_AGENT_ADDRESS = "agent1q..."  # Paste Analysis Agent address here
```

## Step 5: Register Storage Agent on Agentverse

1. Go to [agentverse.ai](https://agentverse.ai)
2. Create account / login
3. Click "Register Agent"
4. Paste Storage Agent address
5. Name: "storage_agent"
6. Get mailbox key from dashboard
7. Add to `.env`: `STORAGE_AGENT_MAILBOX_KEY=...`

## Step 6: Register Analysis Agent on Agentverse

1. Same process as Storage Agent
2. Paste Analysis Agent address  
3. Name: "eating_support_agent"
4. Get mailbox key
5. Add to `.env`: `ANALYSIS_AGENT_MAILBOX_KEY=...`

## Step 7: Enable Chat Protocol on Both Agents

### Storage Agent
1. In Agentverse, select Storage Agent
2. Go to "Protocols" tab
3. Enable "Chat Protocol"
4. Protocol name: "StorageChat"

### Analysis Agent
1. In Agentverse, select Analysis Agent
2. Go to "Protocols" tab  
3. Enable "Chat Protocol"
4. Protocol name: "MealTrackingChat"

## Step 8: Test Agents via Agentverse Chat

### Test Storage Agent
1. Go to Agentverse → Agent Chat
2. Find "storage_agent"
3. Send UploadRequest message:
```json
{
  "image_base64": "iVBORw0KGgo...",
  "session_id": "test_session",
  "frame_id": "frame_001",
  "user_id": "test_user"
}
```

### Test Analysis Agent
1. Go to Agentverse → Agent Chat
2. Find "eating_support_agent"  
3. Send CaptureRequest message:
```json
{
  "session_id": "test_session",
  "user_id": "test_user",
  "image_url": "https://your-project.supabase.co/storage/v1/object/public/meal-images/test_session/frame_001.jpg",
  "timestamp": 1640995200
}
```

## Step 9: Update Spectacles Integration

Update `Depth Cache/Assets/Scripts/FetchAIAgent.ts`:
```typescript
private readonly STORAGE_AGENT_URL = "https://agentverse.ai/v1/agents/{storage_agent_address}/messages";
```

Replace `{storage_agent_address}` with your actual Storage Agent address.

## Step 10: Deploy to Spectacles

1. Update Spectacles controller to use FetchAIAgent
2. Deploy Lens to Spectacles
3. Test end-to-end flow

## Verification Checklist

- [ ] Both agents registered on Agentverse
- [ ] Chat protocols enabled on both agents
- [ ] Agents respond to test messages in Agentverse chat
- [ ] Supabase storage working (images uploaded successfully)
- [ ] Gemini API working (analysis returns results)
- [ ] Spectacles can communicate with agents via Agentverse

## Troubleshooting

### Agent Not Responding
- Check mailbox keys in `.env`
- Verify agent addresses are correct
- Ensure agents are running and registered

### Upload Failures
- Verify Supabase credentials
- Check storage buckets exist and are public
- Test Supabase connection separately

### Analysis Failures  
- Verify Gemini API key
- Check image URLs are accessible
- Test Gemini API separately

## Architecture Summary

```
Spectacles → Storage Agent (Agentverse) → Analysis Agent (Agentverse)
    ↓              ↓                           ↓
HTTP Request   Chat Protocol              Chat Protocol
    ↓              ↓                           ↓
Upload JPEG    Supabase Storage         Gemini Analysis
    ↓              ↓                           ↓
Get URL        Return URL              Return AnalysisResult
```

**Simplified approach**: Only JPEG images, hardcoded depth data, pure Fetch.ai chat protocols!