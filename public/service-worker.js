const CACHE_NAME = 'version-0.004'
const urlsToCache = ['/', '/index.html', '/offline.html'] // ['/', '/index.html', '/offline.html', 'static/js/bundle.js']

// install sw
this.addEventListener('install', (event) => {
    console.log('installing SW')
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('opened cache')
            return cache.addAll(urlsToCache) // .then(() => this.skipWaiting())
        })
    )
})

// listen for requests
this.addEventListener('fetch', (event) => {
    // console.log('fetch', event)
    event.respondWith(
        caches.match(event.request).then((res) => {
            return fetch(event.request).catch((error) => {
                console.log('fetch error', error, '/offline.html')
                caches.match('offline.html')
            })
        })
    )
})

// activate sw
this.addEventListener('activate', (event) => {
    console.log('activate')
    const cacheWhitelist = []
    cacheWhitelist.push(CACHE_NAME)
    event.waitUntil(
        caches.keys().then((cacheNames) =>
            Promise.all(
                cacheNames.map((cacheName) => {
                    if (!cacheWhitelist.includes(cacheName)) return caches.delete(cacheName)
                    return ''
                })
            )
        )
    )
})
