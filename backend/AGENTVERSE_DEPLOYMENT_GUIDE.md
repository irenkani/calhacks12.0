# Agentverse Deployment Guide

## 🚀 Deploy Eating Disorder Support Agent to Agentverse

Based on the [Fetch.ai Innovation Lab documentation](https://innovationlab.fetch.ai/resources/docs/examples/chat-protocol/image-analysis-agent), here's how to properly deploy our agent:

## 📋 Prerequisites

1. **Agentverse Account**: Sign up at [agentverse.ai](https://agentverse.ai)
2. **Environment Variables**: Set up your `.env` file with:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-anon-public-key
   GEMINI_API_KEY=your-gemini-api-key
   ```

## 🔧 Step-by-Step Deployment

### 1. Create New Agent on Agentverse

1. Go to [agentverse.ai](https://agentverse.ai)
2. Click **"Create Agent"**
3. Name: `Eating Disorder Support Agent`
4. Description: `AI-powered meal analysis and eating disorder support agent that analyzes meal images and provides nutritional insights with gentle, supportive feedback.`

### 2. Upload Agent Files

Create these files in your Agentverse agent:

#### **agent.py** (Main agent file)
```python
# Copy the entire content from eating_disorder_chat_agent.py
```

#### **requirements.txt**
```
uagents>=0.22.0
uagents-core>=0.3.0
supabase>=2.0.0
google-generativeai
Pillow
requests
python-dotenv
```

### 3. Set Environment Variables

In Agentverse, go to **Settings** → **Environment Variables** and add:
- `SUPABASE_URL`
- `SUPABASE_KEY` 
- `GEMINI_API_KEY`

### 4. Configure Agent Settings

- **Protocol**: Chat Protocol
- **Storage**: Enable Agent Storage
- **Attachments**: Enable (for image uploads)

### 5. Deploy and Test

1. Click **"Deploy Agent"**
2. Wait for deployment to complete
3. Go to **Overview** → **"Chat with Agent"**
4. Test by uploading a meal image

## 🧪 Testing the Agent

### Via Agentverse Chat Interface:
1. Upload a meal image using the **Attach** button
2. Ask: "Analyze this meal and tell me about the nutritional content"
3. The agent should:
   - Analyze the image with Gemini Vision
   - Upload to Supabase storage
   - Provide detailed nutritional insights
   - Give supportive feedback

### Expected Response Format:
```
🍽️ **Meal Analysis**

**Food Items Detected:**
- Grilled chicken breast
- Steamed broccoli
- Brown rice

**Nutritional Assessment:**
- Good protein source
- Healthy vegetables
- Balanced meal

**Portion Analysis:**
- Appropriate serving sizes
- Good macronutrient balance

💡 *This analysis has been saved to your meal tracking system.*
```

## 🔗 Integration with Spectacles

Once deployed, update your Spectacles `FetchAIAgent.ts`:

```typescript
@input
storageAgentAddress: string = "YOUR_AGENTVERSE_AGENT_ADDRESS"; // Get from Agentverse
```

## 📊 Features

✅ **Image Analysis**: Uses Gemini Vision API for food detection  
✅ **Supabase Integration**: Stores meal images and metadata  
✅ **Chat Protocol**: Compatible with Agentverse Chat Interface  
✅ **Supportive Responses**: Gentle, helpful feedback for eating disorder support  
✅ **Meal Tracking**: Automatic storage of analyzed meals  

## 🆘 Troubleshooting

- **Agent not responding**: Check environment variables are set correctly
- **Image upload fails**: Verify Supabase configuration
- **Analysis errors**: Check Gemini API key and quota
- **Storage issues**: Ensure Supabase bucket is public

## 📝 Next Steps

1. Deploy the agent following the steps above
2. Test with sample meal images
3. Update Spectacles integration with the agent address
4. Test the full AR experience

The agent will be discoverable on Agentverse and can be used by both the Spectacles AR app and the web interface!
