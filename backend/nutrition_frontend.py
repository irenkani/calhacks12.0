# nutrition_frontend.py
from flask import Flask, render_template, request, jsonify
import requests
import json

app = Flask(__name__)

# Agent endpoints
ANALYSIS_AGENT_URL = "http://127.0.0.1:8003"

@app.route('/')
def index():
    """Main dashboard for nutritionists/doctors"""
    return render_template('nutrition_dashboard.html')

@app.route('/analyze_patient', methods=['POST'])
def analyze_patient():
    """Analyze patient data via analysis agent"""
    try:
        # Use default patient ID for simplicity
        patient_id = "patient_001"
        
        # Prepare request for analysis agent
        payload = {
            "patient_id": patient_id,
            "date_range_start": None,
            "date_range_end": None,
            "analysis_type": "comprehensive"
        }
        
        # Call analysis agent
        response = requests.post(f"{ANALYSIS_AGENT_URL}/analyze", json=payload)
        response.raise_for_status()
        
        result = response.json()
        
        return jsonify({
            "success": True,
            "analysis": result
        })
        
    except requests.RequestException as e:
        return jsonify({"error": f"Failed to connect to analysis agent: {str(e)}"})
    except Exception as e:
        return jsonify({"error": f"Analysis failed: {str(e)}"})

@app.route('/health')
def health_check():
    """Check health of analysis agent"""
    try:
        response = requests.get(f"{ANALYSIS_AGENT_URL}/health", timeout=5)
        if response.status_code == 200:
            return jsonify({"status": "healthy", "agent": "nutrition_analysis_agent"})
        else:
            return jsonify({"status": "unhealthy", "agent": "nutrition_analysis_agent"})
    except:
        return jsonify({"status": "offline", "agent": "nutrition_analysis_agent"})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
