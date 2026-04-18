# Site H5 Adaptation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every frontend route usable on phone-width viewports without changing any business logic, API behavior, or feature set.

**Architecture:** Keep the existing Next.js App Router structure and data flow intact. Fix the authenticated shell first, then apply mobile-first layout rules page-by-page, and finish by removing hover-only interaction dependencies from cards and preview surfaces.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript, Tailwind CSS, Ant Design, react-masonry-css, node:test

---

## File Structure Map

### Existing files to modify

- `app/globals.css`
- `components/MainLayout.tsx`
- `components/Navbar.tsx`
- `components/Sidebar.tsx`
- `components/AuthLayout.tsx`
- `app/page.tsx`
- `app/login/page.tsx`
- `app/register/page.tsx`
- `app/overview/page.tsx`
- `app/hotspots/page.tsx`
- `app/articles/page.tsx`
- `app/ai-gallery/page.tsx`
- `app/ai-video/page.tsx`
- `app/generate-img/page.tsx`
- `app/md2image/page.tsx`
- `app/profile/page.tsx`
- `app/profile/[username]/page.tsx`
- `app/profile/[username]/ProfileTabs.tsx`
- `app/profile/[username]/ImageGrid.tsx`
- `components/profile/MyAssetsPanel.tsx`
- `components/profile/MyFavoritesPanel.tsx`
- `components/profile/MyUploadsPanel.tsx`
- `components/profile/ProfileSettingsPanel.tsx`
- `components/profile/ProfileContentCards.tsx`
- `components/gallery/ImagePreviewLightbox.tsx`

### New files to create

- `lib/mobile-viewport.test.ts`
- `lib/mobile-viewport.ts`

### Responsibilities

- `lib/mobile-viewport.ts`
  Encapsulate the only JS-only responsive decisions that are not worth duplicating inline: when to treat the UI as touch-first and when the preview panel must stack vertically.

- `components/MainLayout.tsx`, `components/Navbar.tsx`, `components/Sidebar.tsx`
  Define the authenticated shell: drawer on mobile, fixed sidebar on desktop, and a full-width top bar that no longer assumes `left: 16rem` inline styles.

- `app/globals.css`
  Provide global overflow and safe-area guardrails so page-level fixes do not fight the document root.

- Route components under `app/`
  Apply container spacing, column count reductions, wrap behavior, and modal resizing without touching fetch logic or state semantics.

- `components/profile/*` and `components/gallery/ImagePreviewLightbox.tsx`
  Remove hover-only dependencies and make dense profile / preview surfaces readable on touch devices.

## Task 1: Add Mobile Viewport Helpers And Global Guardrails

**Files:**
- Create: `lib/mobile-viewport.ts`
- Test: `lib/mobile-viewport.test.ts`
- Modify: `app/globals.css`

- [ ] **Step 1: Write the failing unit test for touch-first layout decisions**

```ts
import assert from 'node:assert/strict';
import test from 'node:test';

const {
  isTouchFirstViewport,
  getPreviewPanelMode,
} = await import(new URL('./mobile-viewport.ts', import.meta.url).href);

test('treats narrow or non-hover viewports as touch-first', () => {
  assert.equal(isTouchFirstViewport(390, false), true);
  assert.equal(isTouchFirstViewport(820, false), true);
  assert.equal(isTouchFirstViewport(1280, true), false);
});

test('stacks the preview panel below 1024px or when hover is unavailable', () => {
  assert.equal(getPreviewPanelMode(390, false), 'stacked');
  assert.equal(getPreviewPanelMode(1023, true), 'stacked');
  assert.equal(getPreviewPanelMode(1280, true), 'sidebar');
});
```

- [ ] **Step 2: Run the test to confirm the helper does not exist yet**

Run: `node --test lib/mobile-viewport.test.ts`

Expected: FAIL with a module resolution error for `./mobile-viewport.ts`.

- [ ] **Step 3: Add the helper module and global overflow / safe-area protection**

