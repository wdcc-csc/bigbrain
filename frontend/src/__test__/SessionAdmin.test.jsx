import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SessionAdmin from '../pages/SessionAdmin';
import { LanguageContext } from '../contexts/LanguageContext';
import { vi } from 'vitest';
import * as api from '../services/api';

vi.mock('../services/api');

describe('SessionAdmin Page', () => {
  const mockLanguageContext = {
    language: 'en',
    t: (key) => key,
    tf: (key, ...args) => `${key} ${args.join(' ')}`
  };

  const renderPage = () => {
    render(
      <LanguageContext.Provider value={mockLanguageContext}>
        <BrowserRouter>
          <SessionAdmin />
        </BrowserRouter>
      </LanguageContext.Provider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    api.sessionAPI.getSessionStatus.mockResolvedValue({
      data: {
        results: {
          gameId: '1',
          active: true,
          position: -1,
          players: ['Player1', 'Player2']
        }
      }
    });
    api.gameAPI.getGame.mockResolvedValue({
      data: {
        questions: [
          { id: 'q1', question: 'Q1', points: 10 },
          { id: 'q2', question: 'Q2', points: 10 }
        ]
      }
    });
  });

  it('renders session header and player list', async () => {
    renderPage();

    expect(await screen.findByText(/sessionAdmin/i)).toBeInTheDocument();
    expect(await screen.findByText(/Player1/)).toBeInTheDocument();
    expect(await screen.findByText(/Player2/)).toBeInTheDocument();
  });

  it('displays buttons for controlling the session', async () => {
    renderPage();
    expect(await screen.findByRole('button', { name: /startFirstQuestion/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /endCurrentSession/i })).toBeInTheDocument();
  });

  it('calls advanceGame when advancing question', async () => {
    api.gameAPI.advanceGame.mockResolvedValue({});
    renderPage();
    const advanceBtn = await screen.findByRole('button', { name: /startFirstQuestion/i });
    fireEvent.click(advanceBtn);

    await waitFor(() => {
      expect(api.gameAPI.advanceGame).toHaveBeenCalled();
    });
  });

  it('calls endGame when ending session', async () => {
    api.gameAPI.endGame.mockResolvedValue({});
    renderPage();
    const endBtn = await screen.findByRole('button', { name: /endCurrentSession/i });
    fireEvent.click(endBtn);

    await waitFor(() => {
      expect(api.gameAPI.endGame).toHaveBeenCalled();
    });
  });
});