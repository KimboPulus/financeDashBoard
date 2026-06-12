import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Login } from './Login.jsx';
import { Register } from './Register.jsx';

const auth = vi.hoisted(() => ({
  login: vi.fn(),
  register: vi.fn()
}));

vi.mock('../services/AuthContext.jsx', () => ({
  useAuth: () => auth
}));

function renderPage(page) {
  return render(<MemoryRouter>{page}</MemoryRouter>);
}

describe('authentication forms', () => {
  beforeEach(() => {
    auth.login.mockReset();
    auth.register.mockReset();
  });

  it('submits login credentials', async () => {
    auth.login.mockResolvedValueOnce();
    const user = userEvent.setup();

    renderPage(<Login />);

    await user.type(screen.getByLabelText('Email'), 'max@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(auth.login).toHaveBeenCalledWith('max@example.com', 'password123');
    });
  });

  it('shows the API message when login fails', async () => {
    auth.login.mockRejectedValueOnce({
      response: { data: { message: 'Wrong email or password.' } }
    });
    const user = userEvent.setup();

    renderPage(<Login />);

    await user.type(screen.getByLabelText('Email'), 'max@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrong-password');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Wrong email or password.')).toBeInTheDocument();
  });

  it('submits a new account', async () => {
    auth.register.mockResolvedValueOnce();
    const user = userEvent.setup();

    renderPage(<Register />);

    await user.type(screen.getByLabelText('Name'), 'Max');
    await user.type(screen.getByLabelText('Email'), 'max@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Create my account' }));

    await waitFor(() => {
      expect(auth.register).toHaveBeenCalledWith('Max', 'max@example.com', 'password123');
    });
  });

  it('shows the API message when registration fails', async () => {
    auth.register.mockRejectedValueOnce({
      response: { data: { message: 'That email is already registered.' } }
    });
    const user = userEvent.setup();

    renderPage(<Register />);

    await user.type(screen.getByLabelText('Name'), 'Max');
    await user.type(screen.getByLabelText('Email'), 'max@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Create my account' }));

    expect(await screen.findByText('That email is already registered.')).toBeInTheDocument();
  });
});