```ts
export type PreviewPanelMode = 'stacked' | 'sidebar';

export function isTouchFirstViewport(viewportWidth: number, canHover: boolean) {
  return viewportWidth < 768 || !canHover;
}

export function getPreviewPanelMode(
  viewportWidth: number,
  canHover: boolean,
): PreviewPanelMode {
  return viewportWidth < 1024 || !canHover ? 'stacked' : 'sidebar';
}
```

```css
html {
  overflow-x: hidden;
}

body {
  min-width: 320px;
  overflow-x: hidden;
}

#__next,
body > div:first-child {
  min-height: 100%;
}

@supports (padding: max(0px)) {
  .safe-bottom {
    padding-bottom: max(1rem, env(safe-area-inset-bottom));
  }
}
```

- [ ] **Step 4: Run the helper test again**

Run: `node --test lib/mobile-viewport.test.ts`

Expected: PASS for both tests.

- [ ] **Step 5: Commit the isolated helper / global guardrail change**

```bash
git add lib/mobile-viewport.ts lib/mobile-viewport.test.ts app/globals.css
git commit -m "refactor: add mobile viewport helpers"
```

## Task 2: Rebuild The Authenticated Shell For Mobile Drawer Navigation

**Files:**
- Modify: `components/MainLayout.tsx`
- Modify: `components/Navbar.tsx`
- Modify: `components/Sidebar.tsx`
- Modify: `components/AuthLayout.tsx`

- [ ] **Step 1: Reproduce the current shell failure in a narrow viewport**

Run: `npm run dev`

Manual check:
- Open `/overview`
- Set the viewport to `390x844`
- Confirm the current navbar still depends on the desktop sidebar offset and the content shell is not truly mobile-first

Expected: the old shell is visibly desktop-oriented.

- [ ] **Step 2: Replace the shell structure so desktop uses sidebar padding and mobile uses a drawer**

```tsx
return (
  <div className="min-h-screen bg-gray-50">
    {sidebarOpen && (
      <button
        type="button"
        aria-label="关闭导航菜单"
        className="fixed inset-0 z-40 bg-black/20 lg:hidden"
        onClick={() => setSidebarOpen(false)}
      />
    )}

    <div
      className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white transition-transform duration-300 lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <Sidebar className="h-full" />
    </div>

    <div className="flex min-h-screen flex-col lg:pl-64">
      <Navbar onMenuClick={() => setSidebarOpen((open) => !open)} />
      <main className="flex-1 pt-16">
        <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-6 lg:py-6">
          {children}
        </div>
      </main>
    </div>
  </div>
);
```

```tsx
<nav className="fixed inset-x-0 top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-md lg:left-64">
  <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
    <div className="flex min-w-0 items-center gap-3">
      <button
        type="button"
        onClick={onMenuClick}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 lg:hidden"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>
      <Link href="/overview" className="flex min-w-0 items-center">
        <Image src="/assets/logo.png" alt="AICAVE" width={140} height={52} className="h-9 w-auto object-contain sm:h-10" />
      </Link>
    </div>
  </div>
</nav>
```

Apply those exact class changes to the existing left wrapper in `components/Navbar.tsx`; keep the current login button / profile dropdown logic untouched on the right side of the same flex row.

```tsx
<header className="sticky top-0 z-40 border-b border-gray-200 bg-white/88 backdrop-blur-md">
  <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6" />
</header>
```

Use that `px-4 sm:px-6` container inside the logged-out public-profile header in `components/AuthLayout.tsx`.

- [ ] **Step 3: Remove desktop-only width assumptions from the sidebar container**

```tsx
<aside className={`flex h-full flex-col border-r border-gray-200 bg-white ${className}`}>
  <div className="flex-1 min-h-0">
    <nav className="flex-1 overflow-y-auto space-y-0.5 px-3 py-6 safe-bottom" />
  </div>
</aside>
```

Keep the current menu groups and stats blocks inside that `nav`; only change the shell element classes and scrolling behavior.

- [ ] **Step 4: Run a build-level verification**

Run: `npm run build`

Expected: PASS with no TypeScript or Tailwind errors.

- [ ] **Step 5: Verify the mobile shell manually**

