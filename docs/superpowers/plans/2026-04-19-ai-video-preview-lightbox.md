# AI Video Preview Lightbox Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add click-to-open preview support to the public AI video waterfall by reusing the existing image preview layout through a shared media preview shell.

**Architecture:** Extract the fullscreen overlay chrome into `MediaPreviewShell`, keep `ImagePreviewLightbox` and `VideoPreviewLightbox` as thin media adapters, then wire `PublicAiVideoPage` to open the shared preview with auth-gated downloads. This keeps image behavior stable while adding the new video entry point with minimal page-level churn.

**Tech Stack:** Next.js App Router, React client components, Tailwind CSS utilities, Node built-in test runner, TypeScript.

---

### Task 1: Lock Preview Wiring And Shell Extraction With Failing Tests

**Files:**
- Create: `components/gallery/MediaPreviewShell.test.ts`
- Create: `components/gallery/VideoPreviewLightbox.test.ts`
- Create: `components/public/PublicAiVideoPage.test.ts`
- Modify: `components/gallery/ImagePreviewLightbox.test.ts`
- Modify: `components/auth/AuthDialog.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
test('public ai video page opens the shared preview lightbox from card clicks', async () => {
  const source = await readFile(new URL('./PublicAiVideoPage.tsx', import.meta.url), 'utf8');

  assert.match(source, /selectedPreviewIndex/);
  assert.match(source, /<VideoPreviewLightbox/);
  assert.match(source, /onOpenPreview=\{\(\) => setSelectedPreviewIndex\(index\)\}/);
});

test('media preview shell owns the shared overlay z-index and download guard', async () => {
  const source = await readFile(new URL('./MediaPreviewShell.tsx', import.meta.url), 'utf8');

  assert.match(source, /className="fixed inset-0 z-\[1000\]/);
  assert.match(source, /if \(beforeDownload && !\(await beforeDownload\(item\)\)\) return/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test components/gallery/MediaPreviewShell.test.ts components/gallery/VideoPreviewLightbox.test.ts components/public/PublicAiVideoPage.test.ts components/gallery/ImagePreviewLightbox.test.ts components/auth/AuthDialog.test.ts`
Expected: FAIL because the shared shell and video preview wrapper do not exist and the video page has no preview state.

- [ ] **Step 3: Write minimal implementation**

```tsx
export default function MediaPreviewShell<T extends MediaPreviewItem>(props: MediaPreviewShellProps<T>) {
  // shared overlay, body scroll lock, keyboard navigation, side panel
}

export default function VideoPreviewLightbox(props: VideoPreviewLightboxProps) {
  return <MediaPreviewShell mediaLabel="视频预览" ... />;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test components/gallery/MediaPreviewShell.test.ts components/gallery/VideoPreviewLightbox.test.ts components/public/PublicAiVideoPage.test.ts components/gallery/ImagePreviewLightbox.test.ts components/auth/AuthDialog.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/gallery/MediaPreviewShell.test.ts components/gallery/VideoPreviewLightbox.test.ts components/public/PublicAiVideoPage.test.ts components/gallery/ImagePreviewLightbox.test.ts components/auth/AuthDialog.test.ts
git commit -m "test: lock shared media preview behavior"
```

### Task 2: Build The Shared Shell And Keep Image Controls Stable

**Files:**
- Create: `components/gallery/MediaPreviewShell.tsx`
- Modify: `components/gallery/ImagePreviewLightbox.tsx`
- Test: `components/gallery/MediaPreviewShell.test.ts`
- Test: `components/gallery/ImagePreviewLightbox.test.ts`

- [ ] **Step 1: Write the failing test**

Use the Task 1 shell tests as the red state, plus the image wrapper regression test that expects transform controls to remain present after extraction.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test components/gallery/MediaPreviewShell.test.ts components/gallery/ImagePreviewLightbox.test.ts`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

```tsx
<MediaPreviewShell
  mediaLabel="图片预览"
  items={shellItems}
  renderStage={({ item }) => <img src={item.mediaUrl} ... />}
  renderQuickActions={() => <ImageTransformButtons ... />}
  getMetaCards={(item, index) => [...]}
/>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test components/gallery/MediaPreviewShell.test.ts components/gallery/ImagePreviewLightbox.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/gallery/MediaPreviewShell.tsx components/gallery/ImagePreviewLightbox.tsx
git commit -m "refactor: extract shared media preview shell"
```

### Task 3: Add The Video Preview Wrapper And Wire `/ai-video`

**Files:**
- Create: `components/gallery/VideoPreviewLightbox.tsx`
- Modify: `components/public/PublicAiVideoPage.tsx`
- Test: `components/gallery/VideoPreviewLightbox.test.ts`
- Test: `components/public/PublicAiVideoPage.test.ts`

- [ ] **Step 1: Write the failing test**

Use the Task 1 red state for the video wrapper and page wiring assertions, including the auth-gated preview download hook.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test components/gallery/VideoPreviewLightbox.test.ts components/public/PublicAiVideoPage.test.ts`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

```tsx
const [selectedPreviewIndex, setSelectedPreviewIndex] = useState<number | null>(null);
const requireAuthForAction = useAuthActionGate();

<VideoCard onOpenPreview={() => setSelectedPreviewIndex(index)} ... />
<VideoPreviewLightbox
  items={videos}
  selectedIndex={selectedPreviewIndex}
  onClose={() => setSelectedPreviewIndex(null)}
  onSelect={setSelectedPreviewIndex}
  beforeDownload={() => requireAuthForAction({ kind: 'download' }).then(Boolean)}
/>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test components/gallery/VideoPreviewLightbox.test.ts components/public/PublicAiVideoPage.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/gallery/VideoPreviewLightbox.tsx components/public/PublicAiVideoPage.tsx
git commit -m "feat: add ai video preview lightbox"
```

### Task 4: Verify The Whole Surface And Push

**Files:**
- Verify only

- [ ] **Step 1: Run focused preview tests**

Run: `node --test components/gallery/MediaPreviewShell.test.ts components/gallery/ImagePreviewLightbox.test.ts components/gallery/VideoPreviewLightbox.test.ts components/public/PublicAiVideoPage.test.ts components/auth/AuthDialog.test.ts`
Expected: PASS

- [ ] **Step 2: Run the full Node test suite**

Run: `npm test`
Expected: PASS

- [ ] **Step 3: Run TypeScript verification**

Run: `npx tsc -p tsconfig.json --noEmit`
Expected: PASS

- [ ] **Step 4: Run production build**

Run: `npm run build`
Expected: PASS in deployment-like environments, or if local environment fails only because required Supabase variables are unavailable, capture the exact failure before pushing.

- [ ] **Step 5: Commit and push**

```bash
git add .
git commit -m "feat: add shared ai video preview lightbox"
git push origin main
```

