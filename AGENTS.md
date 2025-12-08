# Agent Guidelines for Songs App

## Build/Lint/Test Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Lint with Biome
- `npm run format` - Format with Biome
- `npm run test` - Run all tests with Jest
- `npm run test:watch` - Run tests in watch mode
- `npx jest <file>` - Run single test file
- `npx jest -t "<test name>"` - Run tests matching pattern

## Code Style Guidelines
- **Formatting**: Tabs for indentation, double quotes for JS/TSX
- **TypeScript**: Strict mode enabled, React JSX transform, `@/*` path mapping
- **Imports**: Use `@/` for internal imports, auto-organize with Biome
- **Naming**: PascalCase for components/interfaces, camelCase for functions/hooks/variables, `use*` prefix for hooks
- **Components**: Use `class-variance-authority` for variants, `cn()` utility for class merging, `data-slot` attributes
- **Error Handling**: `try/catch` with `console.error`, detailed error messages in context hooks
- **Performance**: `useCallback` for stable refs, `useMemo` for expensive computations, split contexts to minimize re-renders
- **Testing**: Jest with jsdom, `@testing-library/react`, `user-event`, accessibility-focused queries (`getByRole`)
- **Comments**: JSDoc for interfaces and complex functions, minimal inline comments

## Important Restrictions
- **Never edit, test, or lint the `components/ui` directory** - These are auto-generated UI components that should not be modified