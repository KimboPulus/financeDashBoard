import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    client_origin: str = os.getenv("CLIENT_ORIGIN", "http://localhost:5173")
    database_path: Path = Path(
        os.getenv(
            "DATABASE_PATH",
            Path(__file__).resolve().parents[1] / "data" / "db.json",
        )
    )
    jwt_secret: str = os.getenv("JWT_SECRET", "local-pocket-ledger-secret")
    token_expire_minutes: int = int(os.getenv("TOKEN_EXPIRE_MINUTES", "10080"))


def get_settings() -> Settings:
    return Settings()
