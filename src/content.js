(() => {
  /* ---------- ICONS & state ---------- */
  const icons = {
    loading: chrome.runtime.getURL("icons/loading.png"),
    safe:    chrome.runtime.getURL("icons/safe.png"),
    unsafe:  chrome.runtime.getURL("icons/unsafe.png"),
    close:   chrome.runtime.getURL("icons/close.png")
  };
  let panelOpen = false;
  let lastDetails = [];      // for prevent race conditions

  /* ---------- BADGE ---------- */
  const badge = document.createElement("div");
  Object.assign(badge.style,{
    position:"fixed",top:"50%",right:0,transform:"translate(0,-50%)",
    width:"40px",height:"40px",background:"#fff",borderRadius:"20px 0 0 20px",
    display:"flex",alignItems:"center",justifyContent:"center",
    boxShadow:"0 0 8px rgba(0,0,0,.2)",cursor:"pointer",zIndex:999999,
    transition:"opacity .2s"
  });
  badge.innerHTML=`<img src="${icons.loading}" style="width:24px;height:24px">`;
  document.body.appendChild(badge);

  /* ---------- PANEL ---------- */
  const panel = document.createElement("div");
  Object.assign(panel.style,{
    position:"fixed",top:"50%",right:0,width:"15vw",height:"30vh",
    background:"#fff",boxShadow:"-2px 0 10px rgba(0,0,0,.3)",
    transform:"translate(100%,-50%)",transition:"transform .3s",zIndex:999998
  });
  panel.innerHTML = `
    <div style="padding:12px;text-align:center;border-bottom:1px solid #ddd;color:#000">
      <strong>Site Status</strong>
    </div>
    <div id="spg-body" style="padding:20px;display:flex;flex-direction:column;align-items:center">
      <img id="spg-icon" src="${icons.loading}" style="width:64px;height:64px">
      <p id="spg-text" style="margin-top:16px;color:#000">Analyzing...</p>
      <button id="spg-btn"
              style="margin-top:12px;padding:6px 14px;font-size:13px;
                    background:#d32f2f;color:#fff;border:none;border-radius:4px;
                    cursor:pointer;display:none;">💡 Details</button>
    </div>
    <div id="spg-close"
        style="position:absolute;top:50%;left:0;transform:translate(-10%,-50%);
                width:40px;height:40px;background:#fff;border-radius:0 20px 20px 0;
                box-shadow:0 0 8px rgba(0,0,0,.2);display:flex;align-items:center;
                justify-content:center;cursor:pointer;">
      <img src="${icons.close}" style="width:24px;height:24px">
    </div>`;
  document.body.appendChild(panel);

  const pIcon  = panel.querySelector('#spg-icon');
  const pText  = panel.querySelector('#spg-text');
  const dBtn   = panel.querySelector('#spg-btn');

  /* ---------- POPUP ---------- */
  const popup = document.createElement("div");
  Object.assign(popup.style,{
    position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",
    width:"90%",maxWidth:"340px",background:"#fff",borderRadius:"8px",
    boxShadow:"0 6px 20px rgba(0,0,0,.25)",padding:"16px",zIndex:1000000,
    display:"none"
  });
  popup.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center">
      <strong>Tehlike Göstergeleri</strong>
      <span id="spg-popup-x" style="cursor:pointer;font-weight:bold">&times;</span>
    </div>
    <ul id="spg-popup-list"
        style="margin-top:12px;font-size:13px;max-height:180px;overflow:auto;
               list-style:disc;padding-left:20px"></ul>`;
  document.body.appendChild(popup);
  const pList = popup.querySelector('#spg-popup-list');
  popup.querySelector('#spg-popup-x').onclick = ()=> popup.style.display='none';

  /* ---------- Panel toggle ---------- */
  function togglePanel() {
    panelOpen = !panelOpen;
    if (panelOpen) {
      badge.style.opacity='0'; setTimeout(()=>badge.style.display='none',200);
      panel.style.transform='translate(0,-50%)';
    } else {
      badge.style.display='flex'; setTimeout(()=>badge.style.opacity='1',0);
      panel.style.transform='translate(100%,-50%)';
      popup.style.display='none';
    }
  }
  badge.onclick = panel.querySelector('#spg-close').onclick = togglePanel;

  /* ---------- Button toggle ---------- */
  dBtn.onclick = () => {
    if (popup.style.display==='none') popup.style.display='block';
    else popup.style.display='none';
  };

  /* ---------- Message Listener ---------- */
  chrome.runtime.onMessage.addListener(msg => {
    if (msg.action !== 'setStatus') return;

  /* When this status arrives, if there is a previous race message, it is cancelled */
    const iconSrc = icons[msg.status] || icons.loading;
    pIcon.src  = iconSrc;
    badge.firstElementChild.src = iconSrc;

    const labelMap = {loading:'Analysing...', safe:'Safe Website', unsafe:'Phishing Website'};
    pText.textContent = labelMap[msg.status] || '...';

    /* Details */
    lastDetails = Array.isArray(msg.details) ? msg.details : [];
    if (msg.status === 'unsafe' && lastDetails.length) {
      pList.innerHTML = lastDetails.map(x=>`<li>${x}</li>`).join('');
      dBtn.style.display = 'block';
    } else {
      dBtn.style.display = 'none';
      popup.style.display = 'none';
    }
  });

  /* ---------- DOM feature extraction ---------- */
  function extractDomFeatures(){/* ... (same code) ... */}
  chrome.runtime.sendMessage({action:'domFeatures',data:extractDomFeatures()});
})();