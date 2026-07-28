
const STORAGE_KEY='syldb-owned-v2';
const OLD_KEYS=['syldb-owned-v1','sylveon-owned-v3','sylveon-owned'];
let db=null,cards=[],activeEra='全部',selectedCard=null;
const owned=new Set(JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]'));
const IMAGE_CACHE_KEY='syldb-image-cache-v23';
const imageCache=JSON.parse(localStorage.getItem(IMAGE_CACHE_KEY)||'{}');
let imageResolveStarted=false;


const $=s=>document.querySelector(s);
const save=()=>localStorage.setItem(STORAGE_KEY,JSON.stringify([...owned]));
const isOwned=c=>owned.has(c.id);

async function init(){
  db=await fetch('master-v29.json?v=2901',{cache:'reload'}).then(r=>r.json());
  cards=db.cards||[];
  cards.forEach(c=>{ if(imageCache[c.id]) c.image_url=imageCache[c.id]; });
  populateFilters();
  bindEvents();
  render();
  if('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker-v29.js?v=2901');
}

function populateFilters(){
  const rarities=[...new Set(cards.map(c=>c.rarity).filter(Boolean))].sort();
  $('#rarityFilter').innerHTML='<option value="all">全部稀有度</option>'+rarities.map(r=>`<option value="${esc(r)}">${esc(r)}</option>`).join('');
}

function filteredCards(){
  const q=$('#searchInput').value.trim().toLowerCase();
  const status=$('#statusFilter').value;
  const rarity=$('#rarityFilter').value;
  return cards.filter(c=>{
    const hay=`${c.name_ja} ${c.card_number} ${c.set_name} ${c.variant} ${c.rarity}`.toLowerCase();
    return (!q||hay.includes(q))
      &&(activeEra==='全部'||c.era===activeEra)
      &&(status==='all'||(status==='owned'&&isOwned(c))||(status==='missing'&&!isOwned(c)))
      &&(rarity==='all'||c.rarity===rarity);
  });
}

function render(){
  renderTabs();renderStats();renderCards();renderSummary();
}

function renderTabs(){
  const eras=['全部',...new Set(cards.map(c=>c.era))];
  $('#eraTabs').innerHTML=eras.map(e=>`<button class="era-tab ${e===activeEra?'active':''}" data-era="${esc(e)}">${esc(e)}</button>`).join('');
  document.querySelectorAll('.era-tab').forEach(b=>b.onclick=()=>{activeEra=b.dataset.era;render()});
}

function renderStats(){
  const eras=[...new Set(cards.map(c=>c.era))];
  $('#eraStats').innerHTML=eras.map(e=>{
    const total=cards.filter(c=>c.era===e).length;
    const n=cards.filter(c=>c.era===e&&isOwned(c)).length;
    return `<div class="stat-box"><b>${e} ${n}/${total}</b><span>${total?Math.round(n/total*100):0}%</span></div>`;
  }).join('');
}

function renderCards(){
  const arr=filteredCards();
  $('#emptyState').hidden=arr.length>0;
  $('#cardGrid').innerHTML=arr.map(c=>`
    <article class="card ${isOwned(c)?'owned':''}" data-id="${c.id}">
      <div class="card-visual">
        ${c.image_url?`<img loading="lazy" src="${esc(c.image_url)}" alt="${esc(c.name_ja)}" onload="this.nextElementSibling.hidden=true" onerror="this.remove()">`:''}
        <div class="card-placeholder">🎀<small>${esc(c.card_number)}</small></div>
        <span class="era-badge">${esc(c.era)}</span>
        <button class="owned-toggle" data-toggle="${c.id}">${isOwned(c)?'✓':'＋'}</button>
      </div>
      <div class="card-body">
        <div class="card-name">${esc(c.name_ja)}</div>
        <div class="card-number">${esc(c.card_number)}</div>
        <div class="card-meta">${esc(c.set_name)}<br>${esc(c.rarity||'—')} · ${esc(c.variant||'普通版')}</div>
      </div>
    </article>`).join('');
  document.querySelectorAll('.owned-toggle').forEach(b=>b.onclick=e=>{e.stopPropagation();toggleOwned(b.dataset.toggle)});
  document.querySelectorAll('.card').forEach(el=>el.onclick=()=>openDetail(el.dataset.id));
}

