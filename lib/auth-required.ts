export const AUTH_REQUIRED_CODE = 'AUTH_REQUIRED';

export function isAuthRequiredResponse(payload: unknown) {
  return Boolean(
    payload &&
      typeof payload === 'object' &&
      'code' in payload &&
      (payload as { code?: string }).code === AUTH_REQUIRED_CODE,
  );
}
