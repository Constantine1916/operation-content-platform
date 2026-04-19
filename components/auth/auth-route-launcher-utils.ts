import type { AuthModalTab } from '@/lib/route-access';

export const AUTH_ROUTE_PATHS = new Set(['/login', '/register']);

export interface AuthRouteLaunchState {
  shouldOpenModal: boolean;
  modalRedirectTo: string | null;
  navigationTarget: string;
}

export interface PostAuthSuccessState {
  shouldResumeAction: boolean;
  navigationTarget: string | null;
}

function normalizeAuthRoutePath(pathname: string) {
  if (pathname.length > 1) {
    return pathname.replace(/\/+$/, '');
  }

  return pathname;
}

function decodePathname(pathname: string) {
  let decoded = pathname;

  for (let index = 0; index < 5; index += 1) {
    try {
      const next = decodeURIComponent(decoded);

      if (next === decoded) {
        return next;
      }

      decoded = next;
    } catch {
      return decoded;
    }
  }

  return decoded;
}

export function getSafeAuthRedirectTo(
  value: string | null,
  origin = 'https://auth-modal.local',
) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return null;
  }

  try {
    const normalizedUrl = new URL(value, origin);
    const decodedPath = decodePathname(normalizedUrl.pathname);
    const normalizedPath = normalizeAuthRoutePath(
      new URL(decodedPath, origin).pathname,
    );

    if (AUTH_ROUTE_PATHS.has(normalizedPath)) {
      return null;
    }

    return `${normalizedPath}${normalizedUrl.search}${normalizedUrl.hash}`;
  } catch {
    return null;
  }
}

export function getAuthRouteLaunchState(input: {
  hasSession: boolean;
  redirectTo: string | null;
}): AuthRouteLaunchState {
  const safeRedirectTo = getSafeAuthRedirectTo(input.redirectTo);

  if (input.hasSession) {
    return {
      shouldOpenModal: false,
      modalRedirectTo: null,
      navigationTarget: safeRedirectTo ?? '/',
    };
  }

  return {
    shouldOpenModal: true,
    modalRedirectTo: safeRedirectTo,
    navigationTarget: '/',
  };
}

export function getPostAuthSuccessState(input: {
  redirectTo: string | null;
  hasResumeAction: boolean;
}): PostAuthSuccessState {
  const safeRedirectTo = getSafeAuthRedirectTo(input.redirectTo);

  return {
    shouldResumeAction: input.hasResumeAction,
    navigationTarget: safeRedirectTo ?? (input.hasResumeAction ? null : '/overview'),
  };
}

export async function executeAuthRouteLaunch(input: {
  defaultTab: AuthModalTab;
  redirectTo: string | null;
  getSession: () => Promise<{ data: { session: unknown } }>;
  openAuthModal: (options: { defaultTab: AuthModalTab; redirectTo: string | null }) => void;
  replace: (target: string) => void;
  shouldContinue?: () => boolean;
}) {
  let session: unknown = null;

  try {
    const result = await input.getSession();
    session = result.data.session;
  } catch {
    session = null;
  }

  const launchState = getAuthRouteLaunchState({
    hasSession: Boolean(session),
    redirectTo: input.redirectTo,
  });

  if (input.shouldContinue && !input.shouldContinue()) {
    return launchState;
  }

  if (launchState.shouldOpenModal) {
    input.openAuthModal({
      defaultTab: input.defaultTab,
      redirectTo: launchState.modalRedirectTo,
    });
  }

  if (input.shouldContinue && !input.shouldContinue()) {
    return launchState;
  }

  input.replace(launchState.navigationTarget);
  return launchState;
}

export async function completePostAuthSuccess(input: {
  redirectTo: string | null;
  resumeAction: (() => void | Promise<void>) | null;
  onClose: () => void;
  push: (target: string) => void;
  refresh: () => void;
}) {
  const successState = getPostAuthSuccessState({
    redirectTo: input.redirectTo,
    hasResumeAction: Boolean(input.resumeAction),
  });

  input.onClose();

  if (successState.shouldResumeAction && input.resumeAction) {
    try {
      await input.resumeAction();
    } catch {}
  }

  if (successState.navigationTarget) {
    input.push(successState.navigationTarget);
  }

  input.refresh();
  return successState;
}
