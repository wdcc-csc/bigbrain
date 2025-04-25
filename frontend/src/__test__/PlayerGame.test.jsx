import { render, screen, waitFor } from '@testing-library/react';
import PlayerGame from '../pages/PlayerGame';
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom';
import { LanguageContext } from '../contexts/LanguageContext';
import * as api from '../services/api';
import { vi } from 'vitest';

vi.mock('../services/api');

const mockUseParams = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => mockUseParams(),
  };
});

const mockQuestion = {
  id: 'q1',
  question: 'What is the capital of France?',
  type: 'single',
  timeLimit: 30,
  answers: [
    { id: '1', answer: 'Paris', isCorrect: true },
    { id: '2', answer: 'London', isCorrect: false },
  ]
};

const renderComponent = (playerId = '123', sessionId = '456') => {
  mockUseParams.mockReturnValue({ playerId });
  localStorage.setItem('sessionId', sessionId);
  localStorage.setItem('playerName', 'TestPlayer');

  return render(
    <LanguageContext.Provider value={{ language: 'en', setLanguage: vi.fn() }}>
      <MemoryRouter initialEntries={[`/play/${playerId}`]}>
        <Routes>
          <Route path="/play/:playerId" element={<PlayerGame />} />
        </Routes>
      </MemoryRouter>
    </LanguageContext.Provider>
  );
};

describe('PlayerGame page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders waiting screen when session has not started', async () => {
    api.playerAPI.getQuestion.mockResolvedValueOnce({ data: { waitingForStart: true } });
    renderComponent();
    await waitFor(() => expect(screen.getByText(/game starting soon/i)).toBeInTheDocument());
  });

  it('redirects when session has ended', async () => {
    const mockNavigate = vi.fn();
    vi.mocked(api.playerAPI.getQuestion).mockResolvedValueOnce({ data: { sessionEnded: true } });
    renderComponent();
    await waitFor(() => {
      expect(screen.queryByText(/game over/i)).not.toBeNull();
    });
  });

  it('renders question when session has question data', async () => {
    api.playerAPI.getQuestion.mockResolvedValueOnce({
      data: {
        question: mockQuestion,
        answerAvailable: false,
        isoTimeLastQuestionStarted: new Date().toISOString()
      }
    });
    renderComponent();
    await waitFor(() => expect(screen.getByText(mockQuestion.question)).toBeInTheDocument());
  });
});
