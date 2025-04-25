import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import GameEdit from '../pages/GameEdit';
import { LanguageContext } from '../contexts/LanguageContext';
import * as api from '../services/api';
import { vi } from 'vitest';

const mockGame = {
  id: '1',
  name: 'Sample Game',
  questions: [
    {
      id: 'q1',
      question: 'Sample Question?',
      type: 'single',
      timeLimit: 30,
      points: 10,
      answers: [
        { id: 'a1', answer: 'Answer 1', isCorrect: true },
        { id: 'a2', answer: 'Answer 2', isCorrect: false }
      ]
    }
  ]
};

describe('GameEdit Page', () => {
  beforeEach(() => {
    vi.spyOn(api.gameAPI, 'getGame').mockResolvedValue({ data: mockGame });
    vi.spyOn(api.gameAPI, 'updateGameQuestions').mockResolvedValue({ data: { success: true, game: mockGame } });
  });

  it('renders game title and question list', async () => {
    render(
      <LanguageContext.Provider value={{ t: (k) => k, tf: (k, v) => `${k} ${v}`, language: 'en' }}>
        <MemoryRouter initialEntries={[`/game/${mockGame.id}`]}>
          <GameEdit />
        </MemoryRouter>
      </LanguageContext.Provider>
    );

    expect(await screen.findByText(/Sample Game/i)).toBeInTheDocument();
    expect(await screen.findByText(/Sample Question\?/i)).toBeInTheDocument();
  });

  it('displays no questions message when empty', async () => {
    vi.spyOn(api.gameAPI, 'getGame').mockResolvedValue({ data: { ...mockGame, questions: [] } });

    render(
      <LanguageContext.Provider value={{ t: (k) => k, tf: (k, v) => `${k} ${v}`, language: 'en' }}>
        <MemoryRouter initialEntries={[`/game/${mockGame.id}`]}>
          <GameEdit />
        </MemoryRouter>
      </LanguageContext.Provider>
    );

    expect(await screen.findByText(/noQuestionsYet/i)).toBeInTheDocument();
  });
});