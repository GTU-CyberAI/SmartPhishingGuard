# 📌 Smart Phishing Guard

A lightweight Chrome Extension for real-time phishing detection using machine learning models and URL/DOM feature analysis.

---

## 📖 Project Description

Smart Phishing Guard analyzes websites in real-time to detect potential phishing attempts.  
It extracts both URL and DOM features, applies machine learning models (Logistic Regression or Random Forest), and visually informs the user if a website is safe or suspicious.  
The extension also uses a whitelist for trusted domains to reduce false positives.

---

## 🛠️ Installation Instructions

1. **Clone the repository:**
   ```bash
   git clone <git clone https://github.com/meteahmetyakar/SmartPhishingGuard.git>
   cd <SmartPhishingGuard>
2. **Load the extension in Chrome:**
   * Navigate to `chrome://extensions/`
   * Enable **Developer Mode**
   * Click **Load unpacked**
   * Select the project folder

---

## ▶️ Usage Example

- Visit any website.  
- The extension icon will indicate:  
  - ⏳ **Loading** — Analyzing the website  
  - ✅ **Safe Website** — No phishing indicators detected  
  - ⚠️ **Phishing Website** — Potential phishing indicators present  
- Click the icon or floating badge to open the details panel with specific reasons for unsafe detections.

---

## 📂 File Overview

| File/Folder             | Purpose                                                        | Key Elements                                         |
|-------------------------|----------------------------------------------------------------|------------------------------------------------------|
| `manifest.json`         | Chrome extension configuration                                 | Permissions, scripts, icons                          |
| `src/background.js`     | Main logic for detection, feature extraction, ML prediction    | `classify()`, `tryDetect()`, feature extractors      |
| `src/content.js`        | Injected script for DOM feature collection and UI panel control| `extractDomFeatures()`                               |
| `src/model.json`        | Pre-trained machine learning model                             | `type`, `coefficients`, `trees`                      |
| `config/whitelist.json` | Trusted domain whitelist to skip known safe sites              | List of domains                                      |
| `icons/`                | Visual icons for status indicators                             | `loading.png`, `safe.png`, `unsafe.png`, `close.png` |
| `tests/`                | Tests                         |                                                     |

_All code includes clear comments explaining functionality, inputs, outputs, and limitations._

---

## 🧩 Troubleshooting

| Issue                     | Solution                                                     |
|---------------------------|--------------------------------------------------------------|
| Icons not displaying      | Ensure all icons are present in the `icons/` folder          |
| Model not loading         | Verify `model.json` is correctly formatted                   |
| Whitelist not applied     | Check domain format in `config/whitelist.json`               |
| Extension not functioning | Reload the extension from `chrome://extensions/`             |

---

## 🤝 Acknowledgments

- **Course:** Network And Information Security
- **Instructor:** Salih Sarp  
- **Contributors:** Mete Ahmet Yakar  

--- 

## 📸 Screenshots

- **Phishing Website**
<img src="https://github.com/meteahmetyakar/SmartPhishingGuard/blob/main/images/phishing-website.png"/>

- **Safe Website**
<img src="https://github.com/meteahmetyakar/SmartPhishingGuard/blob/main/images/safe-website.png"/>

---
