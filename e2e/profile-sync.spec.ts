import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

// 测试用户凭证（需要在Supabase中存在）
const TEST_USER = {
  phone: '13800138000',
  password: 'password123',
};

// 辅助函数：登录用户
async function login_user(page) {
  await page.goto(`${BASE_URL}/onboarding`);

  // 等待页面加载
  await expect(page.getByText('欢迎使用孕期助手')).toBeVisible({ timeout: 5000 });

  // 切换到登录表单
  const loginTab = page.getByText('登录');
  if (await loginTab.isVisible()) {
    await loginTab.click();
  }

  // 填写登录信息
  await page.locator('input[name="phone"]').fill(TEST_USER.phone);
  await page.locator('input[name="password"]').fill(TEST_USER.password);

  // 提交登录
  await page.getByRole('button', { name: /登录/ }).click();

  // 等待登录成功，跳转到聊天页面或档案页面
  await page.waitForURL(/\/(\?|profile)/, { timeout: 10000 });
}

// 辅助函数：计算预产期（今天+5个月）
function get_future_date(months = 5) {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date.toISOString().split('T')[0];
}

describe('档案同步 E2E 测试', () => {
  test.beforeEach(async ({ page }) => {
    // 每个测试前确保用户已登录
    await login_user(page);
  });

  test('场景1: 两个浏览器窗口同步档案修改', async ({ browser }) => {
    // 创建两个浏览器上下文（模拟两个窗口）
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    // 窗口A：登录
    await login_user(pageA);
    await pageA.waitForURL(/\/(\?|profile)/);

    // 窗口B：登录（相同用户）
    await login_user(pageB);
    await pageB.waitForURL(/\/(\?|profile)/);

    // 窗口A：进入档案页面
    await pageA.goto(`${BASE_URL}/profile`);
    await expect(pageA.getByText('个人中心')).toBeVisible();

    // 窗口A：点击编辑档案
    await pageA.getByText('编辑档案').click();
    await expect(pageA.getByText('保存')).toBeVisible();

    // 窗口A：修改档案为孕期
    const dueDate = get_future_date(5);
    await pageA.locator('select[name="stage"]').selectOption('pregnancy');
    await pageA.locator('input[name="role"]').selectOption('mom');
    await pageA.locator('input[name="due_date"]').fill(dueDate);

    // 窗口A：保存
    await pageA.getByText('保存').click();

    // 等待保存成功提示
    await expect(pageA.getByText('档案保存成功')).toBeVisible({ timeout: 5000 });

    // 窗口B：刷新页面以获取最新档案（模拟Realtime推送后的状态）
    await pageB.goto(`${BASE_URL}/profile`);
    await expect(pageB.getByText('个人中心')).toBeVisible({ timeout: 5000 });

    // 验证窗口B显示了更新后的档案
    await expect(pageB.getByText(/孕期/)).toBeVisible({ timeout: 5000 });
    await expect(pageB.getByText(/准妈妈/)).toBeVisible();
  });

  test('场景2: 多设备登录后档案同步', async ({ browser }) => {
    // 创建两个浏览器上下文（模拟两个设备）
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    // 设备A：登录并创建档案
    await login_user(pageA);
    await pageA.goto(`${BASE_URL}/profile`);

    // 设备A：创建备孕期档案
    await pageA.getByText('编辑档案').click();
    await pageA.locator('select[name="stage"]').selectOption('preconception');
    await pageA.getByText('保存').click();
    await expect(pageA.getByText('档案保存成功')).toBeVisible();

    // 设备B：使用相同账号登录
    await login_user(pageB);
    await pageB.goto(`${BASE_URL}/profile`);

    // 验证设备B能看到设备A创建的档案
    await expect(pageB.getByText(/备孕期/)).toBeVisible({ timeout: 5000 });

    // 设备B：修改档案为孕期
    const dueDate = get_future_date(6);
    await pageB.getByText('编辑档案').click();
    await pageB.locator('select[name="stage"]').selectOption('pregnancy');
    await pageB.locator('input[name="role"]').selectOption('dad');
    await pageB.locator('input[name="due_date"]').fill(dueDate);
    await pageB.getByText('保存').click();
    await expect(pageB.getByText('档案保存成功')).toBeVisible();

    // 设备A：刷新页面验证能看到更新
    await pageA.goto(`${BASE_URL}/profile`);
    await expect(pageA.getByText(/孕期/)).toBeVisible({ timeout: 5000 });
    await expect(pageA.getByText(/准爸爸/)).toBeVisible();
  });

  test('场景3: 退出登录影响所有窗口', async ({ browser }) => {
    // 创建两个浏览器上下文（模拟两个窗口）
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    // 两个窗口都登录
    await login_user(pageA);
    await pageA.goto(`${BASE_URL}/profile`);
    await expect(pageA.getByText('个人中心')).toBeVisible();

    await login_user(pageB);
    await pageB.goto(`${BASE_URL}/profile`);
    await expect(pageB.getByText('个人中心')).toBeVisible();

    // 窗口A：点击退出登录
    await pageA.getByText('退出登录').click();
    // 确认退出（如果需要确认对话框）
    const confirmButton = pageA.getByText('确认退出');
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }

    // 验证窗口A跳转到onboarding页面
    await expect(pageA).toHaveURL(/\/onboarding/, { timeout: 5000 });
    await expect(pageA.getByText('欢迎使用孕期助手')).toBeVisible();

    // 窗口B：尝试操作，应该被重定向到onboarding
    await pageB.getByText('编辑档案').click();

    // 由于Session失效，页面应该重定向到onboarding
    await expect(pageB).toHaveURL(/\/onboarding/, { timeout: 5000 });
    await expect(pageB.getByText('欢迎使用孕期助手')).toBeVisible();
  });

  test('场景4: 档案实时更新检查', async ({ page }) => {
    // 测试档案修改后立即生效
    await page.goto(`${BASE_URL}/profile`);
    await expect(page.getByText('个人中心')).toBeVisible();

    // 点击编辑
    await page.getByText('编辑档案').click();

    // 修改为备孕期
    await page.locator('select[name="stage"]').selectOption('preconception');
    await page.getByText('保存').click();
    await expect(page.getByText('档案保存成功')).toBeVisible();

    // 验证页面显示正确的档案信息
    await expect(page.getByText(/备孕期/)).toBeVisible();

    // 再次编辑，修改为孕期
    await page.getByText('编辑档案').click();
    const dueDate = get_future_date(7);
    await page.locator('select[name="stage"]').selectOption('pregnancy');
    await page.locator('input[name="role"]').selectOption('mom');
    await page.locator('input[name="due_date"]').fill(dueDate);
    await page.getByText('保存').click();
    await expect(page.getByText('档案保存成功')).toBeVisible();

    // 验证页面已更新
    await expect(page.getByText(/孕期/)).toBeVisible();
    await expect(page.getByText(/准妈妈/)).toBeVisible();
  });

  test('场景5: 并发编辑冲突处理', async ({ browser }) => {
    // 测试两个窗口同时编辑档案的情况
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    // 两个窗口都进入档案页面
    await login_user(pageA);
    await pageA.goto(`${BASE_URL}/profile`);
    await expect(pageA.getByText('个人中心')).toBeVisible();

    await login_user(pageB);
    await pageB.goto(`${BASE_URL}/profile`);
    await expect(pageB.getByText('个人中心')).toBeVisible();

    // 窗口A：开始编辑
    await pageA.getByText('编辑档案').click();
    await pageA.locator('select[name="stage"]').selectOption('preconception');

    // 窗口B：也开始编辑
    await pageB.getByText('编辑档案').click();
    const dueDate = get_future_date(8);
    await pageB.locator('select[name="stage"]').selectOption('pregnancy');
    await pageB.locator('input[name="role"]').selectOption('dad');
    await pageB.locator('input[name="due_date"]').fill(dueDate);

    // 窗口B：先保存
    await pageB.getByText('保存').click();
    await expect(pageB.getByText('档案保存成功')).toBeVisible({ timeout: 5000 });

    // 窗口A：后保存（会覆盖窗口B的修改）
    await pageA.getByText('保存').click();
    await expect(pageA.getByText('档案保存成功')).toBeVisible({ timeout: 5000 });

    // 验证：最后保存的窗口A的值生效
    await pageA.reload();
    await expect(pageA.getByText(/备孕期/)).toBeVisible({ timeout: 5000 });

    // 窗口B刷新后应该显示备孕期（被窗口A覆盖）
    await pageB.goto(`${BASE_URL}/profile`);
    await expect(pageB.getByText(/备孕期/)).toBeVisible({ timeout: 5000 });
  });
});
