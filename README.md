# Patient Nutrition Analysis System

A comprehensive system for analyzing patient eating patterns and nutritional intake using Fetch.ai agents, Supabase storage, and Gemini Vision API.

## 🏥 System Overview

This system provides healthcare professionals with detailed analysis of patient meal patterns, including:
- **Eating Pattern Analysis**: Regular vs irregular eating schedules
- **Nutritional Assessment**: Calorie intake, food categories, portion analysis
- **Professional Recommendations**: Evidence-based suggestions for nutritionists/doctors
- **Historical Data**: Analysis of all stored meal images

## 🏗️ Architecture

```
Spectacles AR → Storage Agent → Analysis Agent → Frontend Web App
     ↓              ↓              ↓              ↓
Image Capture   Supabase Upload  Gemini Analysis  Doctor Dashboard
```

### Components:
1. **Storage Agent** (`storage_agent.py`) - Handles image uploads to Supabase
2. **Analysis Agent** (`nutrition_analysis_agent.py`) - Performs comprehensive analysis
3. **Frontend Web App** (`nutrition_frontend.py`) - Professional dashboard
4. **Batch Upload** (`upload_assets_folder.py`) - Uploads multiple images

## 🚀 Quick Start

### 1. Prerequisites
- Python 3.11+
- Supabase account and project
- Gemini API key
- Fetch.ai Agentverse account

### 2. Environment Setup
Create `.env` file:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-public-key
GEMINI_API_KEY=your-gemini-api-key
```

### 3. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 4. Supabase Setup
Run this SQL in Supabase SQL Editor:
```sql
-- Create meal_images table
CREATE TABLE meal_images (
    id SERIAL PRIMARY KEY,
    session_id TEXT NOT NULL,
    frame_id TEXT NOT NULL,
    file_path TEXT NOT NULL,
    url TEXT NOT NULL,
    uploaded_at BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS for testing
ALTER TABLE meal_images DISABLE ROW LEVEL SECURITY;

-- Create storage bucket
-- Go to Storage → Create bucket: "meals" (set to public)
```

### 5. Run the System
```bash
python setup_and_run.py
```

## 📋 Usage Instructions

### Option 1: Complete System
```bash
python setup_and_run.py
# Choose option 4 to run everything
```

### Option 2: Individual Components

#### Upload Assets Folder
```bash
python upload_assets_folder.py
```
- Uploads all images from `assets/` folder
- 30-second intervals between uploads
- Creates session tracking

#### Start Analysis Agent
```bash
python nutrition_analysis_agent.py
```
- Runs on port 8003
- Provides REST API for analysis
- Integrates with Gemini Vision API

#### Start Frontend Web App
```bash
python nutrition_frontend.py
```
- Runs on port 5000
- Professional dashboard for healthcare workers
- Access at: http://127.0.0.1:5000

## 🔍 Analysis Features

### Eating Pattern Analysis
- **Meal Frequency**: Number of meals per day
- **Timing Patterns**: Regular vs irregular eating schedules
- **Consumption Patterns**: Portion sizes and eating pace
- **Interval Analysis**: Time between meals

### Nutritional Assessment
- **Food Identification**: AI-powered food recognition
- **Calorie Estimation**: Estimated caloric intake per meal
- **Food Categories**: Protein, carbs, vegetables, etc.
- **Portion Analysis**: Consumption percentage per meal

### Professional Recommendations
- **Eating Schedule**: Suggestions for regular meal timing
- **Portion Control**: Recommendations for appropriate serving sizes
- **Nutritional Balance**: Advice on food variety and nutrients
- **Behavioral Patterns**: Insights into eating habits

## 🌐 Frontend Dashboard

### Features:
- **Patient Analysis**: Enter patient ID and date range
- **Real-time Results**: Live analysis of stored images
- **Professional Interface**: Designed for healthcare workers
- **Comprehensive Reports**: Detailed eating pattern analysis

### Usage:
1. Open http://127.0.0.1:5000
2. Enter patient ID
3. Select date range (optional)
4. Choose analysis type
5. View comprehensive results

## 📊 API Endpoints

### Analysis Agent (Port 8003)
- `POST /analyze` - Analyze patient data
- `GET /health` - Health check

### Frontend (Port 5000)
- `GET /` - Main dashboard
- `POST /analyze_patient` - Patient analysis request
- `GET /health` - System health check

## 🔧 Configuration

### Agent Configuration
- **Storage Agent**: Port 8001
- **Analysis Agent**: Port 8003
- **Frontend**: Port 5000

### Supabase Configuration
- **Bucket**: "meals" (public access)
- **Table**: "meal_images"
- **RLS**: Disabled for testing

### Gemini Configuration
- **Model**: gemini-2.0-flash-exp
- **Analysis**: Food recognition and nutritional assessment

## 🧪 Testing

### Test Individual Components
```bash
# Test Supabase upload
python test_supabase_upload.py

# Test custom image analysis
python upload_custom_image.py

# Query uploaded data
python query_uploads.py
```

### Test Complete Flow
1. Upload images using batch script
2. Start analysis agent
3. Start frontend
4. Access dashboard and run analysis

## 📁 File Structure

```
backend/
├── storage_agent.py              # Storage Agent
├── nutrition_analysis_agent.py  # Analysis Agent
├── nutrition_frontend.py        # Flask Frontend
├── upload_assets_folder.py      # Batch Upload
├── test.py                      # Core Analysis Logic
├── templates/
│   └── nutrition_dashboard.html  # Web Interface
├── assets/                      # Image Storage
├── requirements.txt             # Dependencies
├── setup_and_run.py            # Setup Script
└── .env                        # Environment Variables
```

## 🚨 Troubleshooting

### Common Issues:

1. **Supabase Upload Fails**
   - Check bucket exists and is public
   - Verify SUPABASE_URL and SUPABASE_KEY
   - Disable RLS: `ALTER TABLE meal_images DISABLE ROW LEVEL SECURITY;`

2. **Gemini Analysis Fails**
   - Verify GEMINI_API_KEY in .env
   - Check API quota and limits
   - Ensure images are accessible via URL

3. **Agent Communication Issues**
   - Check agent addresses and ports
   - Verify all agents are running
   - Check network connectivity

4. **Frontend Not Loading**
   - Ensure Flask is installed
   - Check port 5000 is available
   - Verify analysis agent is running

## 🎯 Hackathon Requirements Met

✅ **Fetch.ai Agentverse Integration**: Agents registered and deployed
✅ **Chat Protocol**: All agents use Fetch.ai messaging
✅ **LLM Integration**: Gemini Vision API for food analysis
✅ **Real-world Actions**: File uploads, database operations, API calls
✅ **Professional Interface**: Web dashboard for healthcare workers
✅ **Multi-agent Architecture**: Specialized agents for different tasks
✅ **External API Integration**: Supabase, Gemini, Flask

## 📞 Support

For issues or questions:
1. Check troubleshooting section
2. Verify all dependencies are installed
3. Ensure .env file is properly configured
4. Check Supabase and Gemini API access

## 🏆 Features Delivered

- **Complete Fetch.ai Integration**: Pure chat protocols, no REST endpoints
- **Professional Healthcare Interface**: Designed for nutritionists/doctors
- **Comprehensive Analysis**: Eating patterns, nutritional assessment, recommendations
- **Scalable Architecture**: Microservices with specialized agents
- **Real-world Application**: Solving eating disorder support challenges
