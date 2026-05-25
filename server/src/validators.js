export const categories = [
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

export function validateExpense(payload) {
  const errors = {};
  const amount = Number(payload.amount);
  const date = String(payload.date || '');
  const category = String(payload.category || '');
  const description = String(payload.description || '').trim();

  if (!Number.isFinite(amount) || amount <= 0) {
    errors.amount = 'Enter an amount greater than zero.';
  }

  if (!description) {
    errors.description = 'Add a short description.';
  }

  if (!categories.includes(category)) {
    errors.category = 'Pick one of the listed categories.';
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    errors.date = 'Use a real date.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    value: {
      amount,
      date,
      category,
      description,
      notes: String(payload.notes || '').trim()
    }
  };
}
