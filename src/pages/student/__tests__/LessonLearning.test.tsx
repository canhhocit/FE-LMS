import { render, screen, fireEvent, act } from '@testing-library/react';
import LessonLearning from '../LessonLearning';
import * as videoService from '../../services/videoLearningService';
import '@testing-library/jest-dom';

jest.mock('../../services/videoLearningService');

const mockGetProgress = videoService.getProgress as jest.Mock;
const mockUpsertProgress = videoService.upsertProgress as jest.Mock;
const mockGetQuizzes = videoService.getQuizzesForLesson as jest.Mock;

beforeEach(() => {
  jest.useFakeTimers();
  mockGetProgress.mockResolvedValue({ lastWatchedSeconds: 0, maxWatchedSeconds: 0 });
  mockGetQuizzes.mockResolvedValue([
    { id: 1, timestampSeconds: 5, questionText: 'Q?', optionA: 'A', optionB: 'B', optionC: 'C', optionD: 'D', correctAnswer: 'A' }
  ]);
  mockUpsertProgress.mockResolvedValue(undefined);
});

afterEach(() => {
  jest.clearAllMocks();
  jest.useRealTimers();
});

test('syncs progress every 8 seconds', async () => {
  render(<LessonLearning />);
  // Simulate video time updates
  act(() => {
    // advance 9 seconds -> should trigger upsert once
    jest.advanceTimersByTime(9000);
  });
  expect(mockUpsertProgress).toHaveBeenCalledTimes(1);
});

test('shows quiz popup at correct timestamp', async () => {
  render(<LessonLearning />);
  // Simulate video time reaching 5 seconds
  act(() => {
    jest.advanceTimersByTime(5000);
  });
  const popup = await screen.findByText('Câu hỏi trong video');
  expect(popup).toBeInTheDocument();
});
