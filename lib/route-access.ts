export type AuthModalTab = 'login' | 'register';
export type AuthActionKind = 'favorite' | 'download';

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
  return 'register';
}
