from fastapi import Request

from .database import JsonStore


def get_store(request: Request) -> JsonStore:
    return request.app.state.store
