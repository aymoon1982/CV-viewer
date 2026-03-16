import asyncio
import json
from models.database import engine
from sqlalchemy import text

async def debug_db():
    async with engine.connect() as conn:
        print("--- DATABASE CHECK ---")
        tables = await conn.execute(text("SELECT name FROM sqlite_master WHERE type='table'"))
        print(f"Tables found: {[t[0] for t in tables.fetchall()]}")

        print("\n--- APP SETTINGS ---")
        settings = await conn.execute(text("SELECT key, value FROM app_settings"))
        rows = settings.fetchall()
        print(f"Found {len(rows)} settings.")
        for s in rows:
            print(f"Key: {s.key}")
            try:
                val = json.loads(s.value)
                if s.key == "ai" and "apiKey" in val and val["apiKey"]:
                    k = val["apiKey"]
                    val["apiKey"] = k[:6] + "..." + k[-4:] if len(k) > 10 else "***"
                print(f"Value: {val}")
            except Exception as e:
                print(f"Value (raw): {s.value} | Error: {e}")
        
        print("\n--- CANDIDATE STATUS COUNTS ---")
        status_counts = await conn.execute(text("SELECT status, COUNT(*) FROM candidates GROUP BY status"))
        for row in status_counts.fetchall():
            print(f"Status: {row[0]}, Count: {row[1]}")

        print("\n--- STUCK/RECENT CANDIDATES ---")
        candidates = await conn.execute(text("SELECT id, name, status, elimination_reason FROM candidates ORDER BY created_at DESC LIMIT 5"))
        for c in candidates.fetchall():
            print(f"ID: {c.id}, Name: {c.name}, Status: {c.status}, Reason: {c.elimination_reason}")

if __name__ == "__main__":
    asyncio.run(debug_db())
