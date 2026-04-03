let CACHE_VERSION = "v1";
const STATIC_CACHE = () => `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = () => `dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = () => `images-${CACHE_VERSION}`;

// Cache limits
const MAX_CACHE_SIZE = 500 * 1024 * 1024; // 500MB total
const MAX_ITEMS_PER_CACHE = 100; // Max items per cache type

// Static assets to cache immediately
const STATIC_ASSETS = ["/manifest.json"];

// Track current build ID
let currentBuildId = null;
let lastBuildCheckTime = 0;
const BUILD_CHECK_INTERVAL = 30 * 1000; // Check every 30 seconds

/**
 * Fetch and update cache version based on build info
 */
async function updateCacheVersionIfNeeded() {
	const now = Date.now();
	// Only check periodically to avoid excessive fetches
	if (now - lastBuildCheckTime < BUILD_CHECK_INTERVAL) {
		return;
	}

	lastBuildCheckTime = now;

	try {
		const response = await fetch("/build-info.json", {
			cache: "no-store",
		});

		if (response.ok) {
			const buildInfo = await response.json();
			const newBuildId = buildInfo.id;

			// New deployment detected
			if (currentBuildId && currentBuildId !== newBuildId) {
				console.log("[Service Worker] New deployment detected!", {
					old: currentBuildId,
					new: newBuildId,
				});
				await clearAllCaches();
				// Update cache version
				CACHE_VERSION = `v${buildInfo.timestamp}`;
				// Notify all clients
				self.clients.matchAll().then((clients) => {
					clients.forEach((client) => {
						client.postMessage({
							type: "DEPLOYMENT_DETECTED",
							buildInfo,
						});
					});
				});
			}

			currentBuildId = newBuildId;
		}
	} catch (error) {
		console.warn("[Service Worker] Failed to check build info:", error);
	}
}

/**
 * Clear all caches
 */
async function clearAllCaches() {
	const cacheNames = await caches.keys();
	return Promise.all(cacheNames.map((name) => caches.delete(name)));
}

// Helper: Get cache size
async function getCacheSize(cacheName) {
	const cache = await caches.open(cacheName);
	const keys = await cache.keys();
	let totalSize = 0;
	for (const request of keys) {
		const response = await cache.match(request);
		if (response) {
			const blob = await response.clone().blob();
			totalSize += blob.size;
		}
	}
	return totalSize;
}

// Helper: Evict oldest items from a cache
async function evictOldest(cacheName, maxItems) {
	const cache = await caches.open(cacheName);
	const keys = await cache.keys();
	if (keys.length <= maxItems) return;

	const itemsToDelete = keys.slice(0, keys.length - maxItems);
	await Promise.all(itemsToDelete.map((request) => cache.delete(request)));
}

// Helper: Evict by size when over limit
async function _manageCacheSize(cacheName) {
	const size = await getCacheSize(cacheName);
	if (size > MAX_CACHE_SIZE) {
		await evictOldest(cacheName, Math.floor(MAX_ITEMS_PER_CACHE / 2));
	}
}

