'use strict';
const escHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let catalogCategories=[];
let products = [
 {id:'keyring',category:'goods',name:'캐릭터 키링',en:'CHARACTER KEYRING',note:'작은 소장품에 담는 브랜드의 이야기',spec:'디자인·소재·크기 협의',packing:'포장 방식·수량 협의',desc:'여행의 기억과 브랜드의 개성을 일상 가까이 담는 키링을 구상합니다. 캐릭터 사용 권한과 디자인, 소재에 따라 제작 방향을 검토합니다.'},
 {id:'bottle',category:'goods',name:'데일리 물병',en:'DAILY BOTTLE',note:'가볍게 함께하는 일상의 물병',spec:'500mL 기준 기획 예시',packing:'소재·인쇄·개별 포장 협의',desc:'매일 사용하기 편한 물병에 브랜드의 분위기를 담는 상품을 구상합니다. 500mL는 기획 기준이며 실제 용량과 소재, 사양은 확정 전입니다.'},
 {id:'stationery',category:'goods',name:'브랜드 문구 세트',en:'BRANDED STATIONERY',note:'기록하는 순간에도 이어지는 경험',spec:'문구 구성·디자인 협의',packing:'세트 구성·포장 협의',desc:'연필과 노트 등 실용적인 문구에 캐릭터와 브랜드 디자인을 적용하는 구상입니다. 사용 목적과 예산에 맞춰 구성과 제작 가능 여부를 검토합니다.'},
 {id:'drink',category:'food',name:'음료·생수',en:'DRINKS & WATER',note:'방문객의 하루를 채우는 한 모금',spec:'완제품 브랜드·용량 협의',packing:'공급처·발주 단위 확인 필요',desc:'관광시설과 판매 매장에서 편리하게 취급할 수 있는 밀봉 음료와 생수 등 완제품 공급을 검토합니다. 취급 브랜드·공급 조건은 아직 확정되지 않았습니다.'},
 {id:'snack',category:'food',name:'과자·간식',en:'SNACK SELECTION',note:'가볍게 고르고 함께 즐기는 간식',spec:'기성 완제품 중심 검토',packing:'품목별 발주·보관 조건 확인',desc:'방문객과 판매 공간의 특성에 맞는 과자·간식 구성을 구상합니다. 실제 제품의 원재료·알레르기·소비기한·보관 조건은 해당 제품의 확인 자료를 기준으로 안내합니다.'},
 {id:'bakery',category:'food',name:'베이커리·간편식',en:'BAKERY & LIGHT MEALS',note:'짧은 휴식에 어울리는 먹거리',spec:'빵·샌드위치 등 완제품 검토',packing:'품목별 냉장·배송 조건 협의',desc:'빵과 샌드위치 등 완제품을 판매 현장에 맞게 구성하는 방향을 검토합니다. 품목의 공급 가능 여부와 보관·배송 조건을 확인한 후 구체화할 예정입니다.'}
];
const grid=document.querySelector('#product-grid');
function renderProducts(category='all'){
 const list=products.filter(p=>category==='all'||(p.category===category||catalogCategories.find(c=>c.id===p.category)?.parent_id===category||(category==='goods'&&(p.rootCategory||p.category)!=='food')));
 grid.replaceChildren(...list.map(p=>{const button=document.createElement('button');button.type='button';button.className='product-card';button.setAttribute('aria-label',`${p.name} ${p.real?'상품':'기획 예시'} 상세보기`);button.innerHTML=`<div class="product-image"><img src="${escHtml(p.image||`/assets/${p.id}.svg`)}" alt="${escHtml(p.name)} ${p.real?'상품 사진':'기획 예시 일러스트'}" width="400" height="330" loading="lazy"><span class="product-badge">${p.real?'상품':'기획 예시'}</span><span class="product-arrow" aria-hidden="true">↗</span></div><div class="product-meta"><span>${escHtml(p.en)}</span></div><h3>${escHtml(p.name)}</h3><p>${escHtml(p.note)}</p>`;button.addEventListener('click',()=>openProduct(p));return button;}));
 if(!list.length){const empty=document.createElement('p');empty.className='collection-note';empty.textContent='이 카테고리의 공개 상품을 준비하고 있습니다.';grid.append(empty);}
 document.querySelector('#product-count').textContent=`${list.length} ITEMS`;
 document.querySelectorAll('[data-filter]').forEach(b=>{const active=b.dataset.filter===category||(b.dataset.level==='main'&&catalogCategories.find(c=>c.id===category)?.parent_id===b.dataset.filter);b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
}
document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>renderProducts(b.dataset.filter)));
document.querySelectorAll('[data-category-link]').forEach(a=>a.addEventListener('click',()=>renderProducts(a.dataset.categoryLink)));
const productDialog=document.querySelector('#product-dialog');
function openProduct(p){
 document.querySelector('#product-detail').innerHTML=`<div class="product-detail-grid"><div class="detail-art"><img src="${escHtml(p.image||`/assets/${p.id}.svg`)}" alt="${escHtml(p.name)} ${p.real?'상품 사진':'예시 일러스트'}"></div><div class="detail-copy"><span class="eyebrow">${escHtml(p.en)} / ${p.real?'상품 안내':'기획 예시'}</span><h2 id="product-title">${escHtml(p.name)}</h2><p>${escHtml(p.desc)}</p><dl><div><dt>규격</dt><dd>${escHtml(p.spec)}</dd></div><div><dt>포장·공급</dt><dd>${escHtml(p.packing)}</dd></div><div><dt>가격 안내</dt><dd>${escHtml(p.price||'미확정 · 공급 조건 협의')}</dd></div><div><dt>진행 상태</dt><dd>${p.real?'공급 가능 여부 문의':'검토용 예시 · 판매 전'}</dd></div></dl><button class="button" id="product-inquiry">이 상품 문의 내용 작성 ↗</button></div></div>`;
 const images=p.images?.length?p.images:[p.image||`/assets/${p.id}.svg`];const art=document.querySelector('.detail-art');const mainImage=art.querySelector('img');mainImage.id='gallery-main';const zoom=document.createElement('a');zoom.href=mainImage.src;zoom.target='_blank';zoom.rel='noopener';zoom.className='image-zoom';zoom.textContent='이미지 크게 보기 ↗';art.append(zoom);if(images.length>1){const thumbs=document.createElement('div');thumbs.className='gallery-thumbs';thumbs.setAttribute('role','group');thumbs.setAttribute('aria-label','상품 사진 선택');images.forEach((src,i)=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',`사진 ${i+1} 보기`);b.setAttribute('aria-pressed',String(i===0));const img=document.createElement('img');img.src=src;img.alt='';b.append(img);b.onclick=()=>{mainImage.src=src;zoom.href=src;mainImage.alt=`${p.name} 사진 ${i+1}`;thumbs.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));};thumbs.append(b);});art.append(thumbs);}
 document.querySelector('#product-inquiry').addEventListener('click',()=>{closeDialog(productDialog);const form=document.querySelector('#inquiry-form');form.elements.type.value=(p.rootCategory||p.category)==='food'?'식음료 납품':'상품·대량 구매';form.elements.message.value=`[${p.name}] 관련 문의\n희망 수량: \n필요 일정: \n문의 사항: `;document.querySelector('#contact').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});form.elements.message.focus({preventScroll:true});});
 showDialog(productDialog);
}
function showDialog(d){d.showModal();document.body.classList.add('modal-open');}
function closeDialog(d){d.close();}
document.querySelectorAll('dialog').forEach(d=>{d.querySelector('.dialog-close').addEventListener('click',()=>closeDialog(d));d.addEventListener('close',()=>document.body.classList.remove('modal-open'));d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog(d);}});});
document.querySelector('#privacy-open').addEventListener('click',()=>showDialog(document.querySelector('#privacy-dialog')));
const toggle=document.querySelector('.menu-toggle');const nav=document.querySelector('#navigation');
function closeMenu(){nav.classList.remove('open');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','메뉴 열기');}
toggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'메뉴 닫기':'메뉴 열기');});
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
const form=document.querySelector('#inquiry-form');const status=document.querySelector('#form-status');
function inquiryText(){if(!form.reportValidity())return null;const data=new FormData(form);for(const key of ['person','reply','message']){if(!String(data.get(key)).trim()){status.textContent='필수 항목에 공백만 입력할 수 없습니다.';form.elements[key].focus();return null;}}return `온브릿지 문의 초안\n\n문의 유형: ${data.get('type')}\n회사·단체명: ${String(data.get('company')).trim()||'미입력'}\n담당자명: ${String(data.get('person')).trim()}\n회신 연락처: ${String(data.get('reply')).trim()}\n\n문의 내용:\n${String(data.get('message')).trim()}\n\n※ 이 파일은 문의 초안입니다. 온브릿지에 전송·접수되지 않았습니다.`;}
form.addEventListener('submit',async e=>{e.preventDefault();const value=inquiryText();if(!value)return;try{await navigator.clipboard.writeText(value);status.textContent='문의 초안을 복사했습니다. 아직 전송·접수되지 않았습니다.';}catch{status.textContent='브라우저에서 복사를 허용하지 않았습니다. 파일로 저장해 주세요.';}});
document.querySelector('#download-inquiry').addEventListener('click',()=>{const value=inquiryText();if(!value)return;const blob=new Blob(['\ufeff'+value],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='ONBRIDGE_문의초안.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status.textContent='문의 초안 파일을 저장했습니다. 아직 전송·접수되지 않았습니다.';});
document.querySelector('#year').textContent=new Date().getFullYear();renderProducts();

async function loadCatalog(){
 const fallback=[{id:'character',name:'캐릭터 굿즈'},{id:'stationery',name:'문구'},{id:'lifestyle',name:'생활용품'},{id:'food',name:'식음료'}];
 let categories=fallback;
 products.forEach(p=>{if(p.id==='keyring')p.category='character';if(p.id==='bottle')p.category='lifestyle';if(p.id==='stationery')p.category='stationery';});
 try{const r=await fetch('/api/catalog',{cache:'no-store'});if(!r.ok)throw Error('unavailable');const data=await r.json();categories=data.categories;if(data.hasProducts){products=data.products.map(p=>({id:p.id,category:p.category_id,rootCategory:categories.find(c=>c.id===p.category_id)?.parent_id||p.category_id,name:p.name,en:categories.find(c=>c.id===p.category_id)?.name||'ONBRIDGE',note:p.description.slice(0,50),desc:p.description,spec:p.spec||'상세 조건 문의',packing:p.packing||'상세 조건 문의',price:p.price,image:p.image||'/assets/symbol.svg',images:p.images||[],real:true}));document.querySelector('.collection .section-heading>.muted').textContent='온브릿지의 상품을 카테고리별로 만나보세요. 공급 조건은 문의해 주세요.';document.querySelector('.collection-note').textContent=data.products.some(p=>p.id.startsWith('suryugi-'))?'수류기 제품 이미지는 실물 촬영이 아닌 AI 제작 예상 이미지입니다. 최종 색상·소재·규격은 제작 샘플 확인 후 확정됩니다.':'상품 사양과 공급 조건을 확인한 후 문의해 주세요.';}}
 catch{const note=document.querySelector('.collection-note');note.textContent='현재 상품 정보를 불러오지 못해 기획 예시를 표시합니다. 실제 공급 여부는 전화로 확인해 주세요.';}
 catalogCategories=categories;
 const roots=categories.filter(c=>!c.parent_id);const filters=document.querySelector('.filters');
 let subs=document.querySelector('#subfilters');if(!subs){subs=document.createElement('div');subs.id='subfilters';subs.className='filters subfilters';subs.setAttribute('role','group');subs.setAttribute('aria-label','상품 소분류');document.querySelector('.collection-toolbar').after(subs);}
 function selectMain(id){subs.replaceChildren();const children=categories.filter(c=>c.parent_id===id);if(children.length){for(const c of [{id,name:'소분류 전체'},...children]){const button=document.createElement('button');button.type='button';button.dataset.filter=c.id;button.textContent=c.name;button.onclick=()=>renderProducts(c.id);subs.append(button);}}subs.hidden=!children.length;renderProducts(id);}
 filters.replaceChildren(...[{id:'all',name:'전체'},...roots].map(c=>{const b=document.createElement('button');b.type='button';b.dataset.filter=c.id;b.dataset.level='main';b.textContent=c.name;b.setAttribute('aria-pressed',String(c.id==='all'));b.onclick=()=>selectMain(c.id);return b;}));selectMain('all');

}
loadCatalog();
