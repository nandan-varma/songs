// Lightweight Service Worker for Music PWA
// Handles offline caching with simplified cache-first and network-first strategies

const CACHE_NAME = "music-pwa-v1";
const STATIC_ASSETS = ["/", "/offline.html"];

/**
 * Install event - cache static assets
 */
self.addEventListener("install", (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			return cache.addAll(STATIC_ASSETS).catch(() => {
				// Fail silently if assets not available yet
			});
		}),
	);
	self.skipWaiting();
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches.keys().then((cacheNames) => {
			return Promise.all(
				cacheNames
					.filter((name) => name !== CACHE_NAME)
					.map((name) => caches.delete(name)),
			);
		}),
	);
	self.clients.claim();
});

/**
 * Fetch event - implement caching strategies
 * - Network-first: API requests (with fallback to cache)
 * - Cache-first: Static assets (JS, CSS, images)
 * - Network-only: WebSocket, streaming, audio files
 */
self.addEventListener("fetch", (event) => {
	const { request } = event;
	const url = new URL(request.url);

	// Skip chrome extensions and non-http(s)
	if (!url.protocol.startsWith("http")) {
		return;
	}

	// Skip same-site requests with cache control headers
	if (url.origin !== location.origin) {
		// External resources - network first
		event.respondWith(networkFirst(request));
		return;
	}

	// Determine strategy based on request type
	if (request.method !== "GET") {
		// POST, PUT, DELETE - network only
		event.respondWith(fetch(request));
		return;
	}

	if (isStaticAsset(url)) {
		// Static assets - cache first
		event.respondWith(cacheFirst(request));
	} else if (isApiRequest(url)) {
		// API requests - network first
		event.respondWith(networkFirst(request));
	} else {
		// Default - network first
		event.respondWith(networkFirst(request));
	}
});

/**
 * Cache-first strategy: return from cache, fallback to network
 */
async function cacheFirst(request) {
	const cache = await caches.open(CACHE_NAME);
	const cached = await cache.match(request);

	if (cached) {
		return cached;
	}

	try {
		const response = await fetch(request);
		if (response.ok && request.method === "GET") {
			cache.put(request, response.clone());
		}
		return response;
	} catch {
		return new Response("Offline - resource not available", {
			status: 503,
			statusText: "Service Unavailable",
		});
	}
}

/**
 * Network-first strategy: try network, fallback to cache
 */
async function networkFirst(request) {
	try {
		const response = await fetch(request);
		if (response.ok && request.method === "GET") {
			const cache = await caches.open(CACHE_NAME);
			cache.put(request, response.clone());
		}
		return response;
	} catch {
		const cached = await caches.match(request);
		if (cached) {
			return cached;
		}
		return new Response("Offline - request failed", {
			status: 503,
			statusText: "Service Unavailable",
		});
	}
}

/**
 * Check if URL is a static asset (JS, CSS, images, fonts)
 */
function isStaticAsset(url) {
	return /\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico)(\?|$)/.test(
		url.pathname,
	);
}

/**
 * Check if URL is an API request
 */
function isApiRequest(url) {
	return url.pathname.startsWith("/api/");
}