Manual check:
- `/overview` at `390x844`: drawer opens, overlay closes it, content starts below the top bar, no horizontal scroll
- `/overview` at `1440x900`: desktop sidebar still shows and the top bar aligns to the content area
- `/profile/<username>` while logged out: header has side padding and does not clip on the right edge

- [ ] **Step 6: Commit the shell refactor**

```bash
git add components/MainLayout.tsx components/Navbar.tsx components/Sidebar.tsx components/AuthLayout.tsx
git commit -m "feat: adapt app shell for mobile navigation"
```

## Task 3: Adapt Public, Auth, And Overview Surfaces

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/login/page.tsx`
- Modify: `app/register/page.tsx`
- Modify: `app/overview/page.tsx`
- Modify: `app/profile/[username]/page.tsx`
- Modify: `app/profile/[username]/ProfileTabs.tsx`

- [ ] **Step 1: Reproduce the current overflow and spacing issues**

Manual check:
- `/` at `390x844`: hero typography and section spacing are too desktop-heavy
- `/login` and `/register`: text sizes and card padding consume too much vertical space
- `/overview`: stats cards are still tuned for desktop density
- `/profile/<username>`: header row and tabs need horizontal scrolling or stacking

Expected: at least one of those routes feels cramped or oversized on phone width.

- [ ] **Step 2: Make the landing page sections mobile-first without changing copy or actions**

```tsx
<nav className="fixed inset-x-0 top-0 z-50 bg-[#f8f7f4]/95 backdrop-blur-md">
  <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 sm:px-6 lg:px-8" />
</nav>

<section className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-4 pb-16 pt-24 text-center sm:px-6 sm:pt-28 lg:px-8">
  <div className="absolute inset-0 hidden items-center justify-center pointer-events-none sm:flex" />
</section>

<section className="border-t border-black/[0.06] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
  <div className="mx-auto max-w-[900px]">
    <div className="grid grid-cols-1 divide-y divide-black/[0.06] text-center sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      <StatItem number="2h" label="资讯更新间隔" />
    </div>
  </div>
</section>
```

Apply those exact wrapper-class changes around the existing home-page content blocks. For the three `StatItem` rows, keep all current items and only change the grid container.

- [ ] **Step 3: Tighten the auth pages and overview cards for phone width**

```tsx
<div className="min-h-screen bg-gray-50 px-4 py-8 sm:flex sm:items-center sm:justify-center">
  <div className="w-full max-w-md">
    <div className="mb-8 text-center">
      <h1 className="mb-2 text-2xl font-bold text-black sm:text-3xl">AI树洞</h1>
      <p className="text-sm text-gray-600 sm:text-base">登录您的账户</p>
    </div>

    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8" />
  </div>
</div>
```

Reuse the same outer wrapper pattern for `app/register/page.tsx`; only swap the subtitle and keep the current form fields / submit logic unchanged.

```tsx
<div className="mb-4">
  <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400">内容总量</h2>
  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
    {resources.map((resource) => (
      <ResourceCard key={resource.key} {...resource} />
    ))}
  </div>
</div>
```

- [ ] **Step 4: Stack the public profile header and make tabs scroll safely**

```tsx
<div className="mb-8 border-b border-gray-100 pb-6">
  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
    <div className="min-w-0">
      <h1 className="text-xl font-semibold tracking-tight text-gray-900">{profile.username}</h1>
      {profile.bio && (
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-500">{profile.bio}</p>
      )}
    </div>
  </div>
</div>
```

```tsx
<div className="mb-6 flex gap-0 overflow-x-auto border-b border-gray-100 pb-1">
  {TABS.map((tab) => (
    <button key={tab.key} className="relative shrink-0 px-4 py-2.5 text-sm font-medium">
      {tab.label}
    </button>
  ))}
