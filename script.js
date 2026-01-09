document.addEventListener('DOMContentLoaded',()=>{
  const screens = ['q1','q2','q3','result'];
  const selections = [null,null,null];
  const STORAGE_KEY = 'quiz_hotspots_v1';

  function show(id){
    screens.forEach(s=>{
      const el=document.getElementById(s);
      if(!el) return;
      if(s===id) el.classList.add('active'); else el.classList.remove('active');
    });
  }

  function setupHotspots(screenIndex){
    const screenId = `q${screenIndex+1}`;
    const container = document.getElementById(screenId);
    if(!container) return;
    const hotspots = container.querySelectorAll('.hotspot');
    hotspots.forEach(h=>{
      h.addEventListener('click',()=>{
        hotspots.forEach(x=>x.classList.remove('selected'));
        h.classList.add('selected');
        selections[screenIndex] = h.dataset.choice;
        // update editor selected display and inputs
        updateEditorSelection(h);
      });
    });
    // also allow keyboard selection
    hotspots.forEach(h=>{
      h.addEventListener('keydown', e=>{
        if(e.key==='Enter' || e.key===' ') h.click();
      });
    });
  }

  [0,1,2].forEach(i=>setupHotspots(i));

  // --- Editor: load/save positions and enable dragging ---
  function loadPositions(){
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return null;
    try{ return JSON.parse(raw); }catch(e){ return null }
  }

  function applyPositions(pos){
    if(!pos) return;
    ['q1','q2','q3'].forEach(qid=>{
      const container = document.getElementById(qid);
      if(!container || !pos[qid]) return;
      Object.keys(pos[qid]).forEach(key=>{
        const info = pos[qid][key];
        const el = container.querySelector(`.hotspot.hs-${key}`);
        if(!el || !info) return;
        el.style.left = info.left;
        el.style.top = info.top;
        el.style.width = info.width;
        el.style.height = info.height;
      });
    });
  }

  function saveCurrentPositions(){
    const result = {};
    ['q1','q2','q3'].forEach(qid=>{
      const container = document.getElementById(qid);
      if(!container) return;
      result[qid] = {};
      container.querySelectorAll('.hotspot').forEach(h=>{
        result[qid][h.classList.contains('hs-A')? 'A': h.classList.contains('hs-B')? 'B':'C'] = {
          left: h.style.left || window.getComputedStyle(h).left,
          top: h.style.top || window.getComputedStyle(h).top,
          width: h.style.width || window.getComputedStyle(h).width,
          height: h.style.height || window.getComputedStyle(h).height,
        };
      });
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
    alert('位置を保存しました');
  }

  function resetPositions(){
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  }

  const saved = loadPositions();
  if(saved) applyPositions(saved);

  // Dragging logic
  let dragTarget = null;
  let dragOffset = {x:0,y:0};
  function toPercent(value, total){ return (value/total*100).toFixed(2) + '%'; }

  document.querySelectorAll('.hotspot').forEach(h=>{
    h.addEventListener('pointerdown', e=>{
      if(!document.body.classList.contains('editing')) return;
      e.preventDefault();
      dragTarget = h;
      const wrap = h.closest('.image-wrap');
      const rect = wrap.getBoundingClientRect();
      const startX = e.clientX;
      const startY = e.clientY;
      const curLeft = h.getBoundingClientRect().left - rect.left;
      const curTop = h.getBoundingClientRect().top - rect.top;
      dragOffset.x = startX - curLeft - rect.left;
      dragOffset.y = startY - curTop - rect.top;
      h.setPointerCapture(e.pointerId);
    });
    h.addEventListener('pointermove', e=>{
      if(!dragTarget || dragTarget!==h) return;
      const wrap = h.closest('.image-wrap');
      const rect = wrap.getBoundingClientRect();
      let nx = e.clientX - rect.left - dragOffset.x;
      let ny = e.clientY - rect.top - dragOffset.y;
      // clamp
      nx = Math.max(0, Math.min(nx, rect.width - h.offsetWidth));
      ny = Math.max(0, Math.min(ny, rect.height - h.offsetHeight));
      h.style.left = toPercent(nx, rect.width);
      h.style.top = toPercent(ny, rect.height);
      h.style.width = h.style.width || (h.offsetWidth/rect.width*100).toFixed(2) + '%';
      h.style.height = h.style.height || (h.offsetHeight/rect.height*100).toFixed(2) + '%';
    });
    h.addEventListener('pointerup', e=>{
      if(dragTarget===h) dragTarget=null;
      try{ h.releasePointerCapture(e.pointerId); }catch(_){}
      // commit small inline size values as percent strings
      normalizeHotspotSize(h);
    });
    // arrow-key nudge
    h.tabIndex = 0;
    h.addEventListener('keydown', e=>{
      if(!document.body.classList.contains('editing')) return;
      const wrap = h.closest('.image-wrap');
      const rect = wrap.getBoundingClientRect();
      const step = e.shiftKey? 2 : 0.5; // percent
      const curLeft = parseFloat(h.style.left || window.getComputedStyle(h).left) || 0;
      const curTop = parseFloat(h.style.top || window.getComputedStyle(h).top) || 0;
      if(e.key==='ArrowLeft') h.style.left = (curLeft - step) + '%';
      if(e.key==='ArrowRight') h.style.left = (curLeft + step) + '%';
      if(e.key==='ArrowUp') h.style.top = (curTop - step) + '%';
      if(e.key==='ArrowDown') h.style.top = (curTop + step) + '%';
      if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) e.preventDefault();
    });
  });

  // Editor UI handlers
  const toggle = document.getElementById('editorToggle');
  const panel = document.getElementById('editorPanel');
  const saveBtn = document.getElementById('savePositions');
  const resetBtn = document.getElementById('resetPositions');
  const closeBtn = document.getElementById('closeEditor');
  const selectedLabel = document.getElementById('selectedHotspot');
  const widthInput = document.getElementById('widthInput');
  const heightInput = document.getElementById('heightInput');
  const lockRatio = document.getElementById('lockRatio');
  const applySize = document.getElementById('applySize');
  const leftInput = document.getElementById('leftInput');
  const topInput = document.getElementById('topInput');

  let currentSelected = null;

  function pxToPercent(valuePx, total) {
    return (valuePx / total * 100);
  }

  function normalizeHotspotSize(h){
    const wrap = h.closest('.image-wrap');
    const r = wrap.getBoundingClientRect();
    const hb = h.getBoundingClientRect();
    h.style.width = pxToPercent(hb.width, r.width).toFixed(2) + '%';
    h.style.height = pxToPercent(hb.height, r.height).toFixed(2) + '%';
    // also normalize left/top into percent
    const leftPx = hb.left - r.left;
    const topPx = hb.top - r.top;
    h.style.left = pxToPercent(leftPx, r.width).toFixed(2) + '%';
    h.style.top = pxToPercent(topPx, r.height).toFixed(2) + '%';
  }

  function updateEditorSelection(h){
    currentSelected = h;
    selectedLabel.textContent = h.dataset.choice || '—';
    const wrap = h.closest('.image-wrap');
    const r = wrap.getBoundingClientRect();
    const hb = h.getBoundingClientRect();
    leftInput.value = pxToPercent(hb.left - r.left, r.width).toFixed(2);
    topInput.value = pxToPercent(hb.top - r.top, r.height).toFixed(2);
    widthInput.value = pxToPercent(hb.width, r.width).toFixed(2);
    heightInput.value = pxToPercent(hb.height, r.height).toFixed(2);
    // store ratio on element
    h._ratio = (hb.width / hb.height) || 1;
  }

  document.addEventListener('DOMContentLoaded',()=>{
    const screens = ['q1','q2','q3','result'];
    const selections = [null,null,null];

    function show(id){
      screens.forEach(s=>{
        const el=document.getElementById(s);
        if(!el) return;
        if(s===id) el.classList.add('active'); else el.classList.remove('active');
      });
    }

    function setupHotspots(screenIndex){
      const container = document.getElementById(`q${screenIndex+1}`);
      if(!container) return;
      const hotspots = container.querySelectorAll('.hotspot');
      hotspots.forEach(h=>{
        h.addEventListener('click',()=>{
          hotspots.forEach(x=>x.classList.remove('selected'));
          h.classList.add('selected');
          selections[screenIndex] = h.dataset.choice;
        });
        h.tabIndex = 0;
        h.addEventListener('keydown', e=>{
          if(e.key==='Enter' || e.key===' ') { h.click(); e.preventDefault(); }
        });
      });
    }

    [0,1,2].forEach(i=>setupHotspots(i));

    function attachNext(id, idx, nextScreen){
      const btn = document.getElementById(id);
      if(!btn) return;
      btn.addEventListener('click', ()=>{
        if(!selections[idx]) return alert('選択してください');
        show(nextScreen);
      });
    }

    attachNext('next1',0,'q2');
    attachNext('next2',1,'q3');

    document.getElementById('next3').addEventListener('click',()=>{
      if(!selections[2]) return alert('選択してください');
      const counts = {A:0,B:0,C:0};
      selections.forEach(s=>{ if(s && counts.hasOwnProperty(s)) counts[s]++; });
      let result = 'A';
      if(counts.B>counts[result]) result='B';
      if(counts.C>counts[result]) result='C';

      const imgEl = document.getElementById('resultImage');
      if(result==='A') imgEl.src = 'result_A.png';
      else if(result==='B') imgEl.src = 'result_B.png';
      else imgEl.src = 'result_C.png';

      show('result');
    });

    document.getElementById('retry').addEventListener('click',()=>{
      selections[0]=selections[1]=selections[2]=null;
      document.querySelectorAll('.hotspot').forEach(b=>b.classList.remove('selected'));
      show('q1');
    });

    show('q1');

    // scale the game container to fit the window while preserving 1536x1024 aspect
    function applyScale(){
      const app = document.getElementById('app');
      if(!app) return;
      const scale = Math.min(window.innerWidth / 1536, window.innerHeight / 1024, 1);
      app.style.transform = `scale(${scale})`;
      app.style.transformOrigin = 'center center';
    }
    window.addEventListener('resize', applyScale);
    setTimeout(applyScale, 50);
  });

  document.getElementById('retry').addEventListener('click',()=>{
    selections[0]=selections[1]=selections[2]=null;
    document.querySelectorAll('.hotspot').forEach(b=>b.classList.remove('selected'));
    show('q1');
  });

  show('q1');

  // scale the game container to fit the window while preserving 1536x1024 aspect
  function applyScale(){
    const app = document.getElementById('app');
    if(!app) return;
    const scale = Math.min(window.innerWidth / 1536, window.innerHeight / 1024, 1);
    app.style.transform = `scale(${scale})`;
    app.style.transformOrigin = 'center center';
  }
  window.addEventListener('resize', applyScale);
  // run initially after a short delay to ensure layout stable
  setTimeout(applyScale, 50);
});

