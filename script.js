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
      });
      // keyboard activation
      h.addEventListener('keydown', e=>{ if(e.key==='Enter' || e.key===' ') h.click(); });
    });
  }

  [0,1,2].forEach(i=>setupHotspots(i));

  // Load saved positions (if any) and apply to hotspots; this fixes positions.
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

  const saved = loadPositions();
  if(saved) applyPositions(saved);

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
    // update result image
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
});

