# Pocket Ledger

A simple personal budget dashboard. The idea is pretty basic: make an account, add expenses, and get a quick picture of where the money went that month.

This uses a JSON file for storage, so it is easy to run locally without setting up a database. It is not meant to be a bank-grade app, just a clean fullstack JavaScript project.

## Running it

1. Open this folder in WebStorm:

   `C:\Users\Max\Documents\Codex\2026-05-24\let-s-create-a-project-in`

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the fullstack dev app:

   ```bash
   npm run dev
   ```

4. Open the app:

   `http://127.0.0.1:5173`

The backend runs on port `4000`, and Vite proxies `/api` requests to it.

## What is inside

- `client/` - React app
- `server/` - Express API
- `server/data/db.json` - local data file created while the app runs

## Main features

- email/password signup and login
- add, edit, and delete expenses
- filter expenses by month and category
- pie chart for category totals
- bar chart for daily spending

## Learning documentation

I added a beginner-friendly project guide here:

`docs/Pocket_Ledger_Learning_Guide.pdf`

## API

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/expenses`
- `POST /api/expenses`
- `PUT /api/expenses/:id`
- `DELETE /api/expenses/:id`
- `GET /api/summary?month=YYYY-MM`

## Notes

If you want to reset the demo data, stop the server and delete `server/data/db.json`.
