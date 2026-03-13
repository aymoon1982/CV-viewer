import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

from agents.llm_client import get_llm_client

async def test_openrouter():
    print("Testing OpenRouter configuration...")
    try:
        client = get_llm_client()
        client.model = "arcee-ai/trinity-large-preview:free"
        response = await client.chat(
            system="You are a helpful assistant.",
            user_message="Say 'Hello, OpenRouter connects successfully!'",
            temperature=0.0
        )
        print("Response received:")
        print(response)
        
        print("\nTesting JSON extraction...")
        json_resp = await client.chat_json(
            system="You extract information. Schema: {\"name\": \"string\", \"years_experience\": \"integer\"}",
            user_message="My name is John Doe and I have 5 years of experience.",
        )
        print("JSON Response:")
        print(json_resp)
        print("\nAll tests passed successfully.")
    except Exception as e:
        print(f"Test failed with error: {e}")

if __name__ == "__main__":
    asyncio.run(test_openrouter())
