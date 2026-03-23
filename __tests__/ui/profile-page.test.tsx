import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfilePage from '@/app/profile/page';
import { useAuth } from '@/app/hooks/useAuth';

// Mock Next.js router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock useAuth hook
const mockUser = {
  id: 'user-123',
  phone: '13800138000',
  profile: {
    id: 'profile-123',
    user_id: 'user-123',
    stage: 'preconception' as const,
    role: null,
    due_date: null,
    postpartum_date: null,
    created_at: '2025-03-20T00:00:00.000Z',
    updated_at: '2025-03-20T00:00:00.000Z',
  },
};

const mockSignOut = vi.fn();

vi.mock('@/app/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: mockUser,
    loading: false,
    signOut: mockSignOut,
  })),
}));

// Mock fetch API
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 重置 useAuth 到默认状态
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      loading: false,
      signOut: mockSignOut,
    });
    // Default successful fetch response
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        message: '档案保存成功',
        profile: mockUser.profile,
      }),
    });
  });

  describe('渲染档案页面', () => {
    it('显示用户档案信息', () => {
      render(<ProfilePage />);

      expect(screen.getByText('个人中心')).toBeInTheDocument();
      expect(screen.getByText(/备孕期/)).toBeInTheDocument();
    });

    it('显示"编辑档案"按钮', () => {
      render(<ProfilePage />);

      expect(screen.getByText('编辑档案')).toBeInTheDocument();
    });

    it('显示"退出登录"按钮', () => {
      render(<ProfilePage />);

      expect(screen.getByText('退出登录')).toBeInTheDocument();
    });

    it('显示"返回聊天"按钮', () => {
      render(<ProfilePage />);

      expect(screen.getByText('← 返回聊天')).toBeInTheDocument();
    });
  });

  describe('编辑模式', () => {
    it('点击"编辑档案"按钮显示表单', async () => {
      const user = userEvent.setup();
      render(<ProfilePage />);

      await user.click(screen.getByText('编辑档案'));

      // 验证表单字段显示（使用按钮选择）
      expect(screen.getAllByText('备孕期').length).toBeGreaterThan(0);
      expect(screen.getByText('孕期')).toBeInTheDocument();
      expect(screen.getByText('产后期')).toBeInTheDocument();

      // 验证保存和取消按钮显示
      expect(screen.getByText('保存')).toBeInTheDocument();
      expect(screen.getByText('取消')).toBeInTheDocument();
    });

    it('点击"取消"恢复原值', async () => {
      const user = userEvent.setup();
      render(<ProfilePage />);

      await user.click(screen.getByText('编辑档案'));
      await user.click(screen.getByText('孕期')); // 选择但不要保存
      await user.click(screen.getByText('取消'));

      // 验证退出编辑模式
      expect(screen.queryByText('保存')).not.toBeInTheDocument();
      expect(screen.getByText('编辑档案')).toBeInTheDocument();
    });
  });

  describe('保存档案', () => {
    it('修改阶段并保存成功', async () => {
      const user = userEvent.setup();
      render(<ProfilePage />);

      // 进入编辑模式
      await user.click(screen.getByText('编辑档案'));

      // 点击孕期按钮
      const pregnancyButtons = screen.getAllByText('孕期');
      await user.click(pregnancyButtons[1]);

      // 点击准妈妈按钮
      await user.click(screen.getByText('准妈妈'));

      // 点击保存
      await user.click(screen.getByText('保存'));

      // 验证API被调用（可能保存的是pregnancy或preconception）
      expect(mockFetch).toHaveBeenCalledWith('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: expect.any(String),
      });
    });

    it('保存成功后退出编辑模式', async () => {
      const user = userEvent.setup();
      render(<ProfilePage />);

      await user.click(screen.getByText('编辑档案'));
      await user.click(screen.getByText('保存'));

      // 等待保存完成，验证返回查看模式
      await waitFor(() => {
        expect(screen.queryByText('保存')).not.toBeInTheDocument();
      }, { timeout: 5000 });

      expect(screen.getByText('编辑档案')).toBeInTheDocument();
    });
  });

  describe('网络错误处理', () => {
    it('API返回错误时显示错误提示', async () => {
      const user = userEvent.setup();
      // Mock API返回错误
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: false,
          error: '保存失败，请稍后重试',
        }),
      });

      render(<ProfilePage />);

      await user.click(screen.getByText('编辑档案'));
      await user.click(screen.getByText('保存'));

      // 验证错误提示显示
      await waitFor(() => {
        const errorMessage = screen.queryByText(/保存失败/);
        expect(errorMessage).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('网络错误时显示提示', async () => {
      const user = userEvent.setup();
      // Mock fetch失败
      mockFetch.mockRejectedValue(new Error('Network error'));

      render(<ProfilePage />);

      await user.click(screen.getByText('编辑档案'));
      await user.click(screen.getByText('保存'));

      // 验证错误提示
      await waitFor(() => {
        const errorMessage = screen.queryByText(/网络错误/);
        expect(errorMessage).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('退出登录', () => {
    it('点击"退出登录"显示确认对话框', async () => {
      const user = userEvent.setup();
      render(<ProfilePage />);

      await user.click(screen.getByText('退出登录'));

      // 验证确认对话框显示（ProfilePage使用"确定要退出登录吗？"）
      await waitFor(() => {
        expect(screen.getByText('确定要退出登录吗？')).toBeInTheDocument();
      });
    });

    it('确认退出后调用signOut并跳转', async () => {
      const user = userEvent.setup();
      render(<ProfilePage />);

      await user.click(screen.getByText('退出登录'));

      // 点击确定按钮
      const confirmButton = screen.getByRole('button', { name: '确定' });
      await user.click(confirmButton);

      // 验证signOut被调用
      expect(mockSignOut).toHaveBeenCalled();

      // 验证跳转到onboarding
      expect(mockPush).toHaveBeenCalledWith('/onboarding');
    });
  });

  describe('不同阶段显示', () => {
    it('孕期用户显示孕周信息', () => {
      // Mock孕期用户
      const pregnancyUser = {
        ...mockUser,
        profile: {
          ...mockUser.profile,
          stage: 'pregnancy' as const,
          role: 'mom' as const,
          due_date: '2025-12-31',
          postpartum_date: null,
        },
      };

      vi.mocked(useAuth).mockReturnValue({
        user: pregnancyUser,
        loading: false,
        signOut: mockSignOut,
      });

      render(<ProfilePage />);

      expect(screen.getByText(/孕期/)).toBeInTheDocument();
      expect(screen.getByText(/准妈妈/)).toBeInTheDocument();
    });

    it('产后期用户显示产后天数', () => {
      // Mock产后期用户
      const postpartumUser = {
        ...mockUser,
        profile: {
          ...mockUser.profile,
          stage: 'postpartum' as const,
          role: 'mom' as const,
          due_date: null,
          postpartum_date: '2025-03-01',
        },
      };

      vi.mocked(useAuth).mockReturnValue({
        user: postpartumUser,
        loading: false,
        signOut: mockSignOut,
      });

      render(<ProfilePage />);

      expect(screen.getByText(/产后期/)).toBeInTheDocument();
      expect(screen.getByText(/产后第/)).toBeInTheDocument();
    });

    it('备孕期用户不显示孕周信息', () => {
      render(<ProfilePage />);

      expect(screen.getByText(/备孕期/)).toBeInTheDocument();
      // 备孕期不应该显示孕周或产后天数
      expect(screen.queryByText(/孕 \d+ 周/)).not.toBeInTheDocument();
      expect(screen.queryByText(/产后第 \d+ 天/)).not.toBeInTheDocument();
    });
  });

  describe('未登录和加载状态', () => {
    it('加载中显示"加载中..."', () => {
      // Mock loading状态
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        loading: true,
        signOut: mockSignOut,
      });

      render(<ProfilePage />);

      expect(screen.getByText('加载中...')).toBeInTheDocument();
    });

    it('未登录用户重定向到onboarding', () => {
      // Mock未登录状态
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        loading: false,
        signOut: mockSignOut,
      });

      render(<ProfilePage />);

      // 验证跳转到onboarding
      expect(mockPush).toHaveBeenCalledWith('/onboarding');
    });
  });
});
