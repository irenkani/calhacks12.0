# agent_config.py
import os
from dotenv import load_dotenv

load_dotenv()

STORAGE_AGENT_SEED = "storage_agent_seed_phrase"
ANALYSIS_AGENT_SEED = "eating_disorder_support_seed_phrase"

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Fill after first run
STORAGE_AGENT_ADDRESS = ""
ANALYSIS_AGENT_ADDRESS = ""