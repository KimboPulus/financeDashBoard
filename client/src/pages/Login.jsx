import { LogIn } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthCard } from '../components/AuthCard.jsx';
import { useAuth } from '../services/AuthContext.jsx';

export function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login(form.email, form.password);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard title="Welcome back" subtitle="Log in and check this month's numbers.">
      <form className="stack" onSubmit={handleSubmit}>
        <label>
          Email
          <input
            autoComplete="email"
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
          />
        </label>
        <label>
          Password
          <input
            autoComplete="current-password"
            type="password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            required
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button className="primary-button" type="submit" disabled={submitting}>
          <LogIn size={18} />
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
      <p className="auth-switch">
        First time here? <Link to="/register">Create an account</Link>
      </p>
    </AuthCard>
  );
}