</div>
```

- [ ] **Step 5: Verify build and phone-width rendering**

Run: `npm run build`

Expected: PASS.

Manual check:
- `/` at `390x844`: no clipped footer or CTA row overflow
- `/login` and `/register`: single-column form, readable labels, no oversize error banners
- `/overview`: cards reflow cleanly
- `/profile/<username>`: header stacks and tabs scroll horizontally inside the component rather than across the whole page

- [ ] **Step 6: Commit the public/auth/overview adaptation**

```bash
git add app/page.tsx app/login/page.tsx app/register/page.tsx app/overview/page.tsx app/profile/[username]/page.tsx app/profile/[username]/ProfileTabs.tsx
git commit -m "feat: adapt public and auth pages for mobile"
```

## Task 4: Adapt Feed Pages And Content Grids

**Files:**
- Modify: `app/hotspots/page.tsx`
- Modify: `app/articles/page.tsx`
- Modify: `app/ai-gallery/page.tsx`
- Modify: `app/ai-video/page.tsx`

- [ ] **Step 1: Reproduce the feed-page issues on phone width**

Manual check:
- `/hotspots`: filter pill group is too tight
- `/articles`: 2-column card grid is too dense on a 390px viewport and the modal header is cramped
- `/ai-gallery` and `/ai-video`: headers and masonry gaps are still desktop-sized

Expected: at least one feed needs either a column reduction or smaller spacing.

- [ ] **Step 2: Make filters and grids wrap or scroll safely on narrow screens**

```tsx
<div className="mb-6 overflow-x-auto pb-1">
  <div className="flex w-max gap-2 rounded-xl bg-gray-100 p-1">
    {([['all', '全部'], ['web', '网站资讯'], ['twitter', 'Twitter']] as [SourceTab, string][])
      .map(([tab, label]) => (
        <button key={tab} className="shrink-0 rounded-lg px-4 py-1.5 text-sm font-medium">
          {label}
        </button>
      ))}
  </div>
</div>
```

```tsx
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
  {articles.map((article) => (
    <div key={article.id} className="flex cursor-pointer flex-col rounded-2xl border border-gray-200 bg-white p-4 transition-all hover:border-gray-500 hover:shadow-md" />
  ))}
</div>
```

Only replace the grid container and card outer class names in `app/articles/page.tsx`; keep the current favorite button, title, preview, and author row logic inside each card.

```tsx
<Masonry
  breakpointCols={{ default: 4, 1280: 4, 1024: 3, 768: 2, 640: 1 }}
  className="flex gap-3 sm:gap-4"
  columnClassName="flex flex-col gap-3 sm:gap-4"
/>
```

Apply that exact gap change to both `app/ai-gallery/page.tsx` and `app/ai-video/page.tsx`.

- [ ] **Step 3: Resize the article modal for phone height and stacked header actions**

```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4 backdrop-blur-sm">
  <div className="flex max-h-[90svh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
    <div className="flex flex-col gap-3 border-b border-gray-200 px-4 pb-4 pt-4 sm:flex-row sm:items-start sm:justify-between sm:px-6 sm:pt-6">
    </div>
  </div>
</div>
```

Keep the current article modal title, metadata, favorite button, copy button, and close button inside that new responsive header wrapper.

- [ ] **Step 4: Verify the feed pages**

Run: `npm run build`

Expected: PASS.

Manual check:
- `/hotspots`: source tabs scroll inside their own row, hotspot cards keep action buttons accessible
- `/articles`: single-column layout on phone, modal closes and scrolls correctly
- `/ai-gallery` and `/ai-video`: no page-level horizontal overflow and masonry still renders

- [ ] **Step 5: Commit the feed-page changes**

```bash
git add app/hotspots/page.tsx app/articles/page.tsx app/ai-gallery/page.tsx app/ai-video/page.tsx
git commit -m "feat: adapt content feeds for mobile"
```

## Task 5: Adapt Tool Pages And Profile Center Layouts

**Files:**
- Modify: `app/generate-img/page.tsx`
- Modify: `app/md2image/page.tsx`
- Modify: `app/profile/page.tsx`
- Modify: `components/profile/MyAssetsPanel.tsx`
- Modify: `components/profile/MyFavoritesPanel.tsx`
- Modify: `components/profile/MyUploadsPanel.tsx`
- Modify: `components/profile/ProfileSettingsPanel.tsx`

- [ ] **Step 1: Reproduce the dense-tooling issues**

Manual check:
- `/generate-img`: top controls, prompt rows, and selection summaries are too dense on phone width
- `/md2image`: option groups need a one-column fallback
- `/profile`: tab rows, panel padding, and form blocks need mobile stacking

Expected: those pages are functional but too compressed for comfortable touch use.

- [ ] **Step 2: Reflow the tool-page control groups into narrow-screen stacks**

```tsx
<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
  <div className="rounded-2xl border border-gray-200 bg-white/90 px-4 py-3 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.25)]" />
