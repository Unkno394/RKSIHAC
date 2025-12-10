"""
ASGI entrypoint for deployment (Render/railway/etc).
"""
import os
import sys

# Ensure backend package is on path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(CURRENT_DIR, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.main import app  # noqa: E402

# Run with: uvicorn main:app --host 0.0.0.0 --port 8000

