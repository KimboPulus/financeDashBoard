from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import Settings, get_settings
from .database import JsonStore
from .routes import router


def create_app(settings: Settings | None = None, store: JsonStore | None = None) -> FastAPI:
    settings = settings or get_settings()
    app = FastAPI(title="Finance Dashboard API")
    app.state.settings = settings
    app.state.store = store or JsonStore(settings.database_path)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.client_origin, "http://127.0.0.1:5173"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(HTTPException)
    async def http_exception_handler(_request, exc: HTTPException):
        message = exc.detail if isinstance(exc.detail, str) else "Request failed."
        return JSONResponse(status_code=exc.status_code, content={"message": message})

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(_request, _exc: RequestValidationError):
        return JSONResponse(status_code=422, content={"message": "Check the request body and try again."})

    app.include_router(router, prefix="/api")
    return app


app = create_app()
