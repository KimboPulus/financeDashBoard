import json
from pathlib import Path
from threading import RLock
from typing import Any


class JsonStore:
    def __init__(self, path: Path):
        self.path = Path(path)
        self._lock = RLock()

    def _ensure_file(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        if not self.path.exists():
            self.write({"users": [], "expenses": [], "budgets": []})

    def read(self) -> dict[str, list[dict[str, Any]]]:
        with self._lock:
            self._ensure_file()
            with self.path.open("r", encoding="utf-8") as file:
                data = json.load(file)
                data.setdefault("budgets", [])
                return data

    def write(self, data: dict[str, list[dict[str, Any]]]) -> None:
        with self._lock:
            self.path.parent.mkdir(parents=True, exist_ok=True)
            with self.path.open("w", encoding="utf-8") as file:
                json.dump(data, file, indent=2)
