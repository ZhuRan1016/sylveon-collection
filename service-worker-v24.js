const CACHE='syldb-v24-fixed-2401';
const CORE=['./','index.html','style-v24.css?v=2401','app-v24.js?v=2401','master-v24.json?v=2401','manifest.json'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)))});
self.addEventListener('activate',e=>e.waitUntil(Promise.all([self.clients.claim(),caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))])));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const u=new URL(e.request.url);const img=/\.(jpg|jpeg|png|webp)$/i.test(u.pathname);e.respondWith(img?caches.match(e.request).then(r=>r||fetch(e.request).then(x=>{const y=x.clone();caches.open(CACHE).then(c=>c.put(e.request,y));return x})):fetch(e.request,{cache:'no-store'}).catch(()=>caches.match(e.request)))});