</div>
```

```tsx
<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
  <div className="rounded-2xl border border-gray-200 bg-white p-4" />
</div>
```

```tsx
<div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
  <div className="rounded-3xl border border-gray-200 bg-white px-4 py-4 sm:px-6 sm:py-5">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
    </div>
    <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
    </div>
  </div>
</div>
```

- [ ] **Step 3: Make profile panels single-column first and reduce large paddings**

```tsx
<div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">
  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
  </div>
</div>
```

```tsx
<div className="px-4 py-4 sm:px-6 sm:py-6">
  <Masonry breakpointCols={{ default: 4, 1280: 4, 1024: 3, 768: 2, 640: 1 }} className="flex gap-3 sm:gap-4" columnClassName="flex flex-col gap-3 sm:gap-4" />
</div>
```

Apply the `p-4 sm:p-6` and `gap-3 sm:gap-4` reductions to the existing panel wrappers in `components/profile/MyAssetsPanel.tsx`, `components/profile/MyFavoritesPanel.tsx`, and `components/profile/MyUploadsPanel.tsx`.

```tsx
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
  {itemsByTab.articles.map((article) => (
    <ProfileArticleCard key={article.id} article={article} />
  ))}
</div>
```

- [ ] **Step 4: Verify profile center and tool pages**

Run: `npm run build`

Expected: PASS.

Manual check:
- `/generate-img`: prompt inputs remain usable, no horizontal overflow, result cards still selectable
- `/md2image`: configuration groups stack vertically on phone width
- `/profile`: tabs remain scrollable, panel padding is reduced, settings form and upload queue are touch-friendly

- [ ] **Step 5: Commit the tool/profile layout work**

```bash
git add app/generate-img/page.tsx app/md2image/page.tsx app/profile/page.tsx components/profile/MyAssetsPanel.tsx components/profile/MyFavoritesPanel.tsx components/profile/MyUploadsPanel.tsx components/profile/ProfileSettingsPanel.tsx
git commit -m "feat: adapt tools and profile center for mobile"
```

## Task 6: Remove Hover-Only Dependencies From Cards And Preview Surfaces

**Files:**
- Modify: `app/ai-gallery/page.tsx`
- Modify: `app/ai-video/page.tsx`
- Modify: `components/profile/ProfileContentCards.tsx`
- Modify: `app/profile/[username]/ProfileTabs.tsx`
- Modify: `app/profile/[username]/ImageGrid.tsx`
- Modify: `components/gallery/ImagePreviewLightbox.tsx`

- [ ] **Step 1: Reproduce the touch-specific failures**

Manual check:
- `/ai-gallery` and `/ai-video`: prompt/copy affordances are hidden unless hover is available
- profile image and video cards only reveal prompt / copy affordances on hover
- public profile video cards have the same issue
- the preview lightbox information rail is too desktop-oriented on a narrow viewport

Expected: critical card metadata is harder to reach on touch.

- [ ] **Step 2: Make card metadata visible by default on mobile while preserving desktop hover polish**

```tsx
<div className="pointer-events-none absolute inset-0 flex flex-col justify-end rounded-xl bg-gradient-to-t from-black/65 via-black/10 to-transparent p-3">
  <div className="pointer-events-auto opacity-100 transition-opacity duration-200 md:opacity-0 md:group-hover:opacity-100">
    <p className="mb-1.5 line-clamp-3 text-[11px] leading-relaxed text-white/90">{image.prompt}</p>
    <div className="flex justify-between gap-2">
    </div>
  </div>
</div>
```

Use that same `opacity-100 md:opacity-0 md:group-hover:opacity-100` pattern in `app/ai-gallery/page.tsx`, `components/profile/ProfileContentCards.tsx`, and `app/profile/[username]/ImageGrid.tsx`.

```tsx
<div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/65 via-black/10 to-transparent p-3 pointer-events-none">
  <div className="pointer-events-auto mb-2.5 opacity-100 transition-opacity duration-200 md:opacity-0 md:group-hover:opacity-100">
  </div>
