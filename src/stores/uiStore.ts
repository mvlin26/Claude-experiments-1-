import { create } from 'zustand';

export type Theme = 'dark' | 'light';
export type EditorMode = 'edit' | 'preview' | 'split';
export type SidebarTab = 'files' | 'search' | 'tags' | 'bookmarks';
export type RightPanel = 'none' | 'graph' | 'backlinks' | 'ai';

interface UIStore {
  theme: Theme;
  sidebarOpen: boolean;
  sidebarTab: SidebarTab;
  editorMode: EditorMode;
  rightPanel: RightPanel;
  commandPaletteOpen: boolean;
  searchQuery: string;
  templateModalOpen: boolean;
  importExportOpen: boolean;
  clipperOpen: boolean;

  // Actions
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setSidebarTab: (tab: SidebarTab) => void;
  setEditorMode: (mode: EditorMode) => void;
  setRightPanel: (panel: RightPanel) => void;
  toggleCommandPalette: () => void;
  setSearchQuery: (query: string) => void;
  setTemplateModalOpen: (open: boolean) => void;
  setImportExportOpen: (open: boolean) => void;
  setClipperOpen: (open: boolean) => void;
}

function getInitialTheme(): Theme {
  const stored = localStorage.getItem('notegraph-theme');
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export const useUIStore = create<UIStore>((set) => ({
  theme: getInitialTheme(),
  sidebarOpen: true,
  sidebarTab: 'files',
  editorMode: 'edit',
  rightPanel: 'none',
  commandPaletteOpen: false,
  searchQuery: '',
  templateModalOpen: false,
  importExportOpen: false,
  clipperOpen: false,

  toggleTheme: () =>
    set(s => {
      const next = s.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('notegraph-theme', next);
      return { theme: next };
    }),

  setTheme: (theme) => {
    localStorage.setItem('notegraph-theme', theme);
    set({ theme });
  },

  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarTab: (tab) => set({ sidebarTab: tab, sidebarOpen: true }),
  setEditorMode: (mode) => set({ editorMode: mode }),
  setRightPanel: (panel) => set(s => ({ rightPanel: s.rightPanel === panel ? 'none' : panel })),
  toggleCommandPalette: () => set(s => ({ commandPaletteOpen: !s.commandPaletteOpen })),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setTemplateModalOpen: (open) => set({ templateModalOpen: open }),
  setImportExportOpen: (open) => set({ importExportOpen: open }),
  setClipperOpen: (open) => set({ clipperOpen: open }),
}));
