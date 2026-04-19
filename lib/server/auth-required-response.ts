import { NextResponse } from 'next/server';

import {
  AUTH_REQUIRED_CODE,
  type AuthRequiredResponsePayload,
} from '@/lib/auth-required';

export function authRequiredResponse(message = '请先登录') {
  const payload: AuthRequiredResponsePayload = {
    success: false,
    code: AUTH_REQUIRED_CODE,
    message,
  };

  return NextResponse.json(
    payload,
    { status: 401 },
  );
}

export function authRequiredError(message = '请先登录') {
  return Object.assign(new Error(message), {
    status: 401,
    code: AUTH_REQUIRED_CODE,
  });
}
