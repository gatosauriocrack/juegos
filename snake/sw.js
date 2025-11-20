const CACHE_NAME = 'snake-game-v1';

// Lista de todos los archivos internos y las librerías CDN (Firebase, Font Awesome)
const urlsToCache = [
    // Archivo principal
    'index.html',
    
    // Librerías Firebase (URL completas)
    'https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth-compat.js',
    'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore-compat.js',
    
    // Librería Font Awesome (URL completa)
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
    
    // Íconos de la PWA
    'icon-192.png', 
    'icon-512.png'
];

// 1. EVENTO INSTALL (Caché inicial)
self.addEventListener('install', event => {
    // Esto asegura que el Service Worker no se active hasta que todos los archivos se hayan guardado.
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Cacheando archivos principales.');
                // Guarda todos los archivos de la lista
                return cache.addAll(urlsToCache).catch(error => {
                    console.error('Service Worker: Fallo al cachear un recurso:', error);
                });
            })
    );
});

// 2. EVENTO FETCH (Servir recursos desde la caché o la red)
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Si el recurso (incluyendo Firebase/Font Awesome) está en la caché, lo devuelve.
                if (response) {
                    return response;
                }
                // Si no está, lo busca en la red.
                return fetch(event.request);
            })
    );
});

// 3. EVENTO ACTIVATE (Limpieza de caché antigua)
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('Service Worker: Eliminando caché antigua:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
