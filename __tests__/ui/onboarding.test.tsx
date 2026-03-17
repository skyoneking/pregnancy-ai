import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OnboardingPage from '../../app/onboarding/page';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('../../app/lib/profile', () => ({
  saveProfile: vi.fn(),
}));

import { saveProfile } from '../../app/lib/profile';

describe('OnboardingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders role cards and due date input', () => {
    render(<OnboardingPage />);
    expect(screen.getByText('准妈妈')).toBeInTheDocument();
    expect(screen.getByText('准爸爸')).toBeInTheDocument();
    expect(screen.getByLabelText('预产期')).toBeInTheDocument();
  });

  it('highlights the selected role card', async () => {
    const user = userEvent.setup();
    render(<OnboardingPage />);
    const momCard = screen.getByText('准妈妈').closest('button')!;
    await user.click(momCard);
    expect(momCard.className).toContain('border-pink-500');
  });

  it('shows error when submitting without role', async () => {
    const user = userEvent.setup();
    render(<OnboardingPage />);
    await user.click(screen.getByText('开始使用'));
    expect(screen.getByRole('alert')).toHaveTextContent('请选择您的身份');
  });

  it('shows error when submitting without due date', async () => {
    const user = userEvent.setup();
    render(<OnboardingPage />);
    await user.click(screen.getByText('准妈妈'));
    await user.click(screen.getByText('开始使用'));
    expect(screen.getByRole('alert')).toHaveTextContent('请输入预产期');
  });

  it('saves profile and redirects on valid submission', async () => {
    const user = userEvent.setup();
    render(<OnboardingPage />);
    await user.click(screen.getByText('准妈妈'));
    const input = screen.getByLabelText('预产期');
    // Use a future date: today + 5 months
    const future = new Date();
    future.setMonth(future.getMonth() + 5);
    const futureStr = future.toISOString().split('T')[0];
    fireEvent.change(input, { target: { value: futureStr } });
    await user.click(screen.getByText('开始使用'));
    expect(saveProfile).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'mom', dueDate: futureStr }),
    );
    expect(mockPush).toHaveBeenCalledWith('/');
  });
});
