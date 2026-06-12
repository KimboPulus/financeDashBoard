def test_budget_can_be_saved_updated_and_is_private(client, auth_headers):
    created = client.put(
        "/api/budget",
        headers=auth_headers,
        json={"month": "2026-06", "amount": 1200},
    )
    assert created.status_code == 200
    assert created.json()["budget"] == {"month": "2026-06", "amount": 1200}

    updated = client.put(
        "/api/budget",
        headers=auth_headers,
        json={"month": "2026-06", "amount": 1500},
    )
    assert updated.status_code == 200

    saved = client.get("/api/budget?month=2026-06", headers=auth_headers)
    assert saved.status_code == 200
    assert saved.json() == {"month": "2026-06", "amount": 1500}

    second = client.post(
        "/api/auth/register",
        json={"name": "Second User", "email": "second@example.com", "password": "password123"},
    )
    second_headers = {"Authorization": f"Bearer {second.json()['token']}"}
    private_budget = client.get("/api/budget?month=2026-06", headers=second_headers)
    assert private_budget.json() == {"month": "2026-06", "amount": 0}


def test_budget_rejects_invalid_values(client, auth_headers):
    response = client.put(
        "/api/budget",
        headers=auth_headers,
        json={"month": "2026-13", "amount": 0},
    )

    assert response.status_code == 400
    assert response.json()["message"] == "Enter a valid month and a budget greater than zero."
