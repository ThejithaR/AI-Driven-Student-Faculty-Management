import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# Get the parent directory of the current file (../)
env_path = Path(__file__).resolve().parent.parent / ".env"

# Load the .env file
load_dotenv(dotenv_path=env_path)


url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

print("URL:", url)
print("Key:", key)
supabase: Client = create_client(url, key)