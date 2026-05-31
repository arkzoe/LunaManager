# LunaManager

A desktop game library manager built with Electron, Vue 3, and TypeScript. Organize, launch, and track your game collection with metadata from VNDB and Bangumi.

## Features

- **Game Library Management** — Import games from local folders, organize with tags and collections
- **Metadata Scraping** — Fetch game info (title, cover, description, rating) from VNDB and Bangumi APIs
- **Playtime Tracking** — Start/stop play sessions and track total playtime per game
- **Game Launching** — Launch games natively, with Locale Emulator, or with Magpie upscaling
- **Save Snapshots** — Backup and restore game save files
- **Statistics & Rankings** — Charts and rankings based on playtime and ratings
- **Collections** — Create custom collections to organize your library
- **Light & Dark Theme** — Full theme support with system preference detection
- **Auto-Update** — Automatic updates via GitHub Releases

## Tech Stack

| Layer             | Technology                                  |
| ----------------- | ------------------------------------------- |
| Desktop Framework | Electron 39                                 |
| UI Framework      | Vue 3 (Composition API + `<script setup>`)  |
| State Management  | Pinia                                       |
| Build Tooling     | electron-vite, Vite, TypeScript             |
| Styling           | UnoCSS (design tokens, component shortcuts) |
| Database          | better-sqlite3 (SQLite)                     |
| Charts            | Chart.js + vue-chartjs                      |
| Packaging         | electron-builder (Win/Mac/Linux)            |
| Auto-Update       | electron-updater (GitHub)                   |

## Project Setup

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [pnpm](https://pnpm.io/) >= 8

### Install

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

### Type-Checking

```bash
pnpm typecheck
```

### Lint & Format

```bash
pnpm lint
pnpm format
```

### Build for Production

```bash
# Windows
pnpm build:win

# macOS
pnpm build:mac

# Linux
pnpm build:linux
```

## Architecture

The app follows the standard Electron **three-process architecture**:

- **Main Process** (`src/main/`) — Node.js backend: database (SQLite), file I/O, game launching, metadata scraping, IPC handlers
- **Preload** (`src/preload/`) — Secure bridge exposing typed APIs to the renderer via `contextBridge`
- **Renderer** (`src/renderer/`) — Vue 3 SPA: components, views, stores (Pinia), composables

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar)

## License

[GNU General Public License v3.0](./LICENSE)