function renderSummary(){
  const n=cards.filter(isOwned).length,total=cards.length,p=total?Math.round(n/total*100):0;
  $('#summaryCount').textContent=`${n} / ${total}`;
  $('#summaryPercent').textContent=`${p}%`;
  $('#progressBar').style.width=`${p}%`;
}

function toggleOwned(id){
  owned.has(id)?owned.delete(id):owned.add(id);save();render();
  if(selectedCard&&selectedCard.id===id) updateModalOwned();
}

function openDetail(id){
  selectedCard=cards.find(c=>c.id===id);if(!selectedCard)return;
  $('#modalVisual').innerHTML=selectedCard.image_url?`<img src="${esc(selectedCard.image_url)}" alt="${esc(selectedCard.name_ja)}">`:'🎀';
  $('#modalName').textContent=selectedCard.name_ja;
  $('#modalNumber').textContent=selectedCard.card_number;
  const meta=[
    ['时代',selectedCard.era],['系列',selectedCard.set_name],['稀有度',selectedCard.rarity||'—'],
    ['版本',selectedCard.variant||'普通版'],['数据库ID',selectedCard.id]
  ];
  $('#modalMeta').innerHTML=meta.map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('');
  const src=selectedCard.source_url||'';
  $('#modalSource').hidden=!src;$('#modalSource').href=src;
  updateModalOwned();$('#detailModal').hidden=false;
}

function updateModalOwned(){
  if(!selectedCard)return;
  const has=isOwned(selectedCard);
  $('#modalOwnedBtn').textContent=has?'✓ 已收集':'＋ 标记为已收集';
  $('#modalOwnedBtn').classList.toggle('is-owned',has);
}

function bindEvents(){
  $('#searchInput').oninput=render;$('#statusFilter').onchange=render;$('#rarityFilter').onchange=render;
  $('#menuBtn').onclick=()=>$('#menuSheet').hidden=false;$('#closeMenuBtn').onclick=()=>$('#menuSheet').hidden=true;
  $('#menuSheet').onclick=e=>{if(e.target.id==='menuSheet')$('#menuSheet').hidden=true};
  $('#closeModalBtn').onclick=()=>$('#detailModal').hidden=true;
  $('#detailModal').onclick=e=>{if(e.target.id==='detailModal')$('#detailModal').hidden=true};
  $('#modalOwnedBtn').onclick=()=>toggleOwned(selectedCard.id);
  $('#exportBtn').onclick=exportBackup;$('#importFile').onchange=importBackup;$('#migrateBtn').onclick=migrateOld;
  $('#resetBtn').onclick=()=>{if(confirm('确定清空全部收藏状态吗？')){owned.clear();save();render();$('#menuSheet').hidden=true}};
}

function exportBackup(){
  const payload={app:'SYLDB',version:2,exported_at:new Date().toISOString(),owned_ids:[...owned]};
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
  a.download='SYLDB-collection-backup.json';a.click();URL.revokeObjectURL(a.href);
}

async function importBackup(e){
  const f=e.target.files[0];if(!f)return;
  try{const d=JSON.parse(await f.text());const ids=d.owned_ids||d.owned||[];owned.clear();ids.forEach(id=>owned.add(id));save();render();alert('导入成功');$('#menuSheet').hidden=true}
  catch{alert('备份文件格式不正确')}
}

function migrateOld(){
  let migrated=0;
  for(const k of OLD_KEYS){
    const raw=JSON.parse(localStorage.getItem(k)||'[]');
    for(const old of raw){
      const match=cards.find(c=>old===c.id||old.includes(c.card_number));
      if(match&&!owned.has(match.id)){owned.add(match.id);migrated++}
    }
  }
  save();render();alert(`已迁移 ${migrated} 项旧记录`);
}


