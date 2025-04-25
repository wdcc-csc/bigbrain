import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import { AuthContext } from '../contexts/AuthContext';

const DummyComponent = () => <div>Protected Content</div>;

describe('ProtectedRoute component', () => {
  const renderWithAuth = ({ isAuthenticated = () => true, loading = false }) => {
    render(
      <AuthContext.Provider value={{ isAuthenticated, loading }}>
        <MemoryRouter initialEntries={['/dashboard']}>
          <ProtectedRoute>
            <DummyComponent />
          </ProtectedRoute>
        </MemoryRouter>
      </AuthContext.Provider>
    );
  };

  it('renders children when authenticated and not loading', () => {
    renderWithAuth({ isAuthenticated: () => true, loading: false });
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('renders nothing when still loading', () => {
    renderWithAuth({ isAuthenticated: () => false, loading: true });
    expect(screen.queryByText('Protected Content')).toBeNull();
  });

  it('redirects to login when not authenticated', () => {
    renderWithAuth({ isAuthenticated: () => false, loading: false });
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});
