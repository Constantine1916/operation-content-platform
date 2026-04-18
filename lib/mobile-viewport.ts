export type PreviewPanelMode = 'stacked' | 'sidebar';

export function isTouchFirstViewport(viewportWidth: number, canHover: boolean) {
  return viewportWidth < 768 || !canHover;
}

export function getPreviewPanelMode(
  viewportWidth: number,
  canHover: boolean,
): PreviewPanelMode {
  return isTouchFirstViewport(viewportWidth, canHover) ? 'stacked' : 'sidebar';
}
