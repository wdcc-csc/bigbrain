import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Navbar from '../components/Navbar';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { LanguageContext } from '../contexts/LanguageContext';

describe('Navbar component', () => {
  const renderWithProviders = (authProps = {}) => {
    const mockAuth = {
      currentUser: { name: 'Test User' },
      isAuthenticated: () => true,
      logout: vi.fn(),
      ...authProps
    };

    render(
      <LanguageContext.Provider value={{ language: 'en' }}>
        <AuthContext.Provider value={mockAuth}>
          <BrowserRouter>
            <Navbar />
          </BrowserRouter>
        </AuthContext.Provider>
      </LanguageContext.Provider>
    );
  };

  it('renders dashboard link and avatar', () => {
    renderWithProviders();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByLabelText(/user menu/i)).toBeInTheDocument();
  });

  it('opens menu when avatar clicked', () => {
    renderWithProviders();
    fireEvent.click(screen.getByLabelText(/user menu/i));
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });
});
