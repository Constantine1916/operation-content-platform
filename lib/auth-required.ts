export const AUTH_REQUIRED_CODE = 'AUTH_REQUIRED';

export type AuthRequiredResponsePayload = {
  success: false;
  code: typeof AUTH_REQUIRED_CODE;
  message: string;
};

export function isAuthRequiredResponse(
  payload: unknown,
): payload is AuthRequiredResponsePayload {
  return Boolean(
    payload &&
      typeof payload === 'object' &&
      'success' in payload &&
      'code' in payload &&
      'message' in payload &&
      (payload as { success?: boolean }).success === false &&
      (payload as { code?: string }).code === AUTH_REQUIRED_CODE &&
      typeof (payload as { message?: unknown }).message === 'string',
  );
}