</div>
```

Apply that exact visibility change to the main video feed in `app/ai-video/page.tsx` and the public-profile video card in `app/profile/[username]/ProfileTabs.tsx`.

- [ ] **Step 3: Stack the lightbox panel on touch-first viewports**

```tsx
const [previewPanelMode, setPreviewPanelMode] = useState<'stacked' | 'sidebar'>('sidebar');

useEffect(() => {
  const media = window.matchMedia('(hover: hover)');
  const sync = () => {
    setPreviewPanelMode(getPreviewPanelMode(window.innerWidth, media.matches));
  };
  sync();
  window.addEventListener('resize', sync);
  media.addEventListener('change', sync);
  return () => {
    window.removeEventListener('resize', sync);
    media.removeEventListener('change', sync);
  };
}, []);
```

```tsx
<div className={`flex h-full flex-col ${previewPanelMode === 'sidebar' ? 'lg:flex-row' : ''}`}>
  <div className="relative flex min-h-[48svh] flex-1 items-center justify-center overflow-hidden px-3 pb-3 pt-16 sm:px-4 lg:min-h-0 lg:px-8 lg:py-8">
  </div>

  <aside
    className={`flex w-full shrink-0 flex-col border-t border-black/5 bg-white/88 backdrop-blur-xl ${
      previewPanelMode === 'sidebar'
        ? 'lg:w-[380px] lg:border-l lg:border-t-0'
        : 'max-h-[42svh]'
    }`}
  >
  </aside>
</div>
```

Keep the current preview image, download button, favorite button, prompt copy button, author block, and metadata cards; only move them into the stacked-vs-sidebar layout above.

- [ ] **Step 4: Verify touch behavior**

Run: `npm run build`

Expected: PASS.

Manual check:
- `/ai-gallery` and `/ai-video`: prompt/copy affordances are visible on touch and still polished on desktop
- profile image and video cards show prompt/copy affordances at `390x844`
- desktop hover behavior still works at `1440x900`
- lightbox at `390x844` keeps the image visible, stacks metadata below, and preserves close / next / previous buttons

- [ ] **Step 5: Commit the interaction-surface adaptation**

```bash
git add app/ai-gallery/page.tsx app/ai-video/page.tsx components/profile/ProfileContentCards.tsx app/profile/[username]/ProfileTabs.tsx app/profile/[username]/ImageGrid.tsx components/gallery/ImagePreviewLightbox.tsx lib/mobile-viewport.ts lib/mobile-viewport.test.ts
git commit -m "feat: adapt preview and card interactions for touch"
```

## Task 7: Run Full Regression Verification And Final Cleanup

**Files:**
- Modify: `docs/superpowers/specs/2026-04-18-site-h5-adaptation-design.md` only if an implementation-driven clarification is required

- [ ] **Step 1: Run the targeted unit test and full build**

Run: `node --test lib/mobile-viewport.test.ts`

Expected: PASS.

Run: `npm run build`

Expected: PASS.

- [ ] **Step 2: Run a route-by-route phone-width QA pass**

Manual check at `390x844`:
- `/`
- `/login`
- `/register`
- `/overview`
- `/hotspots`
- `/articles`
- `/ai-gallery`
- `/ai-video`
- `/generate-img`
- `/md2image`
- `/profile`
- `/profile/<username>`

Expected on every route:
- no page-level horizontal scroll
- no top bar or drawer overlap that blocks primary actions
- filters, tabs, modals, and preview panels remain operable

- [ ] **Step 3: Run a desktop regression pass**

Manual check at `1440x900`:
- `/overview`
- `/articles`
- `/ai-gallery`
- `/profile`

Expected:
- desktop sidebar remains visible
- masonry layouts still render at desktop density
- hover states still work where they are additive rather than required

- [ ] **Step 4: Commit the verified end state**

```bash
git add -A
git commit -m "feat: complete site h5 adaptation"
```
