import asyncio
import sys
import os
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
from backend.gemini_client import generate_question

async def main():
    res = await generate_question(
        "test form", 
        {"label": "first name", "type": "text"}, 
        [], 
        {"memory_context": "The user's first name is Alex."}
    )
    print("RES:", res)

if __name__ == "__main__":
    asyncio.run(main())