function digits(v){return String(v||'').split('/')[0].replace(/^0+/,'')||'0'}
function norm(v){return String(v||'').toLowerCase().replace(/[\s＋+・＆&:_-]/g,'')}
function setHints(c){
  const s=norm(c.set_name), hints=[];
  const code=(c.set_name.match(/\b(?:XY\d+|CP\d+|SM\d+\+?|SM\d+[a-z]?|S\d+[a-z]?|SV\d+[a-z]?|SVLN|SVM|MC)\b/i)||[])[0];
  if(code) hints.push(norm(code));
  if(s.includes('イーブイヒーローズ')) hints.push('s6a','eeveeheroes');
  if(s.includes('vm​​axクライマックス')||s.includes('vmaxクライマックス')) hints.push('s8b');
  if(s.includes('pokemon go')||s.includes('pokémongo')) hints.push('s10b');
  if(s.includes('テラスタルフェス')) hints.push('sv8a');
  if(s.includes('ナイトワンダラー')) hints.push('sv6a');
  if(s.includes('ナイトユニゾン')) hints.push('sm9a');
  if(s.includes('ポケキュン')) hints.push('cp3');
  if(s.includes('ライジングフィスト')) hints.push('xy3');
  if(s.includes('gxウルトラシャイニー')) hints.push('sm8b');
  if(s.includes('禁断の光')) hints.push('sm6');
  if(s.includes('オルタージェネシス')) hints.push('sm12');
  if(s.includes('gxバトルブースト')) hints.push('sm4p','sm4+');
  if(s.includes('スタートデッキ100')&&s.includes('バトルコレクション')) hints.push('mc');
  return hints;
}
function scoreMatch(card,candidate){
  let score=0;
  if(digits(candidate.localId)===digits(card.card_number)) score+=50; else return -999;
  const cn=norm(candidate.name);
  if(cn.includes('ニンフィア')) score+=15;
  if(norm(card.name_ja).includes('サーナイト')&&cn.includes('サーナイト')) score+=20;
  const blob=norm(`${candidate.id||''} ${candidate.set?.id||''} ${candidate.set?.name||''}`);
  for(const h of setHints(card)){ if(h&&blob.includes(h)) score+=30; }
  if(card.card_number.includes('P')&&blob.includes('p')) score+=5;
  return score;
}
async function queryCards(name){
  const url=`https://api.tcgdex.net/v2/ja/cards?name=${encodeURIComponent(name)}&pagination:itemsPerPage=100`;
  const r=await fetch(url,{cache:'force-cache'});
  if(!r.ok) return [];
  const j=await r.json();
  return Array.isArray(j)?j:(j.data||[]);
}
async function resolveAllMissingImages(){
  if(imageResolveStarted)return;
  imageResolveStarted=true;
  const missing=cards.filter(c=>!c.image_url);
  if(!missing.length)return;
  let candidates=[];
  for(const n of ['ニンフィア','サーナイト＆ニンフィアGX','サーナイト&ニンフィアGX']){
    try{candidates.push(...await queryCards(n))}catch(e){}
  }
  candidates=[...new Map(candidates.map(x=>[x.id,x])).values()];
  let changed=0;
  for(const card of missing){
    const ranked=candidates.map(x=>[scoreMatch(card,x),x]).filter(x=>x[0]>0).sort((a,b)=>b[0]-a[0]);
    if(!ranked.length)continue;
    let best=ranked[0][1], detail=best;
    try{
      const r=await fetch(`https://api.tcgdex.net/v2/ja/cards/${encodeURIComponent(best.id)}`,{cache:'force-cache'});
      if(r.ok)detail=await r.json();
    }catch(e){}
    const base=detail.image||best.image;
    if(base){
      card.image_url=`${base}/high.webp`;
      imageCache[card.id]=card.image_url;
      changed++;
    }
  }
  localStorage.setItem(IMAGE_CACHE_KEY,JSON.stringify(imageCache));
  if(changed)render();
}

function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
init();
