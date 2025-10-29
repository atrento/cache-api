// src/index.ts
export default {
  async fetch(request, env, ctx) {
    // Your GCP API backend
    const BACKEND_URL = 'https://chief-randomly-herring.ngrok-free.app';
    
    try {
      // Only handle GET requests
      if (request.method !== 'GET') {
        return new Response('Method not allowed', { status: 405 });
      }
      
      // Create cache key from the request URL
      const cache = caches.default;
      const cacheKey = new Request(request.url, request);
      
      // Try to get from cache
      let response = await cache.match(cacheKey);
      
      if (response) {
        // Cache hit - add header to indicate
        const newResponse = new Response(response.body, response);
        newResponse.headers.set('X-Cache-Status', 'HIT');
        return newResponse;
      }
      
      // Cache miss - fetch from your Go API
      const url = new URL(request.url);
      const backendUrl = BACKEND_URL + url.pathname + url.search;
      
      response = await fetch(backendUrl, {
        method: request.method,
        headers: request.headers,
      });
      
      // Only cache successful responses
      if (response.ok) {
        // Clone the response before caching
        const responseToCache = response.clone();
        
        // Create a new response with cache headers
        const cachedResponse = new Response(responseToCache.body, response);
        cachedResponse.headers.set('Cache-Control', 'public, max-age=120');
        cachedResponse.headers.set('X-Cache-Status', 'MISS');
        
        // Store in cache (use waitUntil to not block the response)
        ctx.waitUntil(cache.put(cacheKey, cachedResponse.clone()));
        
        return cachedResponse;
      }
      
      // Return non-OK responses without caching
      return response;
      
    } catch (error) {
      // Log error and return a proper error response
      console.error('Worker error:', error);
      return new Response('Internal Server Error: ' + error.message, { 
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  }
}
//# sourceMappingURL=index.js.map
