"""
TalentLens — Common Dependencies
"""

from models.database import get_db

# Re-export for route handlers
__all__ = ["get_db"]