// Install event - cache static assets
self.addEventListener("install", (event) => {
	console.log("[Service Worker] Installing...");
	event.waitUntil(
		(async () => {
			await updateCacheVersionIfNeeded();
			const cache = await caches.open(STATIC_CACHE());
			console.log("[Service Worker] Caching static assets");
			// Cache assets individually to avoid failure on any single asset
			return Promise.allSettled(
				STATIC_ASSETS.map((url) =>
					fetch(url)
						.then((response) => {
							if (response.ok) {
								return cache.put(url, response);
							}
							console.warn(
								`[Service Worker] Failed to cache ${url}: ${response.status}`,
							);
							return Promise.resolve();
						})
						.catch((err) => {
							console.warn(`[Service Worker] Failed to fetch ${url}:`, err);
							return Promise.resolve();
						}),
				),
			).then(() => {
				console.log("[Service Worker] Static assets caching complete");
			});
		})(),
	);
	self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
	console.log("[Service Worker] Activating...");
	event.waitUntil(
		(async () => {
			await updateCacheVersionIfNeeded();
			const cacheNames = await caches.keys();
			const validCaches = [STATIC_CACHE(), DYNAMIC_CACHE(), IMAGE_CACHE()];

			return Promise.all(
				cacheNames.map((cacheName) => {
					if (!validCaches.includes(cacheName)) {
						console.log("[Service Worker] Deleting old cache:", cacheName);
						return caches.delete(cacheName);
					}
					return Promise.resolve();
				}),
			);
		})(),
	);
	return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
	const { request } = event;
	const url = new URL(request.url);

	// Check for new deployment periodically
	if (Math.random() < 0.01) {
		// Check 1% of requests
		updateCacheVersionIfNeeded().catch(() => {});
	}

	// Skip non-GET requests
	if (request.method !== "GET") {
		return;
	}

	// Skip API requests (let them fail naturally when offline)
	if (url.pathname.startsWith("/api/") || url.hostname.includes("saavn")) {
		return;
	}

	// Handle images separately
	if (request.destination === "image") {
		event.respondWith(
			caches.match(request).then((response) => {
				if (response) {
					return response;
				}
				return fetch(request)
					.then((networkResponse) => {
						// Only cache successful responses
						if (networkResponse && networkResponse.status === 200) {
							const responseClone = networkResponse.clone();
							caches.open(IMAGE_CACHE()).then((cache) => {
								cache.put(request, responseClone);
								evictOldest(IMAGE_CACHE(), MAX_ITEMS_PER_CACHE);
							});
						}
						return networkResponse;
					})
					.catch(() => {
						// Return a placeholder image if offline
						return new Response(
							'<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#ddd"/></svg>',
							{ headers: { "Content-Type": "image/svg+xml" } },
						);
					});
			}),
		);
		return;
	}

	// Network first, fallback to cache for navigation requests
	if (request.mode === "navigate") {
		event.respondWith(
			fetch(request)
				.then((response) => {
					// Cache the page
					const responseClone = response.clone();
					caches.open(DYNAMIC_CACHE()).then((cache) => {
						cache.put(request, responseClone);
						evictOldest(DYNAMIC_CACHE(), MAX_ITEMS_PER_CACHE);
					});
					return response;
				})
				.catch(() => {
					// Try to serve from cache
					return caches.match(request).then((response) => {
						if (response) {
							return response;
						}
						// Serve offline page
						return caches.match("/offline").then((offlineResponse) => {
							return offlineResponse || new Response("Offline");
						});
					});
				}),
		);
		return;
	}

	// Cache first, fallback to network for static assets
	event.respondWith(
		caches.match(request).then((response) => {
			if (response) {
				return response;
			}

			return fetch(request)
				.then((networkResponse) => {
					// Cache JS, CSS, fonts
					if (
						request.destination === "script" ||
						request.destination === "style" ||
						request.destination === "font"
					) {
						const responseClone = networkResponse.clone();
						caches.open(STATIC_CACHE()).then((cache) => {
							cache.put(request, responseClone);
							evictOldest(STATIC_CACHE(), MAX_ITEMS_PER_CACHE);
						});
					} else {
						// Cache other resources in dynamic cache
						const responseClone = networkResponse.clone();
						caches.open(DYNAMIC_CACHE()).then((cache) => {
							cache.put(request, responseClone);
							evictOldest(DYNAMIC_CACHE(), MAX_ITEMS_PER_CACHE);
						});
					}
					return networkResponse;
				})
				.catch(() => {
					// Return a basic offline response
					if (request.destination === "document") {
						return caches.match("/offline");
					}
					return new Response("Network error", {
						status: 408,
						headers: { "Content-Type": "text/plain" },
					});
				});
		}),
	);
});

// Handle messages from clients
self.addEventListener("message", (event) => {
	if (event.data && event.data.type === "SKIP_WAITING") {
		self.skipWaiting();
	}

	if (event.data && event.data.type === "CLEAR_CACHE") {
		event.waitUntil(clearAllCaches());
	}

	if (event.data && event.data.type === "CHECK_UPDATE") {
		event.waitUntil(updateCacheVersionIfNeeded());
	}
});
