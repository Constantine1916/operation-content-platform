export const AUTH_REQUIRED_CODE = 'AUTH_REQUIRED';

export type AuthRequiredResponsePayload = {
  success: false;
  code: typeof AUTH_REQUIRED_CODE;
  message: string;
};

export type AuthRequiredResult = {
  status: 401;
  payload: AuthRequiredResponsePayload;
};

type AuthRequiredResponseLike = {
  status: number;
  json: () => Promise<unknown>;
  clone?: () => AuthRequiredResponseLike;
};

type AuthRequiredPayloadInput = {
  status: number;
  payload: unknown;
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

function hasStatus(value: unknown): value is { status: number } {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'status' in value &&
      typeof (value as { status?: unknown }).status === 'number',
  );
}

function hasPayload(value: unknown): value is AuthRequiredPayloadInput {
  return Boolean(
    hasStatus(value) &&
      'payload' in value,
  );
}

function hasJson(value: unknown): value is AuthRequiredResponseLike {
  return Boolean(
    hasStatus(value) &&
      'json' in value &&
      typeof (value as { json?: unknown }).json === 'function',
  );
}

export async function normalizeAuthRequiredResult(
  input: unknown,
): Promise<AuthRequiredResult | null> {
  if (!hasStatus(input) || input.status !== 401) {
    return null;
  }

  if (hasPayload(input)) {
    return isAuthRequiredResponse(input.payload)
      ? { status: 401, payload: input.payload }
      : null;
  }

  if (!hasJson(input)) {
    return null;
  }

  try {
    const payload = await (input.clone?.() ?? input).json();
    return isAuthRequiredResponse(payload)
      ? { status: 401, payload }
      : null;
  } catch {
    return null;
  }
}
