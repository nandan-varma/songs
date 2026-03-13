# Songs PWA Documentation

A comprehensive guide to the Songs music streaming Progressive Web App.

## Documentation Structure

### Getting Started

- [Installation](getting-started/installation.md) - Setup and dependencies
- [Quick Start](getting-started/quick-start.md) - Running the development server

### Architecture

- [Overview](architecture/overview.md) - High-level architecture and data flow
- [State Management](architecture/state-management.md) - Context patterns, React Query, persistence
- [Offline Mode](architecture/offline.md) - IndexedDB, Service Worker, caching strategies
- [Audio Player](architecture/audio-player.md) - Audio architecture, hooks, and playback

### Guides

- [Adding Features](guides/adding-features.md) - Step-by-step feature development
- [Debugging](guides/debugging.md) - Debugging techniques and tools
- [Keyboard Shortcuts](guides/keyboard-shortcuts.md) - Available shortcuts and customization

### Reference

- [API](reference/api.md) - External API endpoints and types
- [Components](reference/components.md) - Component patterns and usage
- [Hooks](reference/hooks.md) - Custom hooks reference
- [Contexts](reference/contexts.md) - Context providers reference

### Conventions

- [Code Style](conventions/code-style.md) - TypeScript, React, and formatting guidelines
- [Naming](conventions/naming.md) - File naming and identifier conventions

### Other

- [Glossary](glossary.md) - Technical terms and definitions

## Quick Links

| Topic | Description |
|-------|-------------|
| Tech Stack | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| State | React Context + TanStack Query v5 |
| Storage | IndexedDB for offline, LocalStorage for prefs |
| PWA | Service Worker, Manifest, Install prompts |
| Animation | Motion library with reduced motion support |

## Contributing to Documentation

Documentation is maintained as markdown files in the `docs/` directory. When adding new features:

1. Update relevant documentation files
2. Add new files if needed
3. Run `pnpm lint` to verify markdown formatting
4. Ensure all links are valid
