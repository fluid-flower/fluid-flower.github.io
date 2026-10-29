(()=>{'use strict';
// 홈페이지·Android 안내·사업자 정보·개인정보처리방침·고객지원·지난 판(09-27 이후)이 함께 쓴다.
const languages=['ko','en','ja','de'];
const select=document.getElementById('languageSelect');
const supported=lang=>languages.includes(lang);

// 본문이 언어 블록(data-language)인 페이지는 그 페이지에 있는 언어만 고를 수 있다 — 독일어가 없는 지난 판에서 독일어를 고르면 본문이 비던 문제.
const blockLanguages=[...new Set([...document.querySelectorAll('[data-language]')].map(el=>el.dataset.language))];
const available=blockLanguages.length?languages.filter(lang=>blockLanguages.includes(lang)):languages;
function resolve(lang){
  if(available.includes(lang))return lang;
  if(available.includes('en'))return 'en';
  return available[0]||'en';
}

// 글자만 바꾸고 안의 링크는 남긴다 — data-ko 요소 안에 <a> 하나가 있으면 그 <a>의 글자를 바꾼다.
// 글자와 요소가 섞여 있으면 건드리지 않는다(통째로 지우는 것보다 낫다).
function setText(el,text){
  let target=el;
  while(target.children.length===1&&![...target.childNodes].some(node=>node.nodeType===3&&node.textContent.trim()))target=target.children[0];
  if(target.children.length===0){if(target.textContent!==text)target.textContent=text}
}

function apply(lang){
  lang=resolve(supported(lang)?lang:'en');
  document.documentElement.lang=lang;
  document.querySelectorAll('[data-ko]').forEach(el=>setText(el,el.getAttribute('data-'+lang)||el.getAttribute('data-en')||el.dataset.ko));
  document.querySelectorAll('[data-aria-ko]').forEach(el=>el.setAttribute('aria-label',el.getAttribute('data-aria-'+lang)||el.getAttribute('data-aria-en')||el.getAttribute('data-aria-ko')));
  document.querySelectorAll('[data-language]').forEach(el=>{el.hidden=el.dataset.language!==lang});
  // 언어별 그림은 HTML에 src를 두지 않는다 — 한국어 그림을 먼저 받았다가 다시 받던 이중 다운로드를 막는다.
  document.querySelectorAll('img[data-src-ko]').forEach(el=>{const src=el.getAttribute('data-src-'+lang)||el.getAttribute('data-src-en');if(el.getAttribute('src')!==src)el.setAttribute('src',src);el.alt=el.getAttribute('data-alt-'+lang)||''});
  if(select){[...select.options].forEach(option=>{const ok=available.includes(option.value);option.hidden=!ok;option.disabled=!ok});select.value=lang}
  document.querySelectorAll('a[href^="/"]').forEach(el=>{const url=new URL(el.getAttribute('href'),location.origin);url.searchParams.set('lang',lang);el.setAttribute('href',url.pathname+url.search+url.hash)});
  try{localStorage.setItem('site-language',lang)}catch{}
  return lang;
}

// 고르는 순서: 주소의 ?lang(지원하는 값일 때만) → 저장값 → 브라우저 언어 목록 → 영어.
function initialLanguage(){
  const fromUrl=new URLSearchParams(location.search).get('lang');
  if(supported(fromUrl))return fromUrl;
  let saved=null;
  try{saved=localStorage.getItem('site-language')||localStorage.getItem('swipeTheFlowLanguage')}catch{}
  if(supported(saved))return saved;
  for(const tag of (navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||''])){const lang=String(tag).slice(0,2).toLowerCase();if(supported(lang))return lang}
  return 'en';
}
apply(initialLanguage());
select?.addEventListener('change',()=>{const lang=apply(select.value);const url=new URL(location.href);url.searchParams.set('lang',lang);history.replaceState(null,'',url)});

// Android 기기에서는 Google Play 버튼을 앞에(진한 버튼으로) 둔다. 순서만 바꾸고 주소는 그대로다.
if(/android/i.test(navigator.userAgent)){
  document.querySelectorAll('.actions').forEach(box=>{
    const play=box.querySelector('[data-store="play"]');const apple=box.querySelector('[data-store="apple"]');
    if(!play||!apple)return;
    box.insertBefore(play,apple);play.classList.remove('secondary');apple.classList.add('secondary');
  });
}

// 첫 화면 영상: 소리 없이 반복. 데이터 절약·동작 줄이기 설정이면 멈춘 포스터만 보인다.
const heroVideo=document.getElementById('hero-video');
if(heroVideo){
  const saveData=navigator.connection&&navigator.connection.saveData;
  const reduceMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(saveData||reduceMotion){heroVideo.removeAttribute('autoplay');heroVideo.pause();heroVideo.preload='none'}
  else{heroVideo.muted=true;heroVideo.play().catch(()=>{})}
}

const film=document.getElementById('film');const video=document.getElementById('play-video');
document.getElementById('open-film')?.addEventListener('click',()=>{film.showModal();heroVideo?.pause();video.play().catch(()=>{})});
document.getElementById('close-film')?.addEventListener('click',()=>film.close());
film?.addEventListener('close',()=>{video.pause();if(heroVideo&&heroVideo.autoplay)heroVideo.play().catch(()=>{})});
document.addEventListener('visibilitychange',()=>{if(document.hidden)video?.pause()});
})();
