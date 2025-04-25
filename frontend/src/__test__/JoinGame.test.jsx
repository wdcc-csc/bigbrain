import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import JoinGame from '../pages/JoinGame';
import { LanguageContext } from '../contexts/LanguageContext';
import { vi } from 'vitest';
import * as api from '../services/api';

const renderWithProviders = () => {
  const mockLanguage = { language: 'en', setLanguage: vi.fn() };

  render(
    <LanguageContext.Provider value={mockLanguage}>
      <BrowserRouter>
        <JoinGame />
      </BrowserRouter>
    </LanguageContext.Provider>
  );
};

describe('JoinGame Page', () => {
  it('renders session ID and player name input fields', () => {
    renderWithProviders();
    expect(screen.getByLabelText(/session id/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/player name/i)).toBeInTheDocument();
  });

  it('shows error if form submitted empty', () => {
    renderWithProviders();
    const button = screen.getByRole('button', { name: /join game/i });
    fireEvent.click(button);
    expect(screen.getByText(/please enter session id/i)).toBeInTheDocument();
  });

  it('calls joinGame API when form is valid', async () => {
    const mockJoin = vi.spyOn(api.playerAPI, 'joinGame').mockResolvedValue({
      data: { playerId: 123 }
    });

    renderWithProviders();
    fireEvent.change(screen.getByLabelText(/session id/i), { target: { value: 'test-session' } });
    fireEvent.change(screen.getByLabelText(/player name/i), { target: { value: 'Alice' } });
    fireEvent.click(screen.getByRole('button', { name: /join game/i }));

    await waitFor(() => {
      expect(mockJoin).toHaveBeenCalledWith('test-session', 'Alice');
    });

    mockJoin.mockRestore();
  });
});
``
