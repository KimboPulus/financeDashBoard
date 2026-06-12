from datetime import datetime, timezone
from typing import Annotated
from uuid import uuid4

from fastapi import APIRouter, Depends, Query, Request, Response
from fastapi.responses import JSONResponse

from .categories import CATEGORIES
from .database import JsonStore
from .dependencies import get_store
from .schemas import BudgetPayload, ExpensePayload, LoginPayload, RegisterPayload
from .security import create_token, current_user_payload, hash_password, verify_password
from .validation import MONTH_PATTERN, normalize_email, public_user, validate_expense

router = APIRouter()


def api_error(status_code: int, message: str, **extra: object) -> JSONResponse:
    return JSONResponse(status_code=status_code, content={"message": message, **extra})


@router.get("/health")
def health() -> dict[str, bool]:
    return {"ok": True}


@router.get("/categories")
def categories() -> dict[str, list[str]]:
    return {"categories": CATEGORIES}


@router.post("/auth/register", status_code=201)
def register(
    payload: RegisterPayload,
    store: Annotated[JsonStore, Depends(get_store)],
    request: Request,
) -> JSONResponse:
    name = payload.name.strip()
    email = normalize_email(payload.email)

    if not name or "@" not in email or len(payload.password) < 8:
        return api_error(400, "Fill in your name, email, and a password with at least 8 characters.")

    db = store.read()
    if any(user["email"] == email for user in db["users"]):
        return api_error(409, "That email is already registered.")

    user = {
        "id": uuid4().hex,
        "name": name,
        "email": email,
        "passwordHash": hash_password(payload.password),
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    db["users"].append(user)
    store.write(db)

    return JSONResponse(
        status_code=201,
        content={"user": public_user(user), "token": create_token(user, request.app.state.settings)},
    )


@router.post("/auth/login")
def login(
    payload: LoginPayload,
    store: Annotated[JsonStore, Depends(get_store)],
    request: Request,
) -> JSONResponse:
    email = normalize_email(payload.email)
    db = store.read()
    user = next((candidate for candidate in db["users"] if candidate["email"] == email), None)

    if user is None or not verify_password(payload.password, user["passwordHash"]):
        return api_error(401, "Wrong email or password.")

    return JSONResponse(content={"user": public_user(user), "token": create_token(user, request.app.state.settings)})


@router.get("/auth/me")
def me(
    user_payload: Annotated[dict, Depends(current_user_payload)],
    store: Annotated[JsonStore, Depends(get_store)],
) -> dict[str, dict[str, str]]:
    db = store.read()
    user = next((candidate for candidate in db["users"] if candidate["id"] == user_payload["sub"]), None)

    if user is None:
        return api_error(404, "Account not found.")

    return {"user": public_user(user)}


@router.get("/expenses")
def list_expenses(
    user_payload: Annotated[dict, Depends(current_user_payload)],
    store: Annotated[JsonStore, Depends(get_store)],
    month: str = Query(default=""),
    category: str = Query(default=""),
) -> dict[str, list[dict]]:
    db = store.read()
    expenses = [expense for expense in db["expenses"] if expense["userId"] == user_payload["sub"]]

    if MONTH_PATTERN.match(month):
        expenses = [expense for expense in expenses if expense["date"].startswith(month)]

    if category and category != "All":
        expenses = [expense for expense in expenses if expense["category"] == category]

    expenses.sort(key=lambda expense: expense["date"], reverse=True)
    return {"expenses": expenses}


@router.post("/expenses", status_code=201)
def create_expense(
    payload: ExpensePayload,
    user_payload: Annotated[dict, Depends(current_user_payload)],
    store: Annotated[JsonStore, Depends(get_store)],
) -> JSONResponse:
    value, errors = validate_expense(payload)
    if errors:
        return api_error(400, "Check the expense details and try again.", errors=errors)

    db = store.read()
    now = datetime.now(timezone.utc).isoformat()
    expense = {
        "id": uuid4().hex,
        "userId": user_payload["sub"],
        **value,
        "createdAt": now,
        "updatedAt": now,
    }
    db["expenses"].append(expense)
    store.write(db)

    return JSONResponse(status_code=201, content={"expense": expense})


@router.put("/expenses/{expense_id}")
def update_expense(
    expense_id: str,
    payload: ExpensePayload,
    user_payload: Annotated[dict, Depends(current_user_payload)],
    store: Annotated[JsonStore, Depends(get_store)],
) -> JSONResponse:
    value, errors = validate_expense(payload)
    if errors:
        return api_error(400, "Check the expense details and try again.", errors=errors)

    db = store.read()
    index = next(
        (
            idx
            for idx, expense in enumerate(db["expenses"])
            if expense["id"] == expense_id and expense["userId"] == user_payload["sub"]
        ),
        None,
    )

    if index is None:
        return api_error(404, "Could not find that expense.")

    db["expenses"][index] = {
        **db["expenses"][index],
        **value,
        "updatedAt": datetime.now(timezone.utc).isoformat(),
    }
    store.write(db)
    return JSONResponse(content={"expense": db["expenses"][index]})


@router.delete("/expenses/{expense_id}")
def delete_expense(
    expense_id: str,
    user_payload: Annotated[dict, Depends(current_user_payload)],
    store: Annotated[JsonStore, Depends(get_store)],
):
    db = store.read()
    expense = next(
        (
            candidate
            for candidate in db["expenses"]
            if candidate["id"] == expense_id and candidate["userId"] == user_payload["sub"]
        ),
        None,
    )

    if expense is None:
        return api_error(404, "Could not find that expense.")

    db["expenses"] = [candidate for candidate in db["expenses"] if candidate["id"] != expense_id]
    store.write(db)
    return Response(status_code=204)


@router.get("/budget")
def get_budget(
    user_payload: Annotated[dict, Depends(current_user_payload)],
    store: Annotated[JsonStore, Depends(get_store)],
    month: str = Query(default=""),
) -> dict[str, str | float]:
    selected_month = month if MONTH_PATTERN.match(month) else datetime.now(timezone.utc).date().isoformat()[:7]
    db = store.read()
    budget = next(
        (
            item
            for item in db["budgets"]
            if item["userId"] == user_payload["sub"] and item["month"] == selected_month
        ),
        None,
    )

    return {"month": selected_month, "amount": budget["amount"] if budget else 0}


@router.put("/budget")
def save_budget(
    payload: BudgetPayload,
    user_payload: Annotated[dict, Depends(current_user_payload)],
    store: Annotated[JsonStore, Depends(get_store)],
) -> JSONResponse:
    month = payload.month.strip()
    if not MONTH_PATTERN.match(month) or payload.amount <= 0:
        return api_error(400, "Enter a valid month and a budget greater than zero.")

    db = store.read()
    budget = next(
        (
            item
            for item in db["budgets"]
            if item["userId"] == user_payload["sub"] and item["month"] == month
        ),
        None,
    )

    if budget is None:
        budget = {"userId": user_payload["sub"], "month": month, "amount": payload.amount}
        db["budgets"].append(budget)
    else:
        budget["amount"] = payload.amount

    budget["updatedAt"] = datetime.now(timezone.utc).isoformat()
    store.write(db)
    return JSONResponse(content={"budget": {"month": month, "amount": budget["amount"]}})


@router.get("/summary")
def summary(
    user_payload: Annotated[dict, Depends(current_user_payload)],
    store: Annotated[JsonStore, Depends(get_store)],
    month: str = Query(default=""),
) -> dict:
    selected_month = month if MONTH_PATTERN.match(month) else datetime.now(timezone.utc).date().isoformat()[:7]
    db = store.read()
    expenses = [
        expense
        for expense in db["expenses"]
        if expense["userId"] == user_payload["sub"] and expense["date"].startswith(selected_month)
    ]

    total = sum(expense["amount"] for expense in expenses)
    by_category = [
        {
            "category": category,
            "total": sum(expense["amount"] for expense in expenses if expense["category"] == category),
        }
        for category in CATEGORIES
    ]
    by_category = [item for item in by_category if item["total"] > 0]

    by_day: dict[str, float] = {}
    for expense in expenses:
        by_day[expense["date"]] = by_day.get(expense["date"], 0) + expense["amount"]

    return {
        "month": selected_month,
        "total": total,
        "count": len(expenses),
        "average": total / len(expenses) if expenses else 0,
        "byCategory": by_category,
        "byDay": [{"date": day, "total": by_day[day]} for day in sorted(by_day)],
    }
