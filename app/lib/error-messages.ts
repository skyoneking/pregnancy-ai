/**
 * 友好的错误提示映射
 * 将技术错误转换为用户友好的提示
 */
export const friendlyErrorMessages: Record<string, string> = {
  // 认证相关
  'Invalid login credentials': '手机号或密码错误',
  'Email not confirmed': '邮箱未验证',
  'User already registered': '该手机号已注册',
  'Phone number already registered': '该手机号已注册',
  'Password should be at least 6 characters': '密码至少需要 6 位',
  'Invalid password': '密码错误，请重新输入',

  // 网络相关
  'Failed to fetch': '网络连接失败，请检查网络',
  'NetworkError': '网络错误，请稍后重试',
  'timeout': '请求超时，请稍后重试',

  // 数据库相关
  'PGRST116': '数据不存在',
  '23505': '数据已存在',
  '23503': '相关数据不存在',
  '23502': '必填字段不能为空',

  // 默认错误
  'default': '操作失败，请稍后重试',
};

/**
 * 获取友好的错误提示
 * @param error - 错误对象或错误消息
 * @returns 用户友好的错误提示
 */
export function getFriendlyErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return friendlyErrorMessages[error] || friendlyErrorMessages['default'];
  }

  if (error instanceof Error) {
    // 检查错误消息是否在映射表中
    if (error.message in friendlyErrorMessages) {
      return friendlyErrorMessages[error.message];
    }

    // 检查是否包含特定关键词
    const message = error.message.toLowerCase();
    if (message.includes('network') || message.includes('fetch')) {
      return '网络错误，请稍后重试';
    }
    if (message.includes('timeout')) {
      return '请求超时，请稍后重试';
    }
    if (message.includes('auth') || message.includes('login')) {
      return '认证失败，请重新登录';
    }
  }

  return friendlyErrorMessages['default'];
}

/**
 * 获取 HTTP 状态码对应的友好提示
 * @param status - HTTP 状态码
 * @returns 用户友好的错误提示
 */
export function getHttpStatusMessage(status: number): string {
  const statusMessages: Record<number, string> = {
    400: '请求参数错误',
    401: '未登录或登录已过期',
    403: '无权限操作',
    404: '请求的资源不存在',
    409: '数据冲突',
    429: '操作太频繁，请稍后再试',
    500: '服务器错误，请稍后重试',
    503: '服务暂时不可用',
  };

  return statusMessages[status] || '操作失败，请稍后重试';
}
