/**
 * 登录失败限制（防暴力破解）
 * 5 次失败后锁定 15 分钟
 */

interface FailedAttempt {
  count: number;
  lastAttempt: number; // timestamp
  lockedUntil: number | null; // timestamp
}

// 内存存储（生产环境建议使用 Redis）
const failedAttempts = new Map<string, FailedAttempt>();

const MAX_ATTEMPTS = 5;
const LOCK_DURATION = 15 * 60 * 1000; // 15 分钟
const RESET_DURATION = 15 * 60 * 1000; // 15 分钟后自动重置

export function checkLoginAttempts(phone: string): {
  allowed: boolean;
  remainingAttempts?: number;
  lockedUntil?: Date;
  reason?: string;
} {
  const now = Date.now();
  const attempt = failedAttempts.get(phone);

  // 首次尝试或已过期
  if (!attempt || (attempt.lockedUntil && now > attempt.lockedUntil)) {
    failedAttempts.delete(phone);
    return { allowed: true };
  }

  // 已锁定
  if (attempt.lockedUntil && now < attempt.lockedUntil) {
    const remaining = Math.ceil((attempt.lockedUntil - now) / 1000 / 60);
    return {
      allowed: false,
      lockedUntil: new Date(attempt.lockedUntil),
      reason: `登录失败次数过多，请 ${remaining} 分钟后再试`,
    };
  }

  // 检查尝试次数
  if (attempt.count >= MAX_ATTEMPTS) {
    const lockedUntil = now + LOCK_DURATION;
    attempt.lockedUntil = lockedUntil;
    failedAttempts.set(phone, attempt);

    return {
      allowed: false,
      lockedUntil: new Date(lockedUntil),
      reason: '登录失败次数过多，请 15 分钟后再试',
    };
  }

  return {
    allowed: true,
    remainingAttempts: MAX_ATTEMPTS - attempt.count,
  };
}

export function recordFailedAttempt(phone: string): {
  remainingAttempts: number;
  locked?: boolean;
  lockedUntil?: Date;
} {
  const now = Date.now();
  const attempt = failedAttempts.get(phone) || { count: 0, lastAttempt: now, lockedUntil: null };

  // 检查是否需要重置（距离上次尝试超过 15 分钟）
  if (now - attempt.lastAttempt > RESET_DURATION) {
    attempt.count = 0;
  }

  attempt.count += 1;
  attempt.lastAttempt = now;

  // 检查是否需要锁定
  if (attempt.count >= MAX_ATTEMPTS) {
    attempt.lockedUntil = now + LOCK_DURATION;
    failedAttempts.set(phone, attempt);

    return {
      remainingAttempts: 0,
      locked: true,
      lockedUntil: new Date(attempt.lockedUntil),
    };
  }

  failedAttempts.set(phone, attempt);

  return {
    remainingAttempts: MAX_ATTEMPTS - attempt.count,
  };
}

export function resetFailedAttempts(phone: string): void {
  failedAttempts.delete(phone);
}
