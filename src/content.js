// content.js

(() => {
  /* ---------- ICONS & state ---------- */
  const icons = {
    loading: chrome.runtime.getURL("icons/loading.png"),
    safe:    chrome.runtime.getURL("icons/safe.png"),
    unsafe:  chrome.runtime.getURL("icons/unsafe.png"),
    close:   chrome.runtime.getURL("icons/close.png")
  };
  let panelOpen = false;
  let popupOpen = false;
  let lastDetails = [];

  /* ---------- BADGE ---------- */
  const badge = document.createElement("div");
  Object.assign(badge.style, {
    position: "fixed",
    top: "50%",
    right: 0,
    transform: "translate(0, -50%)",
    width: "40px",
    height: "40px",
    background: "#fff",
    borderRadius: "20px 0 0 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 0 8px rgba(0,0,0,.2)",
    cursor: "pointer",
    zIndex: 999999,
    transition: "opacity .2s"
  });
  badge.innerHTML = `<img src="${icons.loading}" style="width:24px;height:24px">`;
  document.body.appendChild(badge);

  /* ---------- PANEL ---------- */
  const panel = document.createElement("div");
  Object.assign(panel.style, {
    position: "fixed",
    top: "50%",
    right: 0,
    width: "15vw",
    height: "30vh",
    background: "#fff",
    boxShadow: "-2px 0 10px rgba(0,0,0,.3)",
    transform: "translate(100%, -50%)",
    transition: "transform .3s",
    zIndex: 999998
  });
  panel.innerHTML = `
    <div style="padding:12px;text-align:center;border-bottom:1px solid #ddd;color:#000">
      <strong>Site Status</strong>
    </div>
    <div id="spg-body" style="padding:20px;display:flex;flex-direction:column;align-items:center">
      <img id="spg-icon" src="${icons.loading}" style="width:64px;height:64px">
      <p  id="spg-text" style="margin-top:16px;color:#000">Analyzing...</p>
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

  const pIcon = panel.querySelector("#spg-icon");
  const pText = panel.querySelector("#spg-text");
  const dBtn  = panel.querySelector("#spg-btn");

  /* ---------- OVERLAY ---------- */
  const overlay = document.createElement("div");
  Object.assign(overlay.style, {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    background: "rgba(0,0,0,0.5)",
    display: "none",
    zIndex: 999997
  });
  document.body.appendChild(overlay);

  /* ---------- POPUP ---------- */
  const popup = document.createElement("div");
  Object.assign(popup.style, {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "90%",
    maxWidth: "340px",
    background: "#fff",
    borderRadius: "8px",
    boxShadow: "0 6px 20px rgba(0,0,0,.25)",
    padding: "16px",
    zIndex: 999998,
    display: "none"
  });
  popup.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center">
      <strong>Threat Indicators</strong>
      <span id="spg-popup-x" style="cursor:pointer;font-weight:bold">&times;</span>
    </div>
    <ul id="spg-popup-list"
        style="margin-top:12px;font-size:13px;max-height:180px;overflow:auto;
               list-style:disc;padding-left:20px"></ul>`;
  document.body.appendChild(popup);

  const pList = popup.querySelector("#spg-popup-list");
  popup.querySelector("#spg-popup-x").onclick = () => {
    popup.style.display = "none";
    overlay.style.display = "none";
    popupOpen = false;
  };
  overlay.onclick = () => {
    if (popupOpen) {
      popup.style.display = "none";
      overlay.style.display = "none";
      popupOpen = false;
    }
  };

  /* ---------- Panel toggle ---------- */
  function togglePanel() {
    panelOpen = !panelOpen;
    if (panelOpen) {
      badge.style.opacity = "0";
      setTimeout(() => (badge.style.display = "none"), 200);
      panel.style.transform = "translate(0, -50%)";
    } else {
      badge.style.display = "flex";
      setTimeout(() => (badge.style.opacity = "1"), 0);
      panel.style.transform = "translate(100%, -50%)";
      if (popupOpen) {
        popup.style.display = "none";
        overlay.style.display = "none";
        popupOpen = false;
      }
    }
  }
  badge.onclick = panel.querySelector("#spg-close").onclick = togglePanel;

  /* ---------- Details button ---------- */
  dBtn.onclick = () => {
    if (!popupOpen) {
      // Show overlay & popup
      overlay.style.display = "block";
      popup.style.display = "block";
      popupOpen = true;
    } else {
      popup.style.display = "none";
      overlay.style.display = "none";
      popupOpen = false;
    }
  };

  /* ---------- Message listener ---------- */
  chrome.runtime.onMessage.addListener(msg => {
    if (msg.action !== "setStatus") return;

    const iconSrc = icons[msg.status] || icons.loading;
    pIcon.src = iconSrc;
    badge.firstElementChild.src = iconSrc;

    const labelMap = {
      loading: "Analyzing...",
      safe: "Site Safe",
      unsafe: "Site Unsafe"
    };
    pText.textContent = labelMap[msg.status] || "...";

    lastDetails = Array.isArray(msg.details) ? msg.details : [];
    if (msg.status === "unsafe" && lastDetails.length) {
      pList.innerHTML = lastDetails.map(x => `<li>${x}</li>`).join("");
      dBtn.style.display = "block";
    } else {
      dBtn.style.display = "none";
      if (popupOpen) {
        popup.style.display = "none";
        overlay.style.display = "none";
        popupOpen = false;
      }
    }
  });

  /* ---------- DOM feature extraction ---------- */
  function extractDomFeatures() {
    // 1) Form count
    const forms = Array.from(document.getElementsByTagName("form"));
    const formCnt = forms.length;

    // 2) Keyword score (simple list)
    const bodyText = document.body.innerText.toLowerCase();
    const keywords = [
      "login",
      "update",
      "verify",
      "confirm",
      "bank",
      "account",
      "password",
      "secure",
      "click",
      "urgent"
    ];
    let kwScore = 0;
    for (const kw of keywords) {
      if (bodyText.includes(kw)) kwScore++;
    }

    // 3) Resource tags (img, script, link, iframe)
    const resTags = Array.from(
      document.querySelectorAll("img, script, link, iframe")
    );
    let extResCount = 0;
    const host = location.hostname;
    resTags.forEach(el => {
      const src = el.src || el.href || "";
      try {
        const u = new URL(src, location.href);
        if (u.hostname && u.hostname !== host) extResCount++;
      } catch {}
    });
    const totalRes = resTags.length || 1;
    const extResRatio = extResCount / totalRes;

    // 4) External anchor ratio (<a> tags)
    const anchorTags = Array.from(document.getElementsByTagName("a"));
    let extAnchorCount = 0;
    anchorTags.forEach(el => {
      const href = el.href || "";
      try {
        const u = new URL(href, location.href);
        if (u.hostname && u.hostname !== host) extAnchorCount++;
      } catch {}
    });
    const totalAnchors = anchorTags.length || 1;
    const anchorExtRatio = extAnchorCount / totalAnchors;

    // 5) Meta/link external ratio
    const metaLinkTags = Array.from(document.querySelectorAll("meta, link"));
    let extMetaLinkCount = 0;
    let totalMetaLink = 0;
    metaLinkTags.forEach(el => {
      const urlAttr = el.content || el.href || "";
      if (urlAttr) {
        totalMetaLink++;
        try {
          const u = new URL(urlAttr, location.href);
          if (u.hostname && u.hostname !== host) extMetaLinkCount++;
        } catch {}
      }
    });
    const metaLinkExt = totalMetaLink
      ? extMetaLinkCount / totalMetaLink
      : 0;

    // 6) Iframe flag
    const iframes = document.getElementsByTagName("iframe");
    const iframeFlag = iframes.length > 0 ? 1 : 0;
    const numIframes = iframes.length;

    // 7) onmouseover flag
    const onmouseoverFlag =
      document.querySelectorAll("[onmouseover]").length > 0 ? 1 : 0;

    // 8) Right-click disabled (contextmenu)
    const noRclick =
      document.querySelectorAll("[oncontextmenu]").length > 0 ||
      typeof document.oncontextmenu === "function"
        ? 1
        : 0;

    // 9) Mailto links
    const mailtoAction =
      document.querySelectorAll('a[href^="mailto:"]').length > 0 ? 1 : 0;

    // 10) SFH blank (form action empty or about:blank)
    let sfhBlank = 0;
    forms.forEach(f => {
      const action = f.getAttribute("action") || "";
      if (!action || action.toLowerCase() === "about:blank") sfhBlank = 1;
    });

    // 11) Image & hyperlink counts
    const numImgs = document.getElementsByTagName("img").length;
    const numHlinks = anchorTags.length;

    return {
      form_cnt: formCnt,
      kw_score: kwScore,
      ext_res_ratio: extResRatio,
      anchor_ext_ratio: anchorExtRatio,
      meta_link_ext: metaLinkExt,
      iframe_flag: iframeFlag,
      onmouseover_flag: onmouseoverFlag,
      no_rclick: noRclick,
      mailto_action: mailtoAction,
      sfh_blank: sfhBlank,
      num_imgs: numImgs,
      num_hlinks: numHlinks,
      num_iframes: numIframes
    };
  }

  // Send DOM features once on load
  chrome.runtime.sendMessage({
    action: "domFeatures",
    data: extractDomFeatures()
  });

  /* ---------- Panel toggle listener ---------- */
  chrome.runtime.onMessage.addListener(msg => {
    if (msg.action === "togglePanel") {
      togglePanel();
    }
  });
})();
