let cards=[],era='全部';
const owned=new Set(JSON.parse(localStorage.getItem('sylveon-owned')||'[]'));
const cache=JSON.parse(localStorage.getItem('sylveon-image-cache')||'{}');
const key=c=>`${c.name}|${c.number}|${c.set}`;
const save=()=>localStorage.setItem('sylveon-owned',JSON.stringify([...owned]));
const num=s=>String(s||'').split('/')[0].replace(/^0+/,'').toUpperCase();

async function loadImages(){
 const status=document.querySelector('#imageStatus');
 status.textContent='正在加载卡图…';
 try{
  let all=[];
  for(const name of ['ニンフィア','サーナイト＆ニンフィアGX']){
   const r=await fetch(`https://api.tcgdex.net/v2/ja/cards?name=${encodeURIComponent(name)}&pagination:itemsPerPage=100`);
   if(r.ok){const d=await r.json();all.push(...(Array.isArray(d)?d:(d.data||[])))}
  }
  all=[...new Map(all.map(x=>[x.id,x])).values()];
  for(const c of cards){
   const k=key(c);
   if(cache[k]){c.image=cache[k];continue}
   const m=all.find(x=>String(x.name||'').includes('ニンフィア')&&num(x.localId)===num(c.number));
   if(m&&m.image){c.image=`${m.image}/high.webp`;cache[k]=c.image}
  }
  localStorage.setItem('sylveon-image-cache',JSON.stringify(cache));
  status.textContent='卡图加载完成';render();
 }catch(e){status.textContent='卡图加载失败，请刷新重试'}
}
async function init(){cards=await fetch('cards.json',{cache:'no-store'}).then(r=>r.json());cards.forEach(c=>{if(cache[key(c)])c.image=cache[key(c)]});render();loadImages()}
function render(){
 const q=document.querySelector('#q').value.toLowerCase(),f=document.querySelector('#filter').value;
 const eras=['全部',...new Set(cards.map(c=>c.era))];
 document.querySelector('#eras').innerHTML=eras.map(e=>`<button class="era ${e===era?'active':''}" data-e="${e}">${e}</button>`).join('');
 document.querySelectorAll('.era').forEach(b=>b.onclick=()=>{era=b.dataset.e;render()});
 const arr=cards.filter(c=>{const has=owned.has(key(c));return(!q||`${c.name} ${c.number} ${c.set}`.toLowerCase().includes(q))&&(era==='全部'||c.era===era)&&(f==='all'||(f==='owned'&&has)||(f==='missing'&&!has))});
 document.querySelector('#grid').innerHTML=arr.map(c=>{const has=owned.has(key(c));return `<article class="card ${has?'owned':''}"><div class="img">${c.image?`<img loading="lazy" src="${c.image}" alt="${c.name}">`:''}<div class="placeholder">🎀<br>${c.name}<br><small>${c.number}</small></div><button class="check" data-k="${encodeURIComponent(key(c))}">${has?'✓':'＋'}</button></div><div class="body"><b>${c.name}</b><div class="meta">${c.number}<br>${c.set}</div></div></article>`}).join('');
 document.querySelectorAll('.check').forEach(b=>b.onclick=()=>{const k=decodeURIComponent(b.dataset.k);owned.has(k)?owned.delete(k):owned.add(k);save();render()});
 const n=cards.filter(c=>owned.has(key(c))).length,p=cards.length?Math.round(n/cards.length*100):0;
 document.querySelector('#stats').textContent=`已收集 ${n} / ${cards.length}（${p}%）`;document.querySelector('#bar').style.width=p+'%';
}
document.querySelector('#q').oninput=render;document.querySelector('#filter').onchange=render;
document.querySelector('#exportBtn').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({owned:[...owned]},null,2)],{type:'application/json'}));a.download='sylveon-backup.json';a.click()};
document.querySelector('#importFile').onchange=async e=>{const d=JSON.parse(await e.target.files[0].text());owned.clear();(d.owned||[]).forEach(x=>owned.add(x));save();render()};
if('serviceWorker'in navigator)navigator.serviceWorker.register('service-worker.js');init();