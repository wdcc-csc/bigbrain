import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import QuestionEdit from '../pages/QuestionEdit';
import { vi } from 'vitest';

vi.mock('../services/api', () => ({
  gameAPI: {
    getGame: vi.fn(() => Promise.resolve({
      data: {
        id: '1',
        name: 'Test Game',
        questions: [
          {
            id: 'q1',
            question: 'Sample Question',
            type: 'single',
            timeLimit: 30,
            points: 10,
            answers: [
              { id: 'a1', answer: 'Answer 1', isCorrect: true },
              { id: 'a2', answer: 'Answer 2', isCorrect: false }
            ]
          }
        ]
      }
    })),
    updateGameQuestions: vi.fn(() => Promise.resolve({ status: 200 })),
    updateGame: vi.fn(() => Promise.resolve({ data: {} })),
    forceUpdateQuestion: vi.fn(() => Promise.resolve())
  }
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ gameId: '1', questionId: 'q1' }),
    useNavigate: () => vi.fn()
  };
});

vi.mock('../locales/useTranslation', () => () => ({
  t: (key) => key,
  tf: (key, val) => `${key} ${val}`
}));

describe('QuestionEdit page', () => {
  it('renders question edit form with loaded data', async () => {
    render(
      <BrowserRouter>
        <QuestionEdit />
      </BrowserRouter>
    );

    expect(screen.getByText('loading')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByDisplayValue('Sample Question')).toBeInTheDocument();
    });

    expect(screen.getByLabelText('questionType')).toBeInTheDocument();
    expect(screen.getByText('Answer 1')).toBeInTheDocument();
  });

  it('adds a new answer when add button is clicked', async () => {
    render(
      <BrowserRouter>
        <QuestionEdit />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Answer 1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('addAnswer'));

    await waitFor(() => {
      expect(screen.getAllByLabelText(/answer/i)).toHaveLength(3);
    });
  });

  it('shows error if question text is empty when saving', async () => {
    render(
      <BrowserRouter>
        <QuestionEdit />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Sample Question')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('questionText'), { target: { value: '' } });
    fireEvent.click(screen.getByText('saveQuestion'));

    await waitFor(() => {
      expect(screen.getByText('questionRequired')).toBeInTheDocument();
    });
  });
});