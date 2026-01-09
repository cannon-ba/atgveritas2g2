
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
;

