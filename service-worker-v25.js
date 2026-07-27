const CACHE='syldb-v25-verified-2501';
const CORE=['./','index.html','style-v25.css?v=2501','app-v25.js?v=2501','master-v25.json?v=2501','manifest.json'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)))});
self.addEventListener('activate',e=>e.waitUntil(Promise.all([
  self.clients.claim(),
  caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
])));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);
  const isImage=/\.(?:jpg|jpeg|png|webp)(?:\?|$)/i.test(u.pathname);
  if(isImage){
    e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{
      const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r;
    })));
  }else{
    e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{
      const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r;
    }).catch(()=>caches.match(e.request)));
  }
});