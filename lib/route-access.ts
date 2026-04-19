export type AuthModalTab = 'login' | 'register';
export const AUTH_ACTION_KINDS = ['favorite', 'unfavorite', 'download'] as const;
export type AuthActionKind = (typeof AUTH_ACTION_KINDS)[number];

const PUBLIC_APP_PATHS = new Set([
  '/',
  '/overview',
  '/agent',
  '/articles',
  '/hotspots',
  '/ai-video',
  '/ai-gallery',
]);

const PRIVATE_APP_PATHS = new Set([
  '/md2image',
  '/generate-img',
  '/profile',
]);

const AUTH_TAB_BY_ACTION: Record<AuthActionKind, AuthModalTab> = {
  favorite: 'register',
  unfavorite: 'register',
  download: 'register',
};

export function isPublicProfilePath(pathname: string) {
  return /^\/profile\/[^/]+$/.test(pathname);
}

export function isPublicAppPath(pathname: string) {
  return PUBLIC_APP_PATHS.has(pathname) || isPublicProfilePath(pathname);
}

export function isPrivateAppPath(pathname: string) {
  return PRIVATE_APP_PATHS.has(pathname);
}

export function getAuthTabForPrivateRoute(): AuthModalTab {
  return 'login';
}

export function getAuthTabForAction(kind: AuthActionKind): AuthModalTab {
  return AUTH_TAB_BY_ACTION[kind];
}
