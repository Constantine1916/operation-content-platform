# AI Video Preview Lightbox Design

## Goal

Give the public `/ai-video` waterfall the same click-to-preview experience as `/ai-gallery`, while keeping the existing card layout, hover playback behavior, and guest browsing flow intact.

## Scope

In scope:

- clicking a public AI video card opens a fullscreen preview overlay
- the preview overlay reuses the same visual shell as the existing image preview
- video preview keeps prompt, creator, favorite, download, and metadata actions in the side panel
- image preview keeps its current image-specific transform controls

Out of scope:

- profile video grids and other non-public video surfaces
- changing public card styling beyond wiring the click entry point
- changing existing image preview visuals except the internal refactor needed for shell reuse

## Current Problems

1. `/ai-video` only supports inline hover playback, so users cannot inspect a video in a focused preview.
2. The image preview is implemented as a self-contained component, so reusing its layout for video would currently require duplication.
3. Video download in preview needs the same guest-auth guard behavior as image download, but `/ai-video` does not currently invoke the auth gate for that action.

## Desired Architecture

### 1. Shared media preview shell

Extract the common fullscreen preview chrome into a dedicated shell component responsible for:

- overlay, close button, and explicit z-index
- body scroll locking and keyboard navigation
- previous/next navigation
- creator card, prompt copy action, metadata cards
- favorite button slot and download action

This shell must stay visually aligned with the existing image preview.

### 2. Image and video wrappers

Keep thin media-specific wrappers on top of the shell:

- `ImagePreviewLightbox` adapts gallery images into the shell and preserves transform controls
- `VideoPreviewLightbox` adapts public video items into the shell and renders a video stage with download support

This preserves a clean boundary: common layout in one place, media-specific stage/controls in dedicated wrappers.

### 3. Public AI video page wiring

`PublicAiVideoPage` should mirror `PublicAiGalleryPage` by holding a `selectedPreviewIndex` state, passing the video list into `VideoPreviewLightbox`, and opening the preview when a card is clicked.

The existing masonry layout, hover playback, and filter/load-more behavior must remain unchanged.

## Preview Behavior

### Shared shell behavior

- Clicking outside the panel closes the preview.
- `Escape` closes the preview.
- `ArrowLeft` and `ArrowRight` move between items.
- The side panel remains scrollable on smaller screens.
- Download goes through `beforeDownload` when provided.

### Image mode

- stage remains an image
- download behavior remains unchanged
- image transform actions remain available:
  - zoom in / out
  - rotate left / right
  - flip horizontal / vertical
  - reset view
- metadata remains:
  - size
  - aspect ratio
  - time
  - index

### Video mode

- stage becomes a `<video controls playsInline>` player
- no image transform actions are shown
- download button remains visible
- metadata becomes:
  - model
  - platform
  - time
  - index

## Auth And Access Rules

- guests can open the video preview and browse items
- guests clicking preview download should hit the shared auth gate and open the login/register modal
- favorite actions keep their existing auth behavior
- signed-in users can download directly

## Risks And Constraints

1. Refactoring the existing image preview into a shared shell must not regress the auth modal z-index ordering.
2. Source-based regression tests currently assert on preview file contents, so tests need to move with the shell extraction.
3. Video preview should not accidentally start opening when users click the favorite button or profile link; event propagation must remain stopped for those controls.

## Testing Strategy

1. Add source-level tests proving:
   - `/ai-video` owns preview selection state and renders the preview component
   - the shared shell owns overlay z-index and download guard behavior
   - the image wrapper still exposes transform controls
   - the video wrapper uses the shared shell and renders video-specific metadata
2. Run the focused preview-related tests first for the red/green cycle.
3. Run the full Node test suite.
4. Run TypeScript no-emit verification.

