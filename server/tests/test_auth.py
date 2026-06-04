def test_register_login_and_me(client):
    response = client.post(
        "/api/auth/register",
        json={"name": "Max", "email": "max@example.com", "password": "password123"},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["user"]["email"] == "max@example.com"
    assert body["token"]

    login = client.post("/api/auth/login", json={"email": "max@example.com", "password": "password123"})
    assert login.status_code == 200

    token = login.json()["token"]
    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["user"]["name"] == "Max"


def test_duplicate_register_and_wrong_login(client):
    payload = {"name": "Max", "email": "max@example.com", "password": "password123"}

    assert client.post("/api/auth/register", json=payload).status_code == 201

    duplicate = client.post("/api/auth/register", json=payload)
    assert duplicate.status_code == 409
    assert duplicate.json()["message"] == "That email is already registered."

    wrong_login = client.post("/api/auth/login", json={"email": "max@example.com", "password": "bad-password"})
    assert wrong_login.status_code == 401
