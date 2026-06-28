// ==========================================
// 1. DYNAMIC CONFIGURATION ENGINE
// ==========================================
const formatIcalDate = (dt) => dt ? new Date(dt).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z' : '';

const qrConfig = {
  text: {
    label: "Plain Text",
    fields: [{ id: "input-text", type: "textarea", placeholder: "Enter plain text...", rows: 4, ariaLabel: "Plain text input" }],
    getPayload: (data) => data['input-text']
  },
  url: {
    label: "URL / Website",
    fields: [
      { id: "url-input", type: "url", placeholder: "https://example.com", ariaLabel: "Website URL" },
      { id: "url-src", type: "text", placeholder: "UTM Source (Optional)", ariaLabel: "UTM Source" },
      { id: "url-med", type: "text", placeholder: "UTM Medium (Optional)", ariaLabel: "UTM Medium" },
      { id: "url-name", type: "text", placeholder: "UTM Campaign Name (Optional)", ariaLabel: "UTM Campaign Name" }
    ],
    getPayload: (data) => {
      let baseUri = data['url-input'];
      if (!baseUri) return null;
      if (data['url-src'] || data['url-med'] || data['url-name']) {
        const url = new URL(baseUri.startsWith('http') ? baseUri : 'https://' + baseUri);
        if (data['url-src']) url.searchParams.append('utm_source', data['url-src']);
        if (data['url-med']) url.searchParams.append('utm_medium', data['url-med']);
        if (data['url-name']) url.searchParams.append('utm_campaign', data['url-name']);
        return url.toString();
      }
      return baseUri;
    }
  },
  upi: {
    label: "UPI Payment",
    fields: [
      { 
        id: "upi-method", type: "select", ariaLabel: "Select UPI routing method",
        options: [
          { value: "vpa", label: "UPI ID / VPA" },
          { value: "bank", label: "Bank Account + IFSC" },
          { value: "aadhaar", label: "Aadhaar Mapping" },
          { value: "mobile", label: "Mobile Number" }
        ],
        onChange: (e) => {
          const v = e.target.value;
          const getEl = (id) => document.getElementById(id) || { style: {} };
          getEl('wrap-upi-id').style.display = v === 'vpa' ? 'block' : 'none';
          getEl('wrap-upi-bank').style.display = v === 'bank' ? 'flex' : 'none';
          getEl('wrap-upi-aadhaar').style.display = v === 'aadhaar' ? 'block' : 'none';
          getEl('wrap-upi-mobile').style.display = v === 'mobile' ? 'block' : 'none';
        }
      },
      { id: "upi-id", type: "text", placeholder: "e.g., username@bank", wrapperId: "wrap-upi-id", ariaLabel: "UPI ID or VPA" },
      { id: "upi-bank", type: "group", wrapperId: "wrap-upi-bank", style: "display:none;", fields: [
          { id: "upi-account", type: "text", placeholder: "Bank Account Number", numericOnly: true, inputmode: "numeric", ariaLabel: "Bank Account Number" },
          { id: "upi-ifsc", type: "text", placeholder: "IFSC Code", ariaLabel: "IFSC Code" }
        ]
      },
      { id: "upi-aadhaar", type: "text", placeholder: "[Aadhaar Redacted]", maxlength: "12", wrapperId: "wrap-upi-aadhaar", style: "display:none;", numericOnly: true, inputmode: "numeric", pattern: "[0-9]*", ariaLabel: "12-digit Aadhaar Number" },
      { id: "upi-mobile", type: "tel", placeholder: "10-Digit Mobile Number", maxlength: "10", wrapperId: "wrap-upi-mobile", style: "display:none;", numericOnly: true, inputmode: "numeric", pattern: "[0-9]*", ariaLabel: "10-digit Mobile Number" },
      { id: "upi-payee", type: "text", placeholder: "Payee Name", ariaLabel: "Payee Name" },
      { id: "upi-amount", type: "number", placeholder: "Amount (Optional)", ariaLabel: "Payment Amount in INR" },
      { id: "upi-note", type: "text", placeholder: "Note (Optional)", ariaLabel: "Payment Note" }
    ],
    getPayload: (data) => {
      const method = data['upi-method'];
      let pa = "";
      if (method === 'vpa') pa = data['upi-id']?.trim();
      else if (method === 'bank') pa = `${data['upi-account']?.trim()}@${data['upi-ifsc']?.trim().toUpperCase()}.ifsc.npci`;
      else if (method === 'aadhaar') pa = `${data['upi-aadhaar']?.trim()}@aadhaar.npci`;
      else if (method === 'mobile') {
        const mNum = data['upi-mobile']?.trim();
        if (mNum?.length !== 10) return alert("Enter 10-digit mobile number.");
        pa = `${mNum}@upi`;
      }
      if(!pa) return null;
      const pn = encodeURIComponent(data['upi-payee']?.trim() || "Payee");
      const am = data['upi-amount'];
      const tn = encodeURIComponent(data['upi-note']?.trim() || "");
      let payload = `upi://pay?pa=${pa}&pn=${pn}&cu=INR`;
      if (am) payload += `&am=${am}`;
      if (tn) payload += `&tn=${tn}`;
      return payload;
    }
  },
  wifi: {
    label: "Wi-Fi Network",
    fields: [
      { id: "wifi-ssid", type: "text", placeholder: "Network Name (SSID)", ariaLabel: "Wi-Fi Network Name" },
      { id: "wifi-pass", type: "text", placeholder: "Password", ariaLabel: "Wi-Fi Password" },
      { id: "wifi-sec", type: "select", options: [{value: "WPA", label: "WPA/WPA2"}, {value: "WEP", label: "WEP"}, {value: "nopass", label: "None"}], ariaLabel: "Wi-Fi Security Type" },
      { id: "wifi-hidden", type: "checkbox", label: "Hidden Network", ariaLabel: "Is network hidden?" }
    ],
    getPayload: (data) => `WIFI:S:${data['wifi-ssid']};T:${data['wifi-sec']};P:${data['wifi-pass']};H:${data['wifi-hidden'] ? 'true' : 'false'};;`
  },
  vcard: {
    label: "Contact (vCard)",
    fields: [
      { id: "vcard-name", type: "text", placeholder: "Full Name", ariaLabel: "Contact Full Name" },
      { id: "vcard-org", type: "text", placeholder: "Organization / Company", ariaLabel: "Contact Organization" },
      { id: "vcard-phone", type: "tel", placeholder: "Phone Number", numericOnly: true, ariaLabel: "Contact Phone Number" },
      { id: "vcard-email", type: "email", placeholder: "Email Address", ariaLabel: "Contact Email Address" },
      { id: "vcard-web", type: "url", placeholder: "Website URL", ariaLabel: "Contact Website URL" },
      { id: "vcard-bday", type: "date", label: "Birthdate", ariaLabel: "Contact Birthdate" },
      { id: "vcard-address", type: "textarea", placeholder: "Full Address", ariaLabel: "Contact Full Address" }
    ],
    getPayload: (data) => {
      let payload = `BEGIN:VCARD\nVERSION:3.0\nN:${data['vcard-name']}\nFN:${data['vcard-name']}\n`;
      if(data['vcard-org']) payload += `ORG:${data['vcard-org']}\n`;
      if(data['vcard-phone']) payload += `TEL;TYPE=CELL:${data['vcard-phone']}\n`;
      if(data['vcard-email']) payload += `EMAIL:${data['vcard-email']}\n`;
      if(data['vcard-web']) payload += `URL:${data['vcard-web']}\n`;
      if(data['vcard-bday']) payload += `BDAY:${data['vcard-bday']}\n`;
      if(data['vcard-address']) payload += `ADR;TYPE=HOME:;;${data['vcard-address']};;;;\n`;
      return payload + `END:VCARD`;
    }
  },
  email: {
    label: "Email",
    fields: [
      { id: "email-address", type: "email", placeholder: "Recipient Email", ariaLabel: "Recipient Email Address" },
      { id: "email-sub", type: "text", placeholder: "Subject", ariaLabel: "Email Subject" },
      { id: "email-body", type: "textarea", placeholder: "Body Text", rows: 4, ariaLabel: "Email Body Text" }
    ],
    getPayload: (data) => `mailto:${data['email-address']}?subject=${encodeURIComponent(data['email-sub'] || '')}&body=${encodeURIComponent(data['email-body'] || '')}`
  },
  sms: {
    label: "Phone / SMS",
    fields: [
      { id: "sms-phone", type: "tel", placeholder: "Phone Number", numericOnly: true, ariaLabel: "Phone Number" },
      { id: "sms-checkbox", type: "checkbox", label: "Format as SMS", checked: true, ariaLabel: "Format output as SMS instead of phone call" },
      { id: "sms-msg", type: "textarea", placeholder: "Message content...", rows: 3, ariaLabel: "SMS Message Content" }
    ],
    getPayload: (data) => data['sms-checkbox'] ? `smsto:${data['sms-phone']}:${data['sms-msg'] || ''}` : `tel:${data['sms-phone']}`
  },
  event: {
    label: "Calendar Event",
    fields: [
      { id: "event-title", type: "text", placeholder: "Event Title", ariaLabel: "Event Title" },
      { id: "event-loc", type: "text", placeholder: "Location", ariaLabel: "Event Location" },
      { id: "event-desc", type: "textarea", placeholder: "Description", rows: 3, ariaLabel: "Event Description" },
      { id: "event-start", type: "datetime-local", label: "Start", ariaLabel: "Event Start Date and Time" },
      { id: "event-end", type: "datetime-local", label: "End", ariaLabel: "Event End Date and Time" }
    ],
    getPayload: (data) => {
      let payload = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${data['event-title']}\n`;
      if(data['event-loc']) payload += `LOCATION:${data['event-loc']}\n`;
      if(data['event-desc']) payload += `DESCRIPTION:${data['event-desc']}\n`;
      if(data['event-start']) payload += `DTSTART:${formatIcalDate(data['event-start'])}\n`;
      if(data['event-end']) payload += `DTEND:${formatIcalDate(data['event-end'])}\n`;
      return payload + `END:VEVENT\nEND:VCALENDAR`;
    }
  }
};

// ==========================================
// 2. UI RENDERING ENGINE 
// ==========================================
const typeSelect = document.getElementById('qr-type');
const formContainer = document.getElementById('dynamic-form-container');

Object.keys(qrConfig).forEach(key => {
  const opt = document.createElement('option');
  opt.value = key;
  opt.innerText = qrConfig[key].label;
  typeSelect.appendChild(opt);
});

function createFieldNode(field) {
  if (field.type === 'group') {
    const groupDiv = document.createElement('div');
    if (field.wrapperId) groupDiv.id = field.wrapperId;
    if (field.style) groupDiv.style.cssText = field.style;
    groupDiv.className = 'field-group';
    field.fields.forEach(f => groupDiv.appendChild(createFieldNode(f)));
    return groupDiv;
  }

  const wrapper = document.createElement('div');
  if (field.wrapperId) wrapper.id = field.wrapperId;
  if (field.style) wrapper.style.cssText = field.style;

  if (field.label && field.type !== 'checkbox') {
    const lbl = document.createElement('label');
    lbl.className = 'field-label';
    lbl.innerText = field.label;
    lbl.setAttribute('for', field.id);
    wrapper.appendChild(lbl);
  }

  let inputEl;

  if (field.type === 'checkbox') {
    const label = document.createElement('label');
    label.className = 'checkbox-label';
    inputEl = document.createElement('input');
    inputEl.type = 'checkbox';
    if (field.checked) inputEl.checked = true;
    label.appendChild(inputEl);
    label.appendChild(document.createTextNode(' ' + field.label));
    wrapper.appendChild(label);
  } else if (field.type === 'select') {
    inputEl = document.createElement('select');
    inputEl.className = 'm3-input';
    field.options.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.innerText = opt.label;
      inputEl.appendChild(option);
    });
    if (field.onChange) inputEl.addEventListener('change', field.onChange);
    wrapper.appendChild(inputEl);
  } else if (field.type === 'textarea') {
    inputEl = document.createElement('textarea');
    inputEl.className = 'm3-input';
    if (field.rows) inputEl.rows = field.rows;
    wrapper.appendChild(inputEl);
  } else {
    inputEl = document.createElement('input');
    inputEl.type = field.type;
    inputEl.className = 'm3-input';
    if (field.maxlength) inputEl.maxLength = field.maxlength;
    if (field.inputmode) inputEl.inputMode = field.inputmode;
    if (field.pattern) inputEl.pattern = field.pattern;
    if (field.numericOnly) {
      inputEl.addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, ''); });
    }
    wrapper.appendChild(inputEl);
  }

  inputEl.id = field.id;
  if (field.placeholder) inputEl.placeholder = field.placeholder;
  inputEl.setAttribute('aria-label', field.ariaLabel || field.label || field.placeholder || 'Input Field');

  return wrapper;
}

function renderForm(typeKey) {
  formContainer.innerHTML = '';
  const fields = qrConfig[typeKey].fields;
  fields.forEach(field => {
    formContainer.appendChild(createFieldNode(field));
    if (field.type === 'select' && field.onChange) {
      document.getElementById(field.id).dispatchEvent(new Event('change'));
    }
  });
}

function extractFormData(fields, dataObj = {}) {
  fields.forEach(field => {
    if (field.type === 'group') {
      extractFormData(field.fields, dataObj);
    } else {
      const el = document.getElementById(field.id);
      if (el) dataObj[field.id] = field.type === 'checkbox' ? el.checked : el.value;
    }
  });
  return dataObj;
}

typeSelect.addEventListener('change', (e) => renderForm(e.target.value));
renderForm(Object.keys(qrConfig)[0]); 


// ==========================================
// 3. CONTRAST MATH & PERSISTENCE
// ==========================================
// Math to calculate relative luminance & contrast ratio
function hexToRgb(hex) {
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  return {r, g, b};
}

function getLuminance(r, g, b) {
  let a = [r, g, b].map(function (v) {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function updateContrastUI() {
  const fg = document.getElementById('color-fg').value;
  const bg = document.getElementById('color-bg').value;
  
  let rgb1 = hexToRgb(fg);
  let rgb2 = hexToRgb(bg);
  let lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  let lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  let brightest = Math.max(lum1, lum2);
  let darkest = Math.min(lum1, lum2);
  let ratio = ((brightest + 0.05) / (darkest + 0.05)).toFixed(2);
  
  const contrastText = document.getElementById('contrast-text');
  const contrastSub = document.getElementById('contrast-subtext');

  if (ratio >= 7) {
    contrastText.innerHTML = `✅ Contrast: ${ratio}:1 (Excellent)`;
    contrastSub.innerText = "Cameras will read this instantly.";
  } else if (ratio >= 4.5) {
    contrastText.innerHTML = `⚠️ Contrast: ${ratio}:1 (Good)`;
    contrastSub.innerText = "Passable, but poor cameras might struggle.";
  } else {
    contrastText.innerHTML = `❌ Contrast: ${ratio}:1 (Poor)`;
    contrastSub.innerText = "Warning: Scanners may fail to read this QR code. Increase contrast.";
  }
}

const fgInput = document.getElementById('color-fg');
const bgInput = document.getElementById('color-bg');
const ecInput = document.getElementById('error-correction');

fgInput.value = localStorage.getItem('qr_fg') || '#000000';
bgInput.value = localStorage.getItem('qr_bg') || '#ffffff';
ecInput.value = localStorage.getItem('qr_ec') || 'M';

const saveSettings = () => {
  localStorage.setItem('qr_fg', fgInput.value);
  localStorage.setItem('qr_bg', bgInput.value);
  localStorage.setItem('qr_ec', ecInput.value);
  updateContrastUI();
};

fgInput.addEventListener('input', saveSettings);
bgInput.addEventListener('input', saveSettings);
ecInput.addEventListener('change', saveSettings);
updateContrastUI(); // Init contrast on load

// App Theme Logic
const appThemeSelector = document.getElementById('app-theme-selector');
appThemeSelector.value = localStorage.getItem('qr_app_theme') || 'system';

appThemeSelector.addEventListener('change', (e) => {
  const selectedTheme = e.target.value;
  localStorage.setItem('qr_app_theme', selectedTheme);
  if (selectedTheme === 'system') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', selectedTheme);
});

// Logo Logic
const logoInput = document.getElementById('logo-input');
const logoPreviewContainer = document.getElementById('logo-preview-container');
const logoPreview = document.getElementById('logo-preview');
let savedLogoData = localStorage.getItem('qr_logo') || null;

if (savedLogoData) {
  logoPreview.src = savedLogoData;
  logoPreviewContainer.style.display = 'flex';
}

logoInput.addEventListener('change', (e) => {
  if (e.target.files[0]) {
    const reader = new FileReader();
    reader.onload = (event) => {
      savedLogoData = event.target.result;
      try {
        localStorage.setItem('qr_logo', savedLogoData);
        logoPreview.src = savedLogoData;
        logoPreviewContainer.style.display = 'flex';
      } catch(err) { alert("Image too large to save permanently. It will be used for this session only."); }
    };
    reader.readAsDataURL(e.target.files[0]);
  }
});

// Settings - Clear Logo Event
document.getElementById('btn-clear-logo').addEventListener('click', () => {
  savedLogoData = null;
  localStorage.removeItem('qr_logo');
  logoPreviewContainer.style.display = 'none';
  logoInput.value = '';
});


// ==========================================
// 4. GENERATION & SCANNING LOGIC
// ==========================================
// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', () => navigator.serviceWorker.register('/service-worker.js'));
// }

const navItems = document.querySelectorAll('.nav-item');
const views = document.querySelectorAll('.view');
navItems.forEach(item => {
  item.addEventListener('click', () => {
    navItems.forEach(nav => nav.classList.remove('active'));
    views.forEach(view => view.classList.remove('active'));
    item.classList.add('active');
    document.getElementById(item.dataset.target).classList.add('active');
  });
});

let currentQrStylingInstance = null;

document.getElementById('btn-generate').addEventListener('click', () => {
  const container = document.getElementById('qr-canvas-container');
  container.innerHTML = ''; 
  const typeKey = typeSelect.value;
  
  const rawData = extractFormData(qrConfig[typeKey].fields);
  const qrPayload = qrConfig[typeKey].getPayload(rawData);

  if (!qrPayload) return alert("Please provide valid data to generate the QR.");

  currentQrStylingInstance = new QRCodeStyling({
    width: 300, height: 300, type: "canvas", data: qrPayload,
    image: savedLogoData,
    dotsOptions: { color: fgInput.value, type: "square" },
    backgroundOptions: { color: bgInput.value },
    imageOptions: { crossOrigin: "anonymous", margin: 10 },
    qrOptions: { errorCorrectionLevel: savedLogoData ? 'H' : ecInput.value }
  });

  currentQrStylingInstance.append(container);
  
  const resultCard = document.getElementById('qr-result-card');
  resultCard.style.display = 'block';
  setTimeout(() => resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
});

// Create View - Clear QR Event
document.getElementById('btn-clear-qr-result').addEventListener('click', () => {
  document.getElementById('qr-canvas-container').innerHTML = '';
  document.getElementById('qr-result-card').style.display = 'none';
  currentQrStylingInstance = null;
});

document.getElementById('btn-download').onclick = () => {
  if (currentQrStylingInstance) currentQrStylingInstance.download({ name: `QR_${typeSelect.value}_${Date.now()}`, extension: "png" });
};

document.getElementById('btn-share-qr').onclick = async () => {
  const canvas = document.getElementById('qr-canvas-container').querySelector('canvas');
  if (canvas && navigator.canShare) {
    canvas.toBlob(async (blob) => {
      try { await navigator.share({ title: 'QR Code', files: [new File([blob], 'qrcode.png', { type: 'image/png' })] }); } 
      catch (err) { console.log('Share failed'); }
    });
  } else alert("Sharing not supported on this browser.");
};

// Scanner
let html5QrCode;
const scanResultCard = document.getElementById('scan-result-card');
const scanResultText = document.getElementById('scan-result-text');
const scanImagePreview = document.getElementById('scan-image-preview');

function handleScanSuccess(decodedText, isFile = false) {
  scanResultCard.style.display = 'block';
  scanResultText.value = decodedText;
  
  if (!isFile) scanImagePreview.style.display = 'none'; // Only show image preview if uploaded
  
  if(html5QrCode?.isScanning) {
    html5QrCode.stop();
    document.getElementById('btn-start-scan').style.display = 'inline-flex';
    document.getElementById('btn-stop-scan').style.display = 'none';
  }
  scanResultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

document.getElementById('btn-start-scan').addEventListener('click', () => {
  if(!html5QrCode) html5QrCode = new Html5Qrcode("reader");
  html5QrCode.start(
    { facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 250 } },
    (txt) => handleScanSuccess(txt, false), () => {}
  ).then(() => {
    document.getElementById('btn-start-scan').style.display = 'none';
    document.getElementById('btn-stop-scan').style.display = 'inline-flex';
  }).catch(() => alert("Camera access denied."));
});

document.getElementById('btn-stop-scan').addEventListener('click', () => {
  if(html5QrCode) {
    html5QrCode.stop();
    document.getElementById('btn-start-scan').style.display = 'inline-flex';
    document.getElementById('btn-stop-scan').style.display = 'none';
  }
});

document.getElementById('qr-file-upload').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    if(!html5QrCode) html5QrCode = new Html5Qrcode("reader");
    html5QrCode.scanFile(file, true)
      .then((txt) => {
        // Show preview of uploaded file
        const reader = new FileReader();
        reader.onload = (e) => {
          scanImagePreview.src = e.target.result;
          scanImagePreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
        handleScanSuccess(txt, true);
      })
      .catch(() => alert("Could not find a QR code in that image."));
  }
});

// Scan View - Clear Scan Result Event
document.getElementById('btn-clear-scan-result').addEventListener('click', () => {
  scanResultCard.style.display = 'none';
  scanResultText.value = '';
  scanImagePreview.style.display = 'none';
  scanImagePreview.src = '';
  document.getElementById('qr-file-upload').value = '';
});

document.getElementById('btn-copy-result').onclick = () => navigator.clipboard.writeText(scanResultText.value).then(() => alert("Copied!"));
document.getElementById('btn-share-result').onclick = () => { if (navigator.share) navigator.share({ text: scanResultText.value }); };


// ==========================================
// 5. URL ROUTING & DEEP-LINK INTERCEPTION
// ==========================================

// SINGLE declaration for the entire app routing logic
const urlParams = new URLSearchParams(window.location.search);

// 1. If app was opened via shortcut or shared image, switch to Scan tab
if (urlParams.get('action') === 'scan' || urlParams.get('shared_file') === 'true') {
  document.querySelector('[data-target="scan-view"]').click();
}

// 2. If app was opened via OS Image Share, fetch the cached image and scan it
if (urlParams.get('shared_file') === 'true') {
  if ('caches' in window) {
    caches.open('qr-shared-image-cache').then(cache => {
      cache.match('/shared-image-temp').then(response => {
        if (response) {
          response.blob().then(blob => {
            const file = new File([blob], "shared_qr.jpg", { type: blob.type });
            
            // Show preview to the user
            const reader = new FileReader();
            reader.onload = (e) => {
              scanImagePreview.src = e.target.result;
              scanImagePreview.style.display = 'block';
            };
            reader.readAsDataURL(file);

            // Execute Scan
            if (!html5QrCode) html5QrCode = new Html5Qrcode("reader");
            html5QrCode.scanFile(file, true)
              .then(txt => handleScanSuccess(txt, true))
              .catch(() => alert("No QR code found in the shared image."));
            
            // Clean up cache after processing to save space
            cache.delete('/shared-image-temp');
          });
        }
      });
    });
  }
}