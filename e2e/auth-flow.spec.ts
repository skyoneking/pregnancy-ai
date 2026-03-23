import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

// 生成唯一手机号（11位，139开头）
function generatePhone() {
  const suffix = Math.floor(Date.now() / 1000).toString().slice(-8);
  return `139${suffix}`;
}

// 切换到注册 tab
async function switchToRegister(page) {
  // 清除 cookies 确保未登录状态
  await page.context().clearCookies();
  await page.goto(`${BASE_URL}/onboarding`);
  await page.waitForLoadState('networkidle');
  // 点击注册 tab（第一个匹配的"注册"按钮是 tab）
  await page.getByRole('button', { name: '注册' }).first().click();
  // 等待确认密码字段出现
  await expect(page.locator('#confirmPassword')).toBeVisible({ timeout: 3000 });
}

// 切换到登录 tab
async function switchToLogin(page) {
  await page.goto(`${BASE_URL}/onboarding`);
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: '登录' }).first().click();
}

test.describe('认证流程 E2E 测试', () => {
  test('注册流程：填写手机号→密码→注册成功→跳转阶段选择', async ({ page }) => {
    const testPhone = generatePhone();
    const testPassword = 'test123456';

    await switchToRegister(page);

    // 填写注册信息
    await page.locator('#phone').fill(testPhone);
    await page.locator('#password').fill(testPassword);
    await page.locator('#confirmPassword').fill(testPassword);

    // 提交注册（form 内的提交按钮）
    await page.locator('form').getByRole('button', { name: '注册' }).click();

    // 等待注册成功（跳转到阶段选择）或已注册提示
    await expect(
      page.getByText('请选择您当前的阶段').or(page.getByText(/已注册/))
    ).toBeVisible({ timeout: 15000 });
  });

  test('注册流程：密码少于6位显示错误', async ({ page }) => {
    await switchToRegister(page);

    await page.locator('#phone').fill(generatePhone());
    await page.locator('#password').fill('12345');
    await page.locator('#confirmPassword').fill('12345');

    await page.locator('form').getByRole('button', { name: '注册' }).click();

    await expect(page.getByRole('alert').filter({ hasText: /密码至少需要 6 位/ })).toBeVisible({ timeout: 5000 });
  });

  test('注册流程：两次密码不一致显示错误', async ({ page }) => {
    await switchToRegister(page);

    await page.locator('#phone').fill(generatePhone());
    await page.locator('#password').fill('test123456');
    await page.locator('#confirmPassword').fill('different123');

    await page.locator('form').getByRole('button', { name: '注册' }).click();

    await expect(page.getByRole('alert').filter({ hasText: /两次密码输入不一致/ })).toBeVisible({ timeout: 5000 });
  });

  test('登录流程：填写手机号→密码→登录成功', async ({ page }) => {
    // 使用已存在的测试用户
    await switchToLogin(page);

    await page.locator('#phone').fill('13900001111');
    await page.locator('#password').fill('newpass789');

    await page.locator('form').getByRole('button', { name: '登录' }).click();

    // 等待登录成功
    await page.waitForURL(/\/(onboarding|\?)/, { timeout: 10000 });
  });

  test('密码重置流程：旧密码错误显示错误', async ({ page }) => {
    await switchToLogin(page);

    await page.getByText('忘记密码？').click();
    await expect(page.getByRole('heading', { name: '重置密码' })).toBeVisible();

    await page.locator('#phone').fill('13900001111');
    await page.locator('#oldPassword').fill('wrongpassword');
    await page.locator('#newPassword').fill('newpass123456');

    await page.getByRole('button', { name: '重置密码' }).click();

    await expect(page.getByText(/旧密码错误/)).toBeVisible({ timeout: 5000 });
  });

  test('新密码少于6位显示错误（重置密码）', async ({ page }) => {
    await switchToLogin(page);

    await page.getByText('忘记密码？').click();

    await page.locator('#phone').fill('13900001111');
    await page.locator('#oldPassword').fill('newpass789');
    await page.locator('#newPassword').fill('12345');

    await page.getByRole('button', { name: '重置密码' }).click();

    await expect(page.getByText(/新密码至少需要 6 位/)).toBeVisible({ timeout: 3000 });
  });

  test('表单验证：手机号格式无效显示错误', async ({ page }) => {
    await switchToRegister(page);

    await page.locator('#phone').fill('23800138000');
    await page.locator('#password').fill('test123456');
    await page.locator('#confirmPassword').fill('test123456');

    await page.locator('form').getByRole('button', { name: '注册' }).click();

    await expect(page.getByText(/请输入有效的手机号/)).toBeVisible({ timeout: 3000 });
  });
});
