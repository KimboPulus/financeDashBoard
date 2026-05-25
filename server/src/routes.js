import bcrypt from 'bcryptjs';
import express from 'express';
import { nanoid } from 'nanoid';
import { createToken, requireAuth } from './auth.js';
import { readDb, writeDb } from './db.js';
import { categories, validateExpense } from './validators.js';

export const router = express.Router();

const monthPattern = /^\d{4}-\d{2}$/;

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email
  };
}

router.get('/health', (_req, res) => {
  res.json({ ok: true });
});

router.get('/categories', (_req, res) => {
  res.json({ categories });
});

router.post('/auth/register', async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!name || !email || password.length < 8) {
    return res.status(400).json({
      message: 'Fill in your name, email, and a password with at least 8 characters.'
    });
  }

  const db = await readDb();
  const existing = db.users.find((user) => user.email === email);

  if (existing) {
    return res.status(409).json({ message: 'That email is already registered.' });
  }

  const user = {
    id: nanoid(),
    name,
    email,
    passwordHash: await bcrypt.hash(password, 12),
    createdAt: new Date().toISOString()
  };

  db.users.push(user);
  await writeDb(db);

  res.status(201).json({
    user: publicUser(user),
    token: createToken(user)
  });
});

router.post('/auth/login', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const db = await readDb();
  const user = db.users.find((candidate) => candidate.email === email);

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ message: 'Wrong email or password.' });
  }

  res.json({
    user: publicUser(user),
    token: createToken(user)
  });
});

router.get('/auth/me', requireAuth, async (req, res) => {
  const db = await readDb();
  const user = db.users.find((candidate) => candidate.id === req.user.sub);

  if (!user) {
    return res.status(404).json({ message: 'Account not found.' });
  }

  res.json({ user: publicUser(user) });
});

router.get('/expenses', requireAuth, async (req, res) => {
  const db = await readDb();
  const month = String(req.query.month || '');
  const category = String(req.query.category || '');
  let expenses = db.expenses.filter((expense) => expense.userId === req.user.sub);

  if (monthPattern.test(month)) {
    expenses = expenses.filter((expense) => expense.date.startsWith(month));
  }

  if (category && category !== 'All') {
    expenses = expenses.filter((expense) => expense.category === category);
  }

  expenses.sort((a, b) => b.date.localeCompare(a.date));
  res.json({ expenses });
});

router.post('/expenses', requireAuth, async (req, res) => {
  const result = validateExpense(req.body);

  if (!result.isValid) {
    return res.status(400).json({ message: 'Check the expense details and try again.', errors: result.errors });
  }

  const db = await readDb();
  const expense = {
    id: nanoid(),
    userId: req.user.sub,
    ...result.value,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.expenses.push(expense);
  await writeDb(db);

  res.status(201).json({ expense });
});

router.put('/expenses/:id', requireAuth, async (req, res) => {
  const result = validateExpense(req.body);

  if (!result.isValid) {
    return res.status(400).json({ message: 'Check the expense details and try again.', errors: result.errors });
  }

  const db = await readDb();
  const index = db.expenses.findIndex(
    (expense) => expense.id === req.params.id && expense.userId === req.user.sub
  );

  if (index === -1) {
    return res.status(404).json({ message: 'Could not find that expense.' });
  }

  db.expenses[index] = {
    ...db.expenses[index],
    ...result.value,
    updatedAt: new Date().toISOString()
  };
  await writeDb(db);

  res.json({ expense: db.expenses[index] });
});

router.delete('/expenses/:id', requireAuth, async (req, res) => {
  const db = await readDb();
  const expense = db.expenses.find(
    (candidate) => candidate.id === req.params.id && candidate.userId === req.user.sub
  );

  if (!expense) {
    return res.status(404).json({ message: 'Could not find that expense.' });
  }

  db.expenses = db.expenses.filter((candidate) => candidate.id !== expense.id);
  await writeDb(db);

  res.status(204).send();
});

router.get('/summary', requireAuth, async (req, res) => {
  const db = await readDb();
  const month = monthPattern.test(String(req.query.month || ''))
    ? String(req.query.month)
    : new Date().toISOString().slice(0, 7);
  const expenses = db.expenses.filter(
    (expense) => expense.userId === req.user.sub && expense.date.startsWith(month)
  );

  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const byCategory = categories
    .map((category) => ({
      category,
      total: expenses
        .filter((expense) => expense.category === category)
        .reduce((sum, expense) => sum + expense.amount, 0)
    }))
    .filter((item) => item.total > 0);

  const byDay = expenses.reduce((days, expense) => {
    days[expense.date] = (days[expense.date] || 0) + expense.amount;
    return days;
  }, {});

  res.json({
    month,
    total,
    count: expenses.length,
    average: expenses.length ? total / expenses.length : 0,
    byCategory,
    byDay: Object.entries(byDay)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([date, dayTotal]) => ({ date, total: dayTotal }))
  });
});
