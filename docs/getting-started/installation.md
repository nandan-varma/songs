# Installation

## Prerequisites

- **Node.js**: Version 18 or higher
- **pnpm**: Package manager (recommended over npm/yarn)
- **Browser**: Modern browser with IndexedDB and Service Worker support

## Supported Platforms

- **Desktop**: Chrome, Firefox, Safari, Edge (latest versions)
- **Mobile**: Chrome Mobile, Safari iOS, Samsung Internet
- **PWA**: Installable on iOS, Android, and desktop browsers

## Installation Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd songs
```

### 2. Install Dependencies

```bash
pnpm install
```

This installs all dependencies from `package.json`:

| Category | Dependencies |
|----------|--------------|
| Framework | next: 16.1.1, react: 19.2.3, react-dom: 19.2.3 |
| Styling | tailwindcss: 4.1.18, @radix-ui/*: multiple components |
| State | @tanstack/react-query: 5.90.19 |
| Animation | motion: 12.29.0 |
| Utilities | lucide-react: 0.562.0, sonner: 2.0.7, zod: 4.3.6 |
| Drag-drop | @dnd-kit/*: 6.x |
| URL State | nuqs: 2.8.6 |

### 3. Environment Configuration

Create a `.env.local` file for local development:

```bash
cp .env.example .env.local
```

The app uses external API by default. Configure if needed:

```env
NEXT_PUBLIC_API_URL=https://your-api-endpoint.com/api
```

### 4. Run Development Server

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`

## Build Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server with hot reload |
| `pnpm build` | Create production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run Biome linter |
| `pnpm format` | Format code with Biome |
| `pnpm analyze` | Analyze bundle size (requires ANALYZE=true) |
| `pnpm analyze:turbopack` | Analyze with Turbopack |

## Development Tools

### TypeScript

The project uses TypeScript 5.9.3 with strict mode enabled. All code must be type-safe.

### Biome Linting

Biome 2.3.11 is configured for:
- Code formatting (tabs, double quotes, semicolons)
- Linting rules
- Import organization

Run linting:

```bash
pnpm lint          # Check for issues
pnpm lint --write  # Auto-fix issues
```

Run formatting:

```bash
pnpm format        # Check formatting
pnpm format --write # Auto-format
```

## Project Structure

```
songs/
├── app/              # Next.js App Router
├── components/       # React components
├── contexts/         # React Context providers
├── hooks/            # Custom React hooks
├── lib/              # Utilities and helpers
├── types/            # TypeScript types
├── docs/             # Documentation
├── public/           # Static assets
├── biome.json        # Biome configuration
├── next.config.ts    # Next.js configuration
├── tailwind.config.ts # Tailwind configuration
└── tsconfig.json     # TypeScript configuration
```

## Verifying Installation

After running `pnpm dev`, verify the app works:

1. Open http://localhost:3000
2. Check browser console for errors
3. Test audio playback with a song search
4. Verify PWA install prompt appears (optional)

## Common Issues

### Port Already in Use

```bash
# Use a different port
pnpm dev --port 3001
```

### Dependencies Not Installing

```bash
# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### TypeScript Errors

```bash
# Type-check only
pnpm tsc --noEmit
```

### PWA Not Working

Ensure HTTPS is enabled (required for Service Workers):
- Use `localhost` for development
- Use HTTPS in production
