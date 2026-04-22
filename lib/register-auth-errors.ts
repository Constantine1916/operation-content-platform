type ErrorLike = {
  code?: string | null;
  message?: string | null;
  status?: number | null;
};

type SignUpUserLike = {
  identities?: unknown[] | null;
  role?: string | null;
} | null | undefined;

export type RegisterLookupFailure = {
  status: number;
  message: string;
};

function normalize(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

export function getFriendlyRegisterErrorMessage(
  error: ErrorLike | null | undefined,
): string {
  const code = normalize(error?.code);
  const message = normalize(error?.message);

  if (
    code === 'over_email_send_rate_limit' ||
    message.includes('email rate limit exceeded')
  ) {
    return '当前注册请求较多，请稍后再试。若你刚刚已经提交过注册，也可以先去邮箱查收验证邮件。';
  }

  if (
    message.includes('user already registered') ||
    message.includes('email address already registered')
  ) {
    return '该邮箱已注册，请直接登录，或使用找回密码继续。';
  }

  if (message.includes('invalid login credentials')) {
    return '邮箱或密码不正确，请检查后重试。';
  }

  return error?.message?.trim() || '注册失败，请稍后重试';
}

export function isExistingEmailSignUpResult(
  user: SignUpUserLike,
  session: unknown,
): boolean {
  return Boolean(
    user &&
      !session &&
      Array.isArray(user.identities) &&
      user.identities.length === 0 &&
      normalize(user.role) === '',
  );
}

export function getRegisterUserLookupFailure(
  error: ErrorLike | null | undefined,
  user: unknown,
): RegisterLookupFailure | null {
  if (!error && user) {
    return null;
  }

  const code = normalize(error?.code);
  const message = normalize(error?.message);
  const status = error?.status ?? null;

  if (
    status === 401 ||
    status === 403 ||
    code === 'invalid_api_key' ||
    message.includes('invalid api key')
  ) {
    return {
      status: 500,
      message: '注册服务配置异常，请稍后再试',
    };
  }

  if (status === 404 || code === 'user_not_found' || (!error && !user)) {
    return {
      status: 400,
      message: '用户不存在',
    };
  }

  return {
    status: 500,
    message: '注册服务暂时不可用，请稍后再试',
  };
}
