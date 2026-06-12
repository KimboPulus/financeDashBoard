import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { CalendarDays, LogOut, Pencil, Plus, Target, Trash2, WalletCards } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api.js';
import { useAuth } from '../services/AuthContext.jsx';

const categories = [
  'Food',
  'Rent',
  'Transport',
  'Groceries',
  'Utilities',
  'Health',
  'Entertainment',
  'Shopping',
  'Education',
  'Travel',
  'Other'
];

const colors = [
  '#2f6f4e',
  '#24736f',
  '#315f9d',
  '#7b4ca0',
  '#a63d57',
  '#b4572b',
  '#8d6b2f',
  '#4f5fa8',
  '#25809a',
  '#5c6670',
  '#6d7b43'
];

const emptyForm = {
  description: '',
  amount: '',
  category: 'Food',
  date: new Date().toISOString().slice(0, 10),
  notes: ''
};

function money(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value || 0);
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export function Dashboard() {
  const { user, logout } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({ total: 0, count: 0, average: 0, byCategory: [], byDay: [] });
  const [month, setMonth] = useState(currentMonth());
  const [category, setCategory] = useState('All');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [budget, setBudget] = useState({ month: currentMonth(), amount: 0 });
  const [budgetInput, setBudgetInput] = useState('');
  const [budgetError, setBudgetError] = useState('');
  const [budgetSaved, setBudgetSaved] = useState(false);

  async function loadDashboard() {
    const params = { month };

    if (category !== 'All') {
      params.category = category;
    }

    const [expensesResult, summaryResult, budgetResult] = await Promise.all([
      api.get('/expenses', { params }),
      api.get('/summary', { params: { month } }),
      api.get('/budget', { params: { month } })
    ]);

    setExpenses(expensesResult.data.expenses);
    setSummary(summaryResult.data);
    setBudget(budgetResult.data);
    setBudgetInput(budgetResult.data.amount ? String(budgetResult.data.amount) : '');
    setBudgetSaved(false);
  }

  useEffect(() => {
    loadDashboard();
  }, [month, category]);

  const biggestCategory = useMemo(() => {
    return summary.byCategory.reduce((top, item) => (item.total > (top?.total || 0) ? item : top), null);
  }, [summary.byCategory]);

  const budgetUsage = budget.amount > 0 ? (summary.total / budget.amount) * 100 : 0;
  const budgetDifference = budget.amount - summary.total;

  async function handleBudgetSubmit(event) {
    event.preventDefault();
    setBudgetError('');
    setBudgetSaved(false);

    try {
      const { data } = await api.put('/budget', {
        month,
        amount: Number(budgetInput)
      });
      setBudget(data.budget);
      setBudgetInput(String(data.budget.amount));
      setBudgetSaved(true);
    } catch (err) {
      setBudgetError(err.response?.data?.message || 'Unable to save budget.');
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    try {
      const payload = { ...form, amount: Number(form.amount) };

      if (editingId) {
        await api.put(`/expenses/${editingId}`, payload);
      } else {
        await api.post('/expenses', payload);
      }

      setEditingId(null);
      setForm(emptyForm);
      await loadDashboard();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save expense.');
    }
  }

  function startEdit(expense) {
    setEditingId(expense.id);
    setForm({
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      date: expense.date,
      notes: expense.notes || ''
    });
  }

  async function removeExpense(id) {
    await api.delete(`/expenses/${id}`);
    await loadDashboard();
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark">
            <WalletCards size={24} />
          </span>
          <div>
            <strong>Pocket Ledger</strong>
            <span>{user?.name}'s monthly log</span>
          </div>
        </div>
        <button className="ghost-button" onClick={logout} type="button">
          <LogOut size={18} />
          Sign out
        </button>
      </header>

      <section className="controls-row">
        <label>
          <CalendarDays size={16} />
          <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
        </label>
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          <option>All</option>
          {categories.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </section>

      <section className="summary-grid">
        <article>
          <span>Monthly spend</span>
          <strong>{money(summary.total)}</strong>
        </article>
        <article>
          <span>Entries</span>
          <strong>{summary.count}</strong>
        </article>
        <article>
          <span>Average entry</span>
          <strong>{money(summary.average)}</strong>
        </article>
        <article>
          <span>Biggest bucket</span>
          <strong>{biggestCategory ? biggestCategory.category : 'None'}</strong>
        </article>
      </section>

      <section className={`budget-panel${budget.amount > 0 && budgetDifference < 0 ? ' over-budget' : ''}`}>
        <div className="budget-details">
          <div className="budget-heading">
            <span className="budget-icon">
              <Target size={20} />
            </span>
            <div>
              <h2>Monthly budget</h2>
              <strong>{budget.amount > 0 ? money(budget.amount) : 'Not set'}</strong>
            </div>
          </div>
          <progress max="100" value={Math.min(budgetUsage, 100)} />
          <p>
            {budget.amount > 0
              ? budgetDifference >= 0
                ? `${Math.round(budgetUsage)}% used, ${money(budgetDifference)} remaining`
                : `${money(Math.abs(budgetDifference))} over budget`
              : 'Set a spending target for this month.'}
          </p>
        </div>
        <form className="budget-form" onSubmit={handleBudgetSubmit}>
          <label>
            Budget amount
            <input
              min="0.01"
              step="0.01"
              type="number"
              value={budgetInput}
              onChange={(event) => setBudgetInput(event.target.value)}
              placeholder="1500"
              required
            />
          </label>
          <button className="primary-button" type="submit">
            <Target size={18} />
            Save budget
          </button>
          {budgetError && <p className="form-error">{budgetError}</p>}
          {budgetSaved && <p className="form-success">Budget saved.</p>}
        </form>
      </section>

      <section className="dashboard-grid">
        <form className="expense-form" onSubmit={handleSubmit}>
          <h2>{editingId ? 'Edit expense' : 'Add expense'}</h2>
          <label>
            Description
            <input
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="Coffee, train ticket, phone bill"
              required
            />
          </label>
          <div className="form-pair">
            <label>
              Amount
              <input
                min="0.01"
                step="0.01"
                type="number"
                value={form.amount}
                onChange={(event) => setForm({ ...form, amount: event.target.value })}
                required
              />
            </label>
            <label>
              Date
              <input
                type="date"
                value={form.date}
                onChange={(event) => setForm({ ...form, date: event.target.value })}
                required
              />
            </label>
          </div>
          <label>
            Category
            <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
              {categories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            Notes
            <textarea
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
              placeholder="Optional note"
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="primary-button" type="submit">
            <Plus size={18} />
            {editingId ? 'Update expense' : 'Add expense'}
          </button>
          {editingId && (
            <button
              className="ghost-button"
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
            >
              Cancel edit
            </button>
          )}
        </form>

        <section className="chart-panel">
          <h2>Spending by category</h2>
          {summary.byCategory.length ? (
            <ResponsiveContainer height={280} width="100%">
              <PieChart>
                <Pie data={summary.byCategory} dataKey="total" nameKey="category" outerRadius={96} label>
                  {summary.byCategory.map((entry, index) => (
                    <Cell key={entry.category} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => money(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="empty-state">No category totals for this month yet.</p>
          )}
        </section>

        <section className="chart-panel wide">
          <h2>Daily spending</h2>
          {summary.byDay.length ? (
            <ResponsiveContainer height={260} width="100%">
              <BarChart data={summary.byDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => money(value)} />
                <Bar dataKey="total" fill="#2f6f4e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="empty-state">Daily totals show up after you add something.</p>
          )}
        </section>
      </section>

      <section className="expense-table">
        <div className="section-heading">
          <h2>Expense log</h2>
          <span>{expenses.length} shown</span>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id}>
                  <td>{expense.date}</td>
                  <td>
                    <strong>{expense.description}</strong>
                    {expense.notes && <span>{expense.notes}</span>}
                  </td>
                  <td>{expense.category}</td>
                  <td>{money(expense.amount)}</td>
                  <td>
                    <button className="icon-button" onClick={() => startEdit(expense)} title="Edit expense" type="button">
                      <Pencil size={16} />
                    </button>
                    <button className="icon-button danger" onClick={() => removeExpense(expense.id)} title="Delete expense" type="button">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!expenses.length && <p className="empty-state">Nothing matches these filters.</p>}
        </div>
      </section>
    </main>
  );
}
