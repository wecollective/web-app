this.addEventListener('push', async (event) => {
    // console.log('push notification: ', event.data.json())
    const { type, title, text, icon, image, data } = event.data.json()
    // display push notification
    this.registration.showNotification(title, {
        body: text,
        icon: icon || '/logo/192-masked.png',
        image,
    })
    // inform client
    const clients = await this.clients.matchAll({ includeUncontrolled: true })
    if (type === 'notification') {
        clients.forEach((client) => client.postMessage({ type: 'new-notification' }))
    }
    if (type === 'message') {
        clients.forEach((client) => client.postMessage({ type: 'new-message', data }))
    }
})

this.addEventListener('pushsubscriptionchange', async (event) => {
    console.log('pushsubscriptionchange', event)
    event.waitUntil(
        this.registration.pushManager
            .subscribe({
                userVisibleOnly: true,
                applicationServerKey: `%REACT_APP_DEV_VAPID_PUBLIC_KEY%`,
            })
            .then((newSubscription) => {
                console.log()
                // Send the new subscription details to your server
            })
    )
})

// const CACHE_NAME = 'version-0.005'
// const urlsToCache = ['/', 'index.html', 'offline.html'] // ['/', '/index.html', '/offline.html', 'static/js/bundle.js']

// // install sw
// this.addEventListener('install', (event) => {
//     console.log('installing SW')
//     event.waitUntil(
//         caches.open(CACHE_NAME).then((cache) => {
//             console.log('opened cache')
//             return cache.addAll(urlsToCache) // .then(() => this.skipWaiting())
//         })
//     )
// })

// // listen for requests
// this.addEventListener('fetch', (event) => {
//     // console.log('fetch', event)
//     event.respondWith(
//         caches.match(event.request).then((res) => {
//             return fetch(event.request).catch((error) => {
//                 console.log('fetch error', error, 'offline.html')
//                 caches.match('offline.html')
//             })
//         })
//     )
// })

// // activate sw
// this.addEventListener('activate', (event) => {
//     console.log('activate')
//     const cacheWhitelist = []
//     cacheWhitelist.push(CACHE_NAME)
//     event.waitUntil(
//         caches.keys().then((cacheNames) =>
//             Promise.all(
//                 cacheNames.map((cacheName) => {
//                     if (!cacheWhitelist.includes(cacheName)) return caches.delete(cacheName)
//                     return ''
//                 })
//             )
//         )
//     )
// })
