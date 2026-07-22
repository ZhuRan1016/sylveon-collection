const CACHE='syldb-v22-fixed-2201';
const FILES=['./','index.html','style-v22.css?v=2201','app-v22.js?v=2201','master-v22.json?v=2201','manifest.json'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)))});
self.addEventListener('activate',e=>e.waitUntil(Promise.all([
  self.clients.claim(),
  caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
])));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);
  if(u.origin===location.origin){
    e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{
      const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r;
    }).catch(()=>caches.match(e.request)));
  }else{
    e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{
      const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r;
    })));
  }
});