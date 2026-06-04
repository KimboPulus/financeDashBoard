def test_expense_crud_and_summary(client, auth_headers):
    create = client.post(
        "/api/expenses",
        headers=auth_headers,
        json={
            "description": "Coffee",
            "amount": 12.5,
            "category": "Food",
            "date": "2026-06-04",
            "notes": "Morning stop",
        },
    )

    assert create.status_code == 201
    expense = create.json()["expense"]

    listed = client.get("/api/expenses?month=2026-06", headers=auth_headers)
    assert listed.status_code == 200
    assert listed.json()["expenses"][0]["description"] == "Coffee"

    summary = client.get("/api/summary?month=2026-06", headers=auth_headers)
    body = summary.json()
    assert body["total"] == 12.5
    assert body["count"] == 1
    assert body["byCategory"] == [{"category": "Food", "total": 12.5}]
    assert body["byDay"] == [{"date": "2026-06-04", "total": 12.5}]

    update = client.put(
        f"/api/expenses/{expense['id']}",
        headers=auth_headers,
        json={
            "description": "Groceries",
            "amount": 42,
            "category": "Groceries",
            "date": "2026-06-05",
            "notes": "",
        },
    )
    assert update.status_code == 200
    assert update.json()["expense"]["category"] == "Groceries"

    delete = client.delete(f"/api/expenses/{expense['id']}", headers=auth_headers)
    assert delete.status_code == 204

    empty = client.get("/api/expenses?month=2026-06", headers=auth_headers)
    assert empty.json()["expenses"] == []


def test_invalid_expense_returns_field_errors(client, auth_headers):
    response = client.post(
        "/api/expenses",
        headers=auth_headers,
        json={"description": "", "amount": 0, "category": "Bad", "date": "today", "notes": ""},
    )

    assert response.status_code == 400
    assert set(response.json()["errors"]) == {"amount", "description", "category", "date"}


def test_users_only_see_their_own_expenses(client, auth_headers):
    client.post(
        "/api/expenses",
        headers=auth_headers,
        json={"description": "Rent", "amount": 800, "category": "Rent", "date": "2026-06-01", "notes": ""},
    )
    second = client.post(
        "/api/auth/register",
        json={"name": "Second User", "email": "second@example.com", "password": "password123"},
    )
    second_headers = {"Authorization": f"Bearer {second.json()['token']}"}

    response = client.get("/api/expenses?month=2026-06", headers=second_headers)
    assert response.status_code == 200
    assert response.json()["expenses"] == []
