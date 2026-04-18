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
