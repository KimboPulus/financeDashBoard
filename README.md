# Finance Dashboard

A small fullstack app for tracking personal expenses. The frontend is built with React, and the backend is a Python API built with FastAPI.

Users can create an account, log in, add expenses, edit them, delete them, filter by month/category, set a monthly budget, and see simple charts for monthly spending.

## Screenshots

![Dashboard overview](docs/images/dashboard-overview.png)

![Daily spending and expense log](docs/images/dashboard-expenses.png)

## Tech Stack

- React
- Vite
- Recharts
- FastAPI
- Python
- JWT auth
- pytest
- Vitest
- React Testing Library

## Project Structure

```text
client/                 React frontend and component tests
server/app/             FastAPI backend
server/tests/           API tests
server/data/db.json     Local data file created while the API runs
docs/images/            Screenshots used in this README
```

## Setup

Install frontend dependencies:

```bash
npm install
```

Create a Python virtual environment:

```bash
cd server
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

After this setup, the npm scripts use `server\.venv` automatically.

## Run the App

Start the frontend and backend together:

```bash
npm run dev
```

Open the app:

```text
http://127.0.0.1:5173
```

The frontend runs on port `5173`. The API runs on port `4000`.

## Run Only the Backend

```bash
npm run dev:api
```

API docs are available while the backend is running:

```text
http://127.0.0.1:4000/docs
```

## Run Tests

```bash
npm run test:client
npm run test:api
```

Run both suites with:

```bash
npm test
```

## API Routes

```text
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

GET    /api/expenses
POST   /api/expenses
PUT    /api/expenses/:id
DELETE /api/expenses/:id

GET    /api/budget?month=YYYY-MM
PUT    /api/budget

GET    /api/summary?month=YYYY-MM
```

## Reset Local Data

The backend stores local data in:

```text
server/data/db.json
```

Stop the backend and delete that file if you want to start with an empty account/expense list.
