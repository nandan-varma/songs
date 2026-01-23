# Debugging

Techniques and tools for debugging the Songs PWA.

## Browser DevTools

### Console

```javascript
// Log current playback state
console.log("Current song:", currentSong);
console.log("Is playing:", isPlaying);
console.log("Current time:", currentTime);

// Log audio element state
console.log("Audio src:", audioRef.current?.src);
console.log("Audio paused:", audioRef.current?.paused);
console.log("Audio readyState:", audioRef.current?.readyState);

// Log context state
console.log("Queue:", queue);
console.log("Current index:", currentIndex);
```

### Network Tab

- Check API requests/responses
- Verify correct endpoints are called
- Check request/response headers
- Monitor response times

### Application Tab

- Check IndexedDB contents
- Verify local storage
- Monitor Service Worker status
- Check Cache Storage

### React Developer Tools

#### Components Tab

- View component hierarchy
- Inspect props and state
- Trace re-renders
- Profile performance

#### Profiler Tab

- Record performance profiles
- Identify re-render causes
- Measure render times

## Common Issues

### Audio Not Playing

```javascript
// Check audio element state
audioRef.current.src;           // Is src set?
audioRef.current.paused;        // Is it paused?
audioRef.current.readyState;    // Is it ready? (4 = HAVE_ENOUGH_DATA)
audioRef.current.error;         // Any errors?

// Check browser autoplay policy
console.log("Autoplay allowed:",
	audioRef.current?.play().catch(e => e) !== "NotAllowedError"
);
```

### Context Not Updating

```javascript
// Check context value
console.log("Context value:", contextValue);

// Check if provider is wrapped correctly
// Look for missing providers in component tree

// Verify dependencies in useEffect/hooks
console.log("Effect dependencies:", deps);
```

### API Calls Failing

```javascript
// Check response
const response = await fetch(url);
console.log("Response status:", response.status);
console.log("Response ok:", response.ok);

// Check error
try {
	await fetch(url);
} catch (error) {
	console.error("Fetch error:", error);
}
```

### IndexedDB Issues

```javascript
// Open IndexedDB console
const db = await openDB("songs-db", 1);
console.log("DB:", db);

// List all stores
console.log("Stores:", db.objectStoreNames);

// Check specific store
const tx = db.transaction("songs", "readonly");
const store = tx.objectStore("songs");
const songs = await store.getAll();
console.log("Cached songs:", songs);
```

## Debugging Techniques

### Conditional Logging

```typescript
const DEBUG = process.env.NODE_ENV === "development";

function logState(label: string, state: any) {
	if (DEBUG) {
		console.log(`[${label}]`, state);
	}
}

logState("Playback", { currentSong, isPlaying, currentTime });
```

### Redux DevTools-like Logging

```typescript
function createLogger(reducer: Reducer) {
	return (state: State, action: Action) => {
		const nextState = reducer(state, action);
		console.groupCollapsed(action.type);
		console.log("Prev state:", state);
		console.log("Action:", action);
		console.log("Next state:", nextState);
		console.groupEnd();
		return nextState;
	};
}
```

### Performance Monitoring

```typescript
function measureRender(name: string, Component: ComponentType) {
	return function MeasuredComponent(props: Props) {
		const start = performance.now();
		const result = useElementRef.current ? (
			<Component {...props} />
		) : null;
		const end = performance.now();

		if (end - start > 16) {
			console.warn(`${name} took ${end - start}ms to render`);
		}

		return result;
	};
}
```

## Logging Best Practices

### Use Appropriate Log Levels

```typescript
// Error - something failed
console.error("Failed to load song:", error);

// Warning - something unexpected but recoverable
console.warn("Slow API response:", duration);

// Info - important state changes
console.info("Playing song:", song.name);

// Debug - detailed state for debugging
console.debug("Audio state:", audioState);
```

### Avoid Logging Sensitive Data

```typescript
// BAD - logs user credentials
console.log("User login:", { email: user.email, password: user.password });

// GOOD - logs without sensitive data
console.log("User login:", { userId: user.id, email: user.email });
```

### Use Structured Logging

```typescript
const log = {
	info: (message: string, data?: object) => {
		console.log(JSON.stringify({
			level: "info",
			message,
			data,
			timestamp: new Date().toISOString(),
		}));
	},
	error: (message: string, error?: Error) => {
		console.error(JSON.stringify({
			level: "error",
			message,
			error: error?.message,
			stack: error?.stack,
			timestamp: new Date().toISOString(),
		}));
	},
};
```

## Testing in Production-like Environment

### Staging Build

```bash
# Build with production settings
NODE_ENV=production pnpm build

# Preview production build
pnpm start
```

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_DEBUG=true
```

### Debug Mode Toggle

```typescript
// components/debug-toggle.tsx
import { useState, useEffect } from "react";

export function DebugToggle() {
	const [debug, setDebug] = useState(false);

	useEffect(() => {
		if (typeof window !== "undefined") {
			setDebug(localStorage.getItem("debug") === "true");
		}
	}, []);

	const toggle = () => {
		const newValue = !debug;
		setDebug(newValue);
		localStorage.setItem("debug", String(newValue));
	};

	return <button onClick={toggle}>{debug ? "Debug ON" : "Debug OFF"}</button>;
}
```

## Common Debugging Scenarios

### Scenario: Song Not Loading

1. Check network tab for failed requests
2. Verify API response format
3. Check console for errors
4. Verify song ID is correct
5. Check if song exists in database

### Scenario: Audio Not Playing on iOS

1. Check if audio is in a user gesture
2. Verify canplay event fired
3. Check if audio element is properly mounted
4. Verify audio source is valid

### Scenario: Offline Mode Not Working

1. Check Service Worker registration
2. Verify IndexedDB has cached data
3. Check network detection hook
4. Verify cache strategy is correct

### Scenario: Queue Not Updating

1. Check queue context state
2. Verify queue operations are called
3. Check for race conditions
4. Verify currentIndex is updated

## Remote Debugging

### React Native Debugger

```bash
# Install React Native Debugger
brew install react-native-debugger
```

### Flipper

```bash
# Install Flipper
brew install flipper
```

### Network Inspection

```bash
# Use Charles Proxy or mitmproxy
charles &
```

## Performance Debugging

### Lighthouse

Run Lighthouse in Chrome DevTools > Lighthouse tab.

### Web Vitals

```typescript
// Track Web Vitals
import { getCLS, getFID, getLCP, getTTFB } from "web-vitals";

getCLS(console.log);
getFID(console.log);
getLCP(console.log);
getTTFB(console.log);
```

### Bundle Analysis

```bash
# Analyze bundle size
ANALYZE=true pnpm build
```

## Debugging Checklist

- [ ] Reproduce the issue consistently
- [ ] Identify the minimal reproduction case
- [ ] Check browser console for errors
- [ ] Use React DevTools to inspect component tree
- [ ] Verify state changes are happening
- [ ] Check network requests/responses
- [ ] Test in incognito/private mode
- [ ] Test in different browsers
- [ ] Test on different devices
- [ ] Document the issue and solution
