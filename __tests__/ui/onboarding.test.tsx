import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OnboardingPage from '../../app/onboarding/page';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('../../app/hooks/useAuth', () => ({
  useAuth: () => ({
    signIn: vi.fn().mockResolvedValue({ success: true }),
    signUp: vi.fn().mockResolvedValue({ success: true }),
    signOut: vi.fn(),
    user: null,
    session: null,
    loading: false,
    refreshSession: vi.fn(),
  }),
}));

vi.mock('../../app/lib/profile', () => ({
  saveProfile: vi.fn(),
}));

import { saveProfile } from '../../app/lib/profile';

describe('OnboardingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('注册模式下显示用户名输入框', async () => {
    const user = userEvent.setup();
    render(<OnboardingPage />);

    // 切换到注册模式
    await user.click(screen.getByText('注册'));

    // 验证用户名输入框存在
    expect(screen.getByLabelText('用户名')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入用户名')).toBeInTheDocument();
  });

  it('登录模式下不显示用户名输入框', () => {
    render(<OnboardingPage />);

    // 默认为登录模式
    expect(screen.queryByLabelText('用户名')).not.toBeInTheDocument();
  });

  it('注册时缺少用户名显示错误', async () => {
    const user = userEvent.setup();
    render(<OnboardingPage />);

    // 切换到注册模式
    await user.click(screen.getByText('注册'));

    // 填写手机号和密码但不填用户名
    fireEvent.change(screen.getByLabelText('手机号'), { target: { value: '13800138000' } });
    fireEvent.change(screen.getByLabelText('密码'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('确认密码'), { target: { value: 'password123' } });

    // 提交（选择 submit 类型的按钮，避免与 tab 按钮冲突）
    const submitButtons = screen.getAllByRole('button', { name: '注册' });
    const submitBtn = submitButtons.find(btn => btn.getAttribute('type') === 'submit') || submitButtons[submitButtons.length - 1];
    await user.click(submitBtn);

    expect(screen.getByRole('alert')).toHaveTextContent('请输入用户名');
  });
});
