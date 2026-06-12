import re
from typing import Any

from .categories import CATEGORIES
from .schemas import ExpensePayload

DATE_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2}$")
MONTH_PATTERN = re.compile(r"^\d{4}-(0[1-9]|1[0-2])$")


def normalize_email(email: str) -> str:
    return email.strip().lower()


def public_user(user: dict[str, Any]) -> dict[str, str]:
    return {"id": user["id"], "name": user["name"], "email": user["email"]}


def validate_expense(payload: ExpensePayload) -> tuple[dict[str, Any], dict[str, str]]:
    errors: dict[str, str] = {}
    description = payload.description.strip()
    category = payload.category.strip()
    date = payload.date.strip()
    notes = payload.notes.strip()

    if payload.amount <= 0:
        errors["amount"] = "Enter an amount greater than zero."

    if not description:
        errors["description"] = "Add a short description."

    if category not in CATEGORIES:
        errors["category"] = "Pick one of the listed categories."

    if not DATE_PATTERN.match(date):
        errors["date"] = "Use a real date."

    return (
        {
            "amount": payload.amount,
            "date": date,
            "category": category,
            "description": description,
            "notes": notes,
        },
        errors,
    )
