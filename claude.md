# NoteGraph - Obsidian Clone

## Project Overview
A full-featured Obsidian-like note-taking application built with React + TypeScript + Vite.

## Architecture
- **Frontend**: React 18 + TypeScript + Vite
- **Editor**: CodeMirror 6 with custom markdown extensions
- **Storage**: IndexedDB via Dexie.js for local-first persistence
- **Graph**: D3.js force-directed graph for note visualization
- **Styling**: CSS Modules with CSS custom properties for theming
- **State**: Zustand for global state management

## Key Features
1. **Markdown Editor** - CodeMirror 6 with live preview, syntax highlighting
2. **File Explorer** - Tree-based folder/file navigation
3. **Wikilinks** - `[[note-name]]` linking with backlink tracking
4. **Graph View** - D3 force-directed graph showing note connections
5. **Command Palette** - Ctrl/Cmd+P quick actions
6. **Full-text Search** - Search across all notes
7. **Daily Notes** - Auto-generated daily journal entries
8. **Tags** - `#tag` parsing with tag cloud view
9. **Templates** - Reusable note templates
10. **Split View** - Editor + live preview side-by-side
11. **X.com Bookmark Clipper** - Paste tweet URLs to clip content
12. **AI Summarizer** - Summarize notes or clipped content
13. **Import/Export** - JSON and Markdown zip export
14. **Theming** - Dark/light mode with system preference detection

## File Structure
```
src/
├── main.tsx                 # App entry
├── App.tsx                  # Root layout
├── stores/                  # Zustand stores
│   ├── noteStore.ts         # Note CRUD, active note, search
│   └── uiStore.ts           # UI state (theme, panels, modals)
├── db/
│   └── database.ts          # Dexie.js IndexedDB schema
├── components/
│   ├── Layout.tsx            # Main app layout
│   ├── Sidebar/
│   │   ├── Sidebar.tsx       # File explorer + search
│   │   └── FolderTree.tsx    # Recursive folder/file tree
│   ├── Editor/
│   │   ├── NoteEditor.tsx    # CodeMirror editor wrapper
│   │   ├── MarkdownPreview.tsx # Rendered markdown preview
│   │   └── SplitView.tsx     # Side-by-side editor+preview
│   ├── GraphView/
│   │   └── GraphView.tsx     # D3 force graph
│   ├── CommandPalette/
│   │   └── CommandPalette.tsx # Ctrl+P command palette
│   ├── DailyNote/
│   │   └── DailyNote.tsx     # Daily note generator
│   ├── Tags/
│   │   └── TagCloud.tsx      # Tag cloud sidebar
│   ├── Templates/
│   │   └── TemplateModal.tsx # Template picker
│   ├── Clipper/
│   │   └── XClipper.tsx      # X.com bookmark clipper
│   ├── AISummarizer/
│   │   └── Summarizer.tsx    # AI summarization panel
│   └── ImportExport/
│       └── ImportExport.tsx  # Import/export dialogs
├── utils/
│   ├── wikilinks.ts          # Parse [[links]] and build backlinks
│   ├── markdown.ts           # Markdown processing utilities
│   ├── search.ts             # Full-text search indexing
│   └── exportImport.ts       # Export/import logic
└── styles/
    ├── globals.css            # CSS custom properties, reset
    ├── themes.css             # Dark/light theme variables
    └── components.css         # Shared component styles
```

## Development Commands
```bash
npm install       # Install dependencies
npm run dev       # Start dev server
npm run build     # Production build
npm run preview   # Preview production build
```

## Conventions
- All components are functional React with hooks
- Use Zustand selectors to avoid unnecessary re-renders
- IndexedDB operations are async - always await them
- Wikilinks use `[[Title]]` syntax, resolved by note title
- Tags use `#tag-name` syntax, parsed from note content
- CSS custom properties for all colors to support theming
