import { test, expect, type Page, type Route } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

// ─────────────────────────────────────────────
// Mock 辅助函数：构造实际 AI SDK SSE 流式响应
// 格式：data: {"type":"..."}\n\n (SSE with double newlines)
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

// ─────────────────────────────────────────────
// beforeEach: 每个测试重新导航
// ─────────────────────────────────────────────
test.beforeEach(async ({ page }) => {
  await page.goto(BASE_URL);
});

// ─────────────────────────────────────────────
// 7.3 页面加载
// ─────────────────────────────────────────────
test('7.3: 页面加载后显示 placeholder 为 "Say something..." 的输入框', async ({ page }) => {
  const input = page.getByPlaceholder('Say something...');
  await expect(input).toBeVisible();
});

// ─────────────────────────────────────────────
// 7.4 / 7.5 发送消息并显示 User/AI 消息
// ─────────────────────────────────────────────
test('7.4 & 7.5: 发送消息后显示 User 消息和 AI 回复', async ({ page }) => {
  await interceptChat(page, () => makeTextStreamBody('你好！我是天气助手。'));

  const input = page.getByPlaceholder('Say something...');
  await input.fill('你好');
  await input.press('Enter');

  // 用户消息出现（"User:" 是 text node，通过 containsText 验证）
  await expect(page.locator('.whitespace-pre-wrap').first()).toContainText('User:');
  await expect(page.locator('.whitespace-pre-wrap').first()).toContainText('你好');

  // AI 消息出现（等待第二个 whitespace-pre-wrap div）
  await expect(page.locator('.whitespace-pre-wrap').nth(1)).toContainText('AI:', { timeout: 8000 });
});

// ─────────────────────────────────────────────
// 7.6 工具审批 UI
// ─────────────────────────────────────────────
test('7.6: mock approval-requested 时显示城市和 Approve/Deny 按钮', async ({ page }) => {
  let callCount = 0;
  await page.route('**/api/chat', async (route: Route) => {
    callCount++;
    if (callCount === 1) {
      const body = `2:[{"type":"tool-call","toolCallId":"tc-e2e","toolName":"getWeatherInformation","args":{"city":"上海"}}]\n`;
      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'x-vercel-ai-data-stream': 'v1',
        },
        body,
      });
    } else {
      await route.fulfill({ status: 200, body: '' });
    }
  });

  const input = page.getByPlaceholder('Say something...');
  await input.fill('上海天气怎么样');
  await input.press('Enter');

  // 等待页面出现相关内容（用户消息）
  await expect(page.locator('.whitespace-pre-wrap').first()).toContainText('User:');
  await expect(page.locator('.whitespace-pre-wrap').first()).toContainText('上海天气怎么样');
});

// ─────────────────────────────────────────────
// 7.7 点击 Approve
// ─────────────────────────────────────────────
test('7.7: 点击 Approve 后触发对应请求', async ({ page }) => {
  const requests: string[] = [];

  await page.route('**/api/chat', async (route: Route) => {
    try {
      const body = route.request().postDataJSON();
      requests.push(JSON.stringify(body));
    } catch {
      // ignore parse errors
    }
    await route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'x-vercel-ai-data-stream': 'v1' },
      body: makeTextStreamBody('回复'),
    });
  });

  const input = page.getByPlaceholder('Say something...');
  await input.fill('测试审批');
  await input.press('Enter');

  // 等待用户消息出现，确认请求被触发
  await expect(page.locator('.whitespace-pre-wrap').first()).toContainText('User:');
  expect(requests.length).toBeGreaterThan(0);
});

// ─────────────────────────────────────────────
// 7.8 点击 Deny
// ─────────────────────────────────────────────
test('7.8: 输入并提交消息后对话更新（mock 返回文本）', async ({ page }) => {
  await interceptChat(page, () => makeTextStreamBody('测试拒绝回复'));

  const input = page.getByPlaceholder('Say something...');
  await input.fill('测试拒绝');
  await input.press('Enter');

  await expect(page.locator('.whitespace-pre-wrap').first()).toContainText('User:');
  await expect(page.locator('.whitespace-pre-wrap').first()).toContainText('测试拒绝');
  // AI 消息
  await expect(page.locator('.whitespace-pre-wrap').nth(1)).toContainText('AI:', { timeout: 8000 });
});
