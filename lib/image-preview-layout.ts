import type { PreviewPanelMode } from '@/lib/mobile-viewport';

export type ImagePreviewLayout = {
  overlayClassName: string;
  shellClassName: string;
  stageClassName: string;
  imageClassName: string;
  asideClassName: string;
  headerClassName: string;
  headerActionsClassName: string;
  floatingControlClassName: string;
  counterClassName: string;
  favoriteButtonClassName: string;
  contentClassName: string;
  metaGridClassName: string;
  quickActionsGridClassName: string;
};

export function getImagePreviewLayout(mode: PreviewPanelMode): ImagePreviewLayout {
  if (mode === 'stacked') {
    return {
      overlayClassName: 'fixed inset-0 z-[1000] overflow-y-auto bg-[#f3f1ed]/95 backdrop-blur-md',
      shellClassName: 'flex min-h-full flex-col',
      stageClassName: 'relative flex min-h-[44vh] items-center justify-center overflow-hidden px-4 pb-4 pt-16 sm:min-h-[52vh] lg:min-h-0 lg:flex-1 lg:px-8 lg:py-8',
      imageClassName: 'max-h-[min(48vh,420px)] w-auto rounded-[28px] border border-black/5 object-contain shadow-[0_40px_90px_-42px_rgba(15,23,42,0.55)] sm:max-h-[calc(100vh-132px)]',
      asideClassName: 'flex w-full shrink-0 flex-col border-t border-black/5 bg-white/88 shadow-[0_-18px_42px_-36px_rgba(15,23,42,0.18)] backdrop-blur-xl',
      headerClassName: 'flex flex-col gap-3 border-b border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-5 lg:px-6',
      headerActionsClassName: 'grid w-full grid-cols-[minmax(0,1fr)_44px] items-center gap-2 sm:flex sm:w-auto',
      floatingControlClassName: 'z-20',
      counterClassName: 'z-20',
      favoriteButtonClassName: 'h-11 w-11 justify-self-end rounded-2xl',
      contentClassName: 'flex-1 overflow-y-auto px-4 pb-5 pt-4 sm:px-5 sm:pb-6 sm:pt-5 lg:px-6',
      metaGridClassName: 'mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2',
      quickActionsGridClassName: 'mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2',
    };
  }

  return {
    overlayClassName: 'fixed inset-0 z-[1000] bg-[#f3f1ed]/95 backdrop-blur-md',
    shellClassName: 'flex h-full flex-col lg:flex-row',
    stageClassName: 'relative flex min-h-[52vh] flex-1 items-center justify-center overflow-hidden px-4 pb-4 pt-16 lg:min-h-0 lg:px-8 lg:py-8',
    imageClassName: 'max-h-[calc(100vh-132px)] w-auto rounded-[28px] border border-black/5 object-contain shadow-[0_40px_90px_-42px_rgba(15,23,42,0.55)]',
    asideClassName: 'flex w-full shrink-0 flex-col border-t border-black/5 bg-white/88 shadow-[-24px_0_64px_-44px_rgba(15,23,42,0.35)] backdrop-blur-xl lg:w-[380px] lg:border-l lg:border-t-0',
    headerClassName: 'flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-5 lg:px-6',
    headerActionsClassName: 'flex items-center gap-2',
    floatingControlClassName: 'z-20',
    counterClassName: 'z-20',
    favoriteButtonClassName: '',
    contentClassName: 'flex-1 overflow-y-auto px-5 pb-6 pt-5 lg:px-6',
    metaGridClassName: 'mt-5 grid grid-cols-2 gap-3',
    quickActionsGridClassName: 'mt-3 grid grid-cols-2 gap-2.5',
  };
}
