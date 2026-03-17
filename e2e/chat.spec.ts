import { test, expect, type Page, type Route } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

const validProfile = {
  role: 'mom',
  dueDate: '2025-12-01',
  createdAt: '2025-03-17T00:00:00.000Z',
};

// ─────────────────────────────────────────────
// 辅助函数：构造孕期助手 SSE 响应
// ─────────────────────────────────────────────
function makeTextStreamBody(text: string, id = 'mock-id-001'): string {
  const sse = (obj: object) => `data: ${JSON.stringify(obj)}\n\n`;
  return [
    sse({ type: 'start' }),
    sse({ type: 'start-step' }),
    sse({ type: 'text-start', id }),
    sse({ type: 'text-delta', delta: text, id }),
    sse({ type: 'text-end', id }),
    sse({ type: 'finish-step' }),
    sse({ type: 'finish' }),
  ].join('');
}

async function interceptChat(page: Page, bodyFn: () => string) {
  await page.route('**/api/chat', async (route: Route) => {
    await route.fulfill({
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'x-vercel-ai-data-stream': 'v1',
      },
      body: bodyFn(),
    });
  });
}

// 设置 localStorage 中的档案
async function setProfile(page: Page, profile = validProfile) {
  await page.addInitScript((p) => {
    localStorage.setItem('pregnancy_profile', JSON.stringify(p));
  }, profile);
}

// 清除 localStorage 档案
async function clearProfile(page: Page) {
  await page.addInitScript(() => {
    localStorage.removeItem('pregnancy_profile');
  });
}

// ─────────────────────────────────────────────
// 7.2 首次访问 / 无档案 → 跳转 /onboarding
// ─────────────────────────────────────────────
test('7.2: 无档案时访问 / 自动跳转到 /onboarding', async ({ page }) => {
  await clearProfile(page);
  await page.goto(BASE_URL);
  await expect(page).toHaveURL(/\/onboarding/, { timeout: 5000 });
  await expect(page.getByText('欢迎使用孕期助手')).toBeVisible();
});

// ─────────────────────────────────────────────
// 7.3 完整 onboarding 流程
// ─────────────────────────────────────────────
test('7.3: Onboarding 完整流程 → 准妈妈 → 预产期 → 提交 → 孕周标签可见', async ({ page }) => {
  await clearProfile(page);
  await page.goto(`${BASE_URL}/onboarding`);

  // 选择准妈妈
  await page.getByText('准妈妈').click();

  // 输入预产期（设置为今天 + 5 个月）
  const due = new Date();
  due.setMonth(due.getMonth() + 5);
  const dueStr = due.toISOString().split('T')[0];
  await page.locator('#dueDate').fill(dueStr);

  // 提交
  await page.getByText('开始使用').click();

  // 跳转到聊天页并显示孕周标签
  await expect(page).toHaveURL(BASE_URL + '/', { timeout: 5000 });
  await expect(page.getByText(/准妈妈 · 孕/)).toBeVisible({ timeout: 5000 });
});

// ─────────────────────────────────────────────
// 7.1 / 7.4 聊天页发送消息 → AI 中文回复
// ─────────────────────────────────────────────
test('7.4: 发送消息后显示用户消息和 AI 中文回复', async ({ page }) => {
  await setProfile(page);
  await interceptChat(page, () => makeTextStreamBody('孕吐是非常正常的孕早期反应，通常在孕12周左右减轻。'));

  await page.goto(BASE_URL);

  const input = page.getByPlaceholder('和我聊聊孕期的问题吧...');
  await expect(input).toBeVisible({ timeout: 5000 });

  await input.fill('孕吐正常吗');
  await input.press('Enter');

  // 用户消息
  await expect(page.locator('.whitespace-pre-wrap').first()).toContainText('用户：');
  await expect(page.locator('.whitespace-pre-wrap').first()).toContainText('孕吐正常吗');

  // AI 中文回复
  await expect(page.locator('.whitespace-pre-wrap').nth(1)).toContainText('AI：', { timeout: 8000 });
  await expect(page.locator('.whitespace-pre-wrap').nth(1)).toContainText('孕吐', { timeout: 8000 });
});

// ─────────────────────────────────────────────
// 已有档案时直接显示聊天页
// ─────────────────────────────────────────────
test('有档案时访问 / 直接显示聊天页和孕周标签', async ({ page }) => {
  await setProfile(page);
  await page.goto(BASE_URL);
  await expect(page.getByText(/准妈妈 · 孕/)).toBeVisible({ timeout: 5000 });
  await expect(page.getByPlaceholder('和我聊聊孕期的问题吧...')).toBeVisible();
});

// ─────────────────────────────────────────────
// 准爸爸档案标签
// ─────────────────────────────────────────────
test('准爸爸档案时显示"准爸爸 · 孕 X 周"标签', async ({ page }) => {
  await setProfile(page, { ...validProfile, role: 'dad' });
  await page.goto(BASE_URL);
  await expect(page.getByText(/准爸爸 · 孕/)).toBeVisible({ timeout: 5000 });
});
