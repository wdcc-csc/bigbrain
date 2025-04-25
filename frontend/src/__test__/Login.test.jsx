import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../pages/Login';
import { AuthContext } from '../contexts/AuthContext';
import { LanguageContext } from '../contexts/LanguageContext';
import { describe, it, expect, vi } from 'vitest';

describe('Login Page', () => {
  const mockLogin = vi.fn();

  const renderLogin = (loginReturn = { success: true }) => {
    mockLogin.mockReset();

    const authMock = {
      login: vi.fn(() => Promise.resolve(loginReturn)),
    };

    const languageMock = {
      language: 'en',
      t: (key) => key, // 简化翻译函数
    };

    render(
      <LanguageContext.Provider value={languageMock}>
        <AuthContext.Provider value={authMock}>
          <BrowserRouter>
            <Login />
          </BrowserRouter>
        </AuthContext.Provider>
      </LanguageContext.Provider>
    );

    return authMock;
  };

  it('renders form fields and button', () => {
    renderLogin();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('displays error when fields are empty', async () => {
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    expect(await screen.findByText(/pleaseAllFields/i)).toBeInTheDocument();
  });

  it('calls login function with correct values', async () => {
    const auth = renderLogin();

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'abc123' } });

    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(auth.login).toHaveBeenCalledWith('test@example.com', 'abc123');
    });
  });

  it('displays login failure message if login fails', async () => {
    const auth = renderLogin({ success: false, message: 'Invalid credentials' });

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'wrong@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpass' } });

    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    expect(await screen.findByText(/Invalid credentials/)).toBeInTheDocument();
  });
});
