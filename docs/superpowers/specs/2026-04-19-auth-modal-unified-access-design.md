# Unified Auth Modal And Public Shell Design

## Goal

Unify unauthenticated browsing and authentication entry across the site so guests can keep the full application chrome, browse all approved public areas, and be prompted with a shared login/register modal only when they try to use gated pages or gated actions.

## Confirmed Product Rules

### Public pages

- `/`
- `/overview`
- `/agent`
- `/articles`
- `/hotspots`
- `/ai-video`
- `/ai-gallery`
- `/profile/[username]`

### Private pages

- `/md2image`
- `/generate-img`
- `/profile`

### Private actions

- favorite / unfavorite
- image download

### Auth modal defaults

- private pages open the auth modal on the `login` tab
- favorite and image download open the auth modal on the `register` tab

### Auth routes

- `/login`
- `/register`

These routes remain available for compatibility and direct links, but the product should stop exposing them as normal navigation destinations. They become wrappers that open the shared auth modal instead of rendering standalone auth screens.

## Current Problems

1. Navigation chrome depends on auth state, so the left sidebar disappears for guests on some routes.
2. Public/private decisions are split across `AuthLayout`, `PrivateAppShell`, route files, and action hooks.
3. Login and registration live in standalone pages, which breaks flow when a user is interrupted by a gated action.
4. Favorite and similar authenticated actions currently handle missing auth locally instead of using a shared product-level entry point.
5. Private routes redirect away immediately instead of using a reusable modal-based recovery path.

## Desired Architecture

### 1. Shared application shell for guests and members

`MainLayout` becomes the default visual shell for both unauthenticated and authenticated users on normal pages. The left sidebar and top navigation stay visible in both states.

This means:

- the sidebar menu structure remains stable regardless of auth state
- public pages render inside the same shell as authenticated pages
- auth state only controls whether a route or action is allowed, not whether the shell exists

### 2. Global auth modal provider

Add a client-side provider near the root layout that owns:

- modal open/close state
- active tab: `login` or `register`
- optional reason for opening the modal
- optional post-auth continuation target
- a small API exposed through context, such as:
  - `openAuthModal({ tab, reason, redirectTo })`
  - `closeAuthModal()`
  - `requireAuth({ tab, redirectTo })`

Every gated interaction should use this provider instead of directly routing to `/login` or `/register`.

### 3. Shared auth dialog

Extract the current login and registration form logic into one reusable modal component with two tabs:

- login form
- registration form

The modal should support:

- opening directly on either tab
- switching between tabs without leaving the page
- preserving current page context while authenticating
- on success:
  - refresh auth-aware UI
  - close the modal
  - continue to the intended page when applicable

### 4. Compatibility auth routes

Keep `/login` and `/register`, but change their responsibility:

- they no longer act as primary standalone auth pages
- they mount the shared auth modal immediately on load
- they open the modal on the matching tab
- they route users back into a public shell context instead of becoming a separate visual experience

This preserves external links, bookmarks, and existing redirects without keeping a second auth UI implementation.

### 5. Explicit route access model

Route access must be centralized around a simple rule set:

- public routes render normally for everyone
- private routes render only for authenticated users
- when a guest enters a private route, the app opens the login modal instead of hard redirecting away immediately

The route guard should be able to distinguish:

- public route request: allow render
- private route request with session: allow render
- private route request without session: block page content and open login modal

## Route Behavior

### Public routes

The following routes remain directly accessible without login:

- `/`
- `/overview`
- `/agent`
- `/articles`
- `/hotspots`
- `/ai-video`
- `/ai-gallery`
- `/profile/[username]`

Guests and signed-in users both see the shared shell here. Public content stays browsable.

### Private routes

The following routes require login:

- `/md2image`
- `/generate-img`
- `/profile`

Guest behavior on these routes:

- keep the normal shell visible
- do not render the private page content itself
- immediately open the auth modal on the `login` tab
- after successful login, continue to the originally requested route

### Profile behavior

- `/profile/[username]` is public and continues to show public profile content
- `/profile` is private and only represents the current signed-in user's personal center

This cleanly separates "my profile center" from "public creator profile".

## Navigation Behavior

### Sidebar

The sidebar should show the same menu structure for guests and signed-in users.

Public items navigate normally for everyone:

- `/`
- `/overview`
- `/agent`
- `/articles`
- `/hotspots`
- `/ai-video`
- `/ai-gallery`

Private items open login modal for guests:

- `/md2image`
- `/generate-img`
- `/profile`

When a signed-in user clicks any private item, navigation proceeds normally.

### Navbar

The navbar should stop using `/login` as its primary login entry. Instead:

- guest login CTA opens the shared auth modal on the `login` tab
- registration affordance inside the modal switches to the `register` tab
- signed-in navbar behavior remains unchanged

## Gated Action Behavior

### Favorites

When a guest tries to favorite or unfavorite content:

- do not keep the optimistic change
- do not only show a toast
- open the shared auth modal on the `register` tab

After successful auth, the app may either:

- re-run the interrupted favorite action automatically, or
- leave the item unchanged and let the user click again

The preferred implementation is to re-run the interrupted action automatically if it can be done safely without duplicated side effects.

### Image download

When a guest tries to download a gated image:

- block the download
- open the shared auth modal on the `register` tab

After successful auth, the app should resume the download if the click context is still available; otherwise it may require a second click. The implementation should prefer correctness over brittle auto-download behavior.

## Backend Auth Error Contract

All protected API endpoints should converge on one unauthenticated response shape:

```json
{
  "success": false,
  "code": "AUTH_REQUIRED",
  "message": "请先登录"
}
```

HTTP status should be `401`.

This contract is required for two reasons:

1. front-end code can reliably distinguish auth problems from normal business errors
2. late auth failures still open the same modal flow even if a page-level check was missed

This contract applies to protected endpoints such as:

- favorites APIs
- profile center APIs
- upload and generation APIs
- any future endpoint that requires the current user

Public read APIs such as public gallery browsing must remain public and must not emit auth-required failures in guest flows.

## Frontend Error Handling

Introduce a shared auth-aware request/error helper that can:

- detect `401 + AUTH_REQUIRED`
- open the auth modal with the right default tab
- keep normal business errors separate from auth errors

Default tab mapping:

- page access errors -> `login`
- favorite/download action errors -> `register`

This helper should be used by:

- favorite hooks
- download handlers
- private page guards
- any authenticated data fetch that can occur after first render

## Component Changes

### `AuthLayout`

Refactor `AuthLayout` from "decide whether shell exists" into "always provide the shared shell, session awareness, and auth modal plumbing".

It should:

- resolve the session
- expose auth state to the tree
- render `MainLayout` for normal app routes
- support public and private route checks
- trigger auth modal for blocked private routes

### `PrivateAppShell`

Refactor or replace `PrivateAppShell` so it no longer hard redirects guests to `/`.

Its new responsibility should be narrow:

- detect whether the current route is private
- if guest, request the login modal and block private content rendering
- if signed in, render children normally

### `Sidebar`

Update menu item definitions to include an access type:

- `public`
- `private`

Guests clicking private items should open the login modal instead of navigating.

### `Navbar`

Replace guest `/login` link behavior with `openAuthModal({ tab: 'login' })`.

### Auth forms

Move existing form logic from `/login` and `/register` pages into reusable components used by the shared modal and compatibility routes.

## Testing Strategy

Add regression tests for:

1. guest shell keeps sidebar/menu visible on public routes
2. `overview` and `agent` are public and no longer depend on `PrivateAppShell`
3. private routes use modal-based auth gating instead of redirect-only behavior
4. guest clicks on private sidebar items open login modal
5. guest favorite action opens register modal
6. guest download action opens register modal
7. `/login` opens shared modal on login tab
8. `/register` opens shared modal on register tab
9. protected API handlers return `401` with `code = AUTH_REQUIRED`

Verification should include:

- focused node tests for changed route and component contracts
- full `npm test`
- production build if local environment permits

## Migration Notes

Implementation should proceed in this order:

1. introduce the shared auth modal provider and dialog
2. convert `/login` and `/register` to compatibility wrappers around the modal
3. refactor shell/layout behavior so guests keep the sidebar
4. make `overview` and `agent` public
5. switch private pages to modal-based guarding
6. update favorite/download flows and backend auth error contract
7. run regression verification and push

## Non-Goals

- redesigning the visual language of the site
- changing Supabase as the auth provider
- opening currently private creation tools to guests
- changing public SEO scope from the previously approved SSR work
