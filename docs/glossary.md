# Glossary

Technical terms and definitions used in the Songs PWA project.

## A

### API (Application Programming Interface)
A set of protocols and tools for building software applications, allowing different systems to communicate. In this project, the API is used to fetch song data from the Saavn API.

### Audio Element
The HTML5 `<audio>` element used for playing audio content. It's controlled via JavaScript in the audio player hooks.

### Autoplay
A feature that automatically starts playing content without user interaction. Browsers have restrictions on autoplay to prevent unwanted audio.

## B

### Blob URL
A URL created from a `Blob` object, used to reference binary data in memory. Used for playing cached audio files without downloading.

### Bundle Analyzer
A tool that analyzes the size and composition of JavaScript bundles, helping identify large dependencies and opportunities for optimization.

## C

### Cache
A storage mechanism that keeps frequently accessed data for faster retrieval. The app uses multiple caching strategies for API responses and downloaded songs.

### Client Component
A React component rendered on the client side (browser), using `"use client"` directive in Next.js.

### Context API
React's state management pattern for sharing data across components without passing props through every level.

### CORS (Cross-Origin Resource Sharing)
A security mechanism that restricts HTTP requests from different origins. The API must properly configure CORS headers.

## D

### DetailedSong
A complete song object containing all metadata including artists, album info, download URLs, etc. Extends the basic `Song` type.

### DnD Kit
A modular toolkit for building drag-and-drop interfaces. Used for the queue reordering feature.

## E

### Entity
A distinct object in the domain model (Song, Album, Artist, Playlist).

### Error Boundary
A React component that catches JavaScript errors anywhere in the child component tree and displays a fallback UI.

## H

### Hook
A React function that lets you use state and other React features. Custom hooks are in the `/hooks/` directory.

### Hydration
The process where React attaches event listeners to the DOM rendered by the server, making the page interactive.

## I

### IndexedDB
A low-level API for client-side storage of significant amounts of structured data, including files/blobs. Used for offline song storage.

### ISR (Incremental Static Regeneration)
A Next.js rendering strategy that allows pages to be updated after they've been built.

## L

### Lazy Loading
A design pattern that defers loading of non-critical resources until needed, improving initial load time.

### Linting
The automated analysis of source code to flag programming errors, bugs, stylistic issues, and suspicious constructs.

## M

### Media Session API
A web API that allows web apps to integrate with the device's media controls (lock screen, notification center, etc.).

### Memoization
An optimization technique that stores the results of expensive function calls and returns the cached result when the same inputs occur again.

## N

### Next.js
A React framework that provides server-side rendering, static site generation, and other optimizations.

### Nullish Coalescing
The `??` operator that returns its right-hand side operand when its left-hand side is `null` or `undefined`.

## O

### Offline First
A design approach that prioritizes offline functionality, assuming the device may have limited or no connectivity.

## P

### PWA (Progressive Web App)
A type of web application that uses modern web capabilities to provide an app-like experience, including offline support and installation.

### Progressive Enhancement
A design philosophy that provides a basic level of functionality to all browsers, with enhanced features for modern browsers.

## Q

### Query Key
A unique identifier used by TanStack React Query to cache and manage query results.

## R

### React Query
A library for managing server state (API data) in React applications, providing caching, refetching, and synchronization.

### Ref (Reference)
A React object that provides access to DOM elements or keeps a mutable value that doesn't trigger re-renders.

### Re-render
When React calls a component function again to update the UI in response to state changes.

### Route Group
A Next.js feature for organizing routes into groups without affecting the URL path.

## S

### Server Component
A React component rendered on the server, default in Next.js App Router.

### Service Worker
A script that runs in the background, enabling features like offline caching and push notifications.

### SSR (Server-Side Rendering)
Rendering React components on the server and sending HTML to the client.

### Stale Time
The duration after data is considered stale in React Query cache, after which it may be refetched.

### Suspense
A React feature that lets components suspend (pause) rendering while waiting for async operations to complete.

## T

### Type Assertion
A way to tell TypeScript the specific type of a value when it can't infer it automatically.

### Type Guard
A function that narrows the type of a value within a conditional block.

## U

### useCallback
A React hook that returns a memoized callback function, stable across renders.

### useEffect
A React hook for side effects in components (data fetching, subscriptions, DOM manipulation).

### useMemo
A React hook that returns a memoized value, only recalculating when dependencies change.

### useRef
A React hook that returns a mutable ref object, persisting for the component's lifetime.

### useState
A React hook for adding state to functional components.

## V

### Virtual DOM
A lightweight copy of the actual DOM that React uses for efficient updates.

## W

### Web Audio API
A high-level JavaScript API for processing and synthesizing audio in web applications.

### Web Workers
Scripts that run in background threads, offloading heavy computations from the main thread.
