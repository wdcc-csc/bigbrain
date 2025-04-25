import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, vi, expect } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import PlayerResults from '../pages/PlayerResults';
import { LanguageContext } from '../contexts/LanguageContext';

vi.mock('../services/api', () => ({
  playerAPI: {
    getResults: vi.fn(() => Promise.resolve({
      data: {
        answers: [
          {
            questionId: 'q1',
            correct: true,
            score: 10,
            answerTime: 5
          },
          {
            questionId: 'q2',
            correct: false,
            score: 0,
            answerTime: 7
          }
        ]
      }
    }))
  },
  gameAPI: {
    getGame: vi.fn(() => Promise.resolve({
      data: {
        questions: [
          { id: 'q1', points: 10 },
          { id: 'q2', points: 10 }
        ]
      }
    }))
  },
  sessionAPI: {
    getSessionResults: vi.fn(() => Promise.resolve({ data: {} }))
  }
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ playerId: '123' }),
    useNavigate: () => vi.fn()
  };
});

describe('PlayerResults Page', () => {
  it('renders score summary and question list', async () => {
    render(
      <LanguageContext.Provider value={{ language: 'en', setLanguage: vi.fn() }}>
        <BrowserRouter>
          <PlayerResults />
        </BrowserRouter>
      </LanguageContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/total score/i)).toBeInTheDocument();
      expect(screen.getByText(/correct rate/i)).toBeInTheDocument();
      expect(screen.getByText(/answered questions/i)).toBeInTheDocument();
    });
  });
});