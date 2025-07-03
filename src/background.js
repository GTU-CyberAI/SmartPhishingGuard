// background.js

/* ---------------- Smart Phishing Guard – background.js ---------------- */

/* 0) ICONS & basic UI helpers */
const ICON_PATHS = {
  loading: "icons/loading.png",
  safe:    "icons/safe.png",
  unsafe:  "icons/unsafe.png",
  close:   "icons/close.png"
};
function updateUI(tabId, status) {
  chrome.action.setIcon({ tabId, path: ICON_PATHS[status] });
  chrome.action.setTitle({
    tabId,
    title: status === "safe" ? "Site Safe" : "Site Unsafe"
  });
}

/* 0.5) WHITELIST (top-1000 domain) */
const whitelistPromise = fetch(chrome.runtime.getURL("whitelist.json"))
  .then(r => r.json())
  .then(arr => new Set(arr.map(d => d.toLowerCase())))
  .catch(() => new Set());

/* Helper: get root domain (eTLD+1) */
function getRootDomain(hostname) {
  const parts = hostname.split('.');
  if (parts.length <= 2) return hostname;
  return parts.slice(parts.length - 2).join('.');
}

/* 1) MODEL load */
const modelPromise = fetch(chrome.runtime.getURL("model.json"))
  .then(r => r.json())
  .catch(() => null);

/* 2) Logistic utils */
const sigmoid = x => 1 / (1 + Math.exp(-x));
function predictLR(model, vec) {
  let z = model.intercept;
  for (let i = 0; i < model.coefficients.length; i++) {
    z += model.coefficients[i] * vec[i];
  }
  return sigmoid(z) >= (model.threshold ?? 0.5) ? "unsafe" : "safe";
}

/* 3) Random-Forest utils */
function predictRF(model, featObj) {
  const feats = model.columns.map(k => featObj[k] ?? 0);
  const scoreTree = nodes => {
    let i = 0, n;
    while (!(n = nodes[i]).leaf) {
      i = feats[n.f] <= n.th ? n.l : n.r;
    }
    return n.val;
  };
  let vote = 0;
  for (const nodes of model.trees) {
    vote += scoreTree(nodes);
  }
  return vote > (model.threshold ?? 0) ? "unsafe" : "safe";
}

/* 4) Choose classifier */
async function classify(featObj) {
  const m = await modelPromise;
  if (!m) return "safe";
  return m.type === "rf"
    ? predictRF(m, featObj)
    : predictLR(m, FEATURE_ORDER.map(k => featObj[k] ?? 0));
}

/* 5) 30 URL+DOM feature order (for LR path) */
const FEATURE_ORDER = [
  "url_len","has_ip","is_shortened","has_at","dbl_slash","dash_in_domain",
  "subdomain_lvl","https_token","https_valid","num_dots","num_hyphens",
  "num_ampersand","special_char_ratio","digit_ratio","letter_ratio",
  "path_level","query_length","fragment_length",
  "form_cnt","kw_score","ext_res_ratio","anchor_ext_ratio","meta_link_ext",
  "iframe_flag","onmouseover_flag","no_rclick","mailto_action","sfh_blank",
  "num_imgs","num_hlinks","num_iframes"
];

/* 6) URL feature extractor */
const SHORTENERS = /bit\.ly|t\.co|goo\.gl|tinyurl\.com|is\.gd|ow\.ly|buff\.ly|bitly\.com/i;
function extractUrlFeatures(rawUrl) {
  const u = new URL(rawUrl);
  const host = u.hostname.toLowerCase();
  const c = (s, re) => (s.match(re) || []).length;
  return {
    url_len: rawUrl.length,
    has_ip: /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host) ? 1 : 0,
    is_shortened: SHORTENERS.test(host) ? 1 : 0,
    has_at: rawUrl.includes("@") ? 1 : 0,
    dbl_slash: rawUrl.slice(u.protocol.length + 2).includes("//") ? 1 : 0,
    dash_in_domain: host.includes("-") ? 1 : 0,
    subdomain_lvl: Math.max(host.split(".").length - 2, 0),
    https_token: host.includes("https") ? 1 : 0,
    https_valid: u.protocol === "https:",
    num_dots: c(host, /\./g),
    num_hyphens: c(host, /-/g),
    num_ampersand: c(rawUrl, /&/g),
    special_char_ratio: c(rawUrl, /[@%_\-]/g) / rawUrl.length,
    digit_ratio: c(host, /\d/g) / host.length,
    letter_ratio: c(host, /[a-z]/gi) / host.length,
    path_level: u.pathname.split("/").filter(Boolean).length,
    query_length: u.search.length,
    fragment_length: u.hash.length,
    __host: host
  };
}

/* 7) Explain reasons */
function explainReasons(f) {
  const r = [];
  if (f.url_len > 75)        r.push(`URL is very long (${f.url_len})`);
  if (f.has_ip)              r.push("URL contains IP address");
  if (f.is_shortened)        r.push("Shortened URL service");
  if (f.num_ampersand > 4)   r.push("Too many '&' parameters");
  if (f.form_cnt > 0)        r.push(`${f.form_cnt} suspicious form(s)`);
  if (f.kw_score > 0)        r.push("Phishing keywords detected");
  if (f.ext_res_ratio > .7)  r.push("High external resource ratio");
  if (f.iframe_flag)         r.push("Uses <iframe>");
  if (f.onmouseover_flag)    r.push("Contains onmouseover events");
  if (f.no_rclick)           r.push("Right-click disabled");
  if (r.length === 0)        r.push("Model score is high");
  return r;
}

/* 8) Temp store + detection */
const stash = {};   // { tabId:{url:{}, dom:{}} }

async function tryDetect(tabId) {
  const s = stash[tabId];
  if (!s || !s.url || !s.dom) return;

  const f        = { ...s.url, ...s.dom };
  const wl       = await whitelistPromise;
  const hostRoot = getRootDomain(s.url.__host);

  /* Whitelist check */
  if (wl.has(hostRoot) && f.https_valid) {
    updateUI(tabId, "safe");
    chrome.tabs.sendMessage(tabId, {
      action: "setStatus",
      status: "safe",
      details: []
    });
    delete stash[tabId];
    return;
  }

  /* Model prediction */
  const label   = await classify(f);
  const details = label === "unsafe" ? explainReasons(f) : [];

  updateUI(tabId, label);
  chrome.tabs.sendMessage(tabId, {
    action: "setStatus",
    status: label,
    details
  });
  delete stash[tabId];
}

/* 9) Tab events */
chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  if (info.status === "loading") updateUI(tabId, "loading");

  if (info.status === "complete") {
    stash[tabId] = stash[tabId] || {};
    stash[tabId].url = extractUrlFeatures(tab.url);
    tryDetect(tabId);
  }
});

/* 10) Listen for DOM features */
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.action === "domFeatures") {
    const id = sender.tab.id;
    stash[id] = stash[id] || {};
    stash[id].dom = msg.data || {};
    tryDetect(id);
  } else if (msg.action === "togglePanel") {
    chrome.tabs.sendMessage(sender.tab.id, { action: "togglePanel" });
  }
});

/* 11) Toolbar click → toggle */
chrome.action.onClicked.addListener(tab =>
  chrome.tabs.sendMessage(tab.id, { action: "togglePanel" })
);
