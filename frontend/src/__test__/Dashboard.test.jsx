import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Dashboard from '../pages/Dashboard';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { LanguageContext } from '../contexts/LanguageContext';

const mockAuth = {
  currentUser: { name: 'Test User' },
  isAuthenticated: () => true,
};

const mockLanguage = {
  language: 'en'
};

describe('Dashboard page', () => {
  it('renders Dashboard with My Games and Create New Game', () => {
    render(
      <LanguageContext.Provider value={mockLanguage}>
        <AuthContext.Provider value={mockAuth}>
          <BrowserRouter>
            <Dashboard />
          </BrowserRouter>
        </AuthContext.Provider>
      </LanguageContext.Provider>
    );

    expect(screen.getByText('My Games')).toBeInTheDocument();
    expect(screen.getByText('Create New Game')).toBeInTheDocument();
  });
});
