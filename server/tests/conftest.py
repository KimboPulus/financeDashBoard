from pathlib import Path
import sys

import pytest
from fastapi.testclient import TestClient

SERVER_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SERVER_ROOT))

from app.config import Settings
from app.database import JsonStore
from app.main import create_app


@pytest.fixture()
def client(tmp_path):
    settings = Settings(
        client_origin="http://testserver",
        database_path=tmp_path / "db.json",
        jwt_secret="test-secret",
        token_expire_minutes=60,
    )
    app = create_app(settings=settings, store=JsonStore(settings.database_path))
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture()
def auth_headers(client):
    response = client.post(
        "/api/auth/register",
        json={"name": "Demo User", "email": "demo@example.com", "password": "password123"},
    )
    assert response.status_code == 201
    token = response.json()["token"]
    return {"Authorization": f"Bearer {token}"}
