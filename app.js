// ==========================================
// 1. DYNAMIC CONFIGURATION ENGINE
// ==========================================
const formatIcalDate = (dt) =>
  dt ? new Date(dt).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z" : "";

const qrConfig = {
  text: {
    label: "Plain Text",
    fields: [
      {
        id: "input-text",
        type: "textarea",
        placeholder: "Enter plain text...",
        rows: 4,
        ariaLabel: "Plain text input",
      },
    ],
    getPayload: (data) => data["input-text"],
  },
  url: {
    label: "URL / Website",
    fields: [
      {
        id: "url-input",
        type: "url",
        placeholder: "https://example.com",
        ariaLabel: "Website URL",
      },
      {
        id: "url-src",
        type: "text",
        placeholder: "UTM Source (Optional)",
        ariaLabel: "UTM Source",
      },
      {
        id: "url-med",
        type: "text",
        placeholder: "UTM Medium (Optional)",
        ariaLabel: "UTM Medium",
      },
      {
        id: "url-name",
        type: "text",
        placeholder: "UTM Campaign Name (Optional)",
        ariaLabel: "UTM Campaign Name",
      },
    ],
    getPayload: (data) => {
      let baseUri = data["url-input"];
      if (!baseUri) return null;
      if (data["url-src"] || data["url-med"] || data["url-name"]) {
        const url = new URL(
          baseUri.startsWith("http") ? baseUri : "https://" + baseUri,
        );
        if (data["url-src"])
          url.searchParams.append("utm_source", data["url-src"]);
        if (data["url-med"])
          url.searchParams.append("utm_medium", data["url-med"]);
        if (data["url-name"])
          url.searchParams.append("utm_campaign", data["url-name"]);
        return url.toString();
      }
      return baseUri;
    },
  },
  upi: {
    label: "UPI Payment",
    fields: [
      {
        id: "upi-method",
        type: "select",
        ariaLabel: "Select UPI routing method",
        options: [
          { value: "vpa", label: "UPI ID / VPA" },
          { value: "bank", label: "Bank Account + IFSC" },
          { value: "aadhaar", label: "Aadhaar Mapping" },
          { value: "mobile", label: "Mobile Number" },
        ],
        onChange: (e) => {
          const v = e.target.value;
          const getEl = (id) => document.getElementById(id) || { style: {} };
          getEl("wrap-upi-id").style.display = v === "vpa" ? "block" : "none";
          getEl("wrap-upi-bank").style.display = v === "bank" ? "flex" : "none";
          getEl("wrap-upi-aadhaar").style.display =
            v === "aadhaar" ? "block" : "none";
          getEl("wrap-upi-mobile").style.display =
            v === "mobile" ? "block" : "none";
        },
      },
      {
        id: "upi-id",
        type: "text",
        placeholder: "e.g., username@bank",
        wrapperId: "wrap-upi-id",
        ariaLabel: "UPI ID or VPA",
      },
      {
        id: "upi-bank",
        type: "group",
        wrapperId: "wrap-upi-bank",
        style: "display:none;",
        fields: [
          {
            id: "upi-account",
            type: "text",
            placeholder: "Bank Account Number",
            numericOnly: true,
            inputmode: "numeric",
            ariaLabel: "Bank Account Number",
          },
          {
            id: "upi-ifsc",
            type: "text",
            placeholder: "IFSC Code",
            ariaLabel: "IFSC Code",
          },
        ],
      },
      {
        id: "upi-aadhaar",
        type: "text",
        placeholder: "[Aadhaar Redacted]",
        maxlength: "12",
        wrapperId: "wrap-upi-aadhaar",
        style: "display:none;",
        numericOnly: true,
        inputmode: "numeric",
        pattern: "[0-9]*",
        ariaLabel: "12-digit Aadhaar Number",
      },
      {
        id: "upi-mobile",
        type: "tel",
        placeholder: "10-Digit Mobile Number",
        maxlength: "10",
        wrapperId: "wrap-upi-mobile",
        style: "display:none;",
        numericOnly: true,
        inputmode: "numeric",
        pattern: "[0-9]*",
        ariaLabel: "10-digit Mobile Number",
      },
      {
        id: "upi-payee",
        type: "text",
        placeholder: "Payee Name",
        ariaLabel: "Payee Name",
      },
      {
        id: "upi-amount",
        type: "number",
        placeholder: "Amount (Optional)",
        ariaLabel: "Payment Amount in INR",
        onChange: (e) => {
          const splitWrap = document.getElementById("wrap-upi-split");
          if (splitWrap)
            splitWrap.style.display =
              Number(e.target.value) > 1999 ? "block" : "none";
        },
      },
      {
        id: "upi-split",
        type: "checkbox",
        label: "Split into 1999 INR chunks",
        wrapperId: "wrap-upi-split",
        style: "display:none;",
        ariaLabel: "Split large payments",
      },
      {
        id: "upi-note",
        type: "text",
        placeholder: "Note (Optional)",
        ariaLabel: "Payment Note",
      },
    ],
    getPayload: (data) => {
      const method = data["upi-method"];
      let pa = "";
      if (method === "vpa") pa = data["upi-id"]?.trim();
      else if (method === "bank")
        pa = `${data["upi-account"]?.trim()}@${data["upi-ifsc"]?.trim().toUpperCase()}.ifsc.npci`;
      else if (method === "aadhaar")
        pa = `${data["upi-aadhaar"]?.trim()}@aadhaar.npci`;
      else if (method === "mobile") {
        const mNum = data["upi-mobile"]?.trim();
        if (mNum?.length !== 10) return alert("Enter 10-digit mobile number.");
        pa = `${mNum}@upi`;
      }
      if (!pa) return null;

      const pn = encodeURIComponent(data["upi-payee"]?.trim() || "Payee");
      const am = data["upi-amount"];
      const rawTn = data["upi-note"]?.trim() || "";

      let basePayload = `upi://pay?pa=${pa}&pn=${pn}&cu=INR`;

      // Check if amount is > 2000 and the user checked the split box
      if (data["upi-split"] && am && Number(am) > 2000) {
        let total = Number(am);
        let chunks = [];
        const totalChunks = Math.ceil(total / 1999); // Calculate X (total number of chunks)

        for (let i = 1; i <= totalChunks; i++) {
          let chunkAm = Math.min(total, 1999);

          // Append "1 of X", etc., to the user's note (or create the note if blank)
          let chunkNote = rawTn
            ? `${rawTn} ${i} of ${totalChunks}`
            : `${i} of ${totalChunks}`;

          chunks.push(
            `${basePayload}&am=${chunkAm}&tn=${encodeURIComponent(chunkNote)}`,
          );
          total -= chunkAm;
        }
        return chunks;
      } else {
        // Standard single QR Generation
        let payload = basePayload;
        if (am) payload += `&am=${am}`;
        if (rawTn) payload += `&tn=${encodeURIComponent(rawTn)}`;
        return payload;
      }
    },
  },
  geo: {
      label: "Location (Geo-coordinates)",
      fields: [
        { type: "group", fields: [
          { id: "geo-lat", type: "text", placeholder: "Latitude (e.g., 40.7128)", inputmode: "decimal" },
          { id: "geo-lng", type: "text", placeholder: "Longitude (e.g., -74.0060)", inputmode: "decimal" }
        ]}
      ],
      getPayload: (data) => {
        const lat = data['geo-lat']?.trim();
        const lng = data['geo-lng']?.trim();
        return (lat && lng) ? `geo:${lat},${lng}` : null;
      }
    },
  wifi: {
    label: "Wi-Fi Network",
    fields: [
      {
        id: "wifi-ssid",
        type: "text",
        placeholder: "Network Name (SSID)",
        ariaLabel: "Wi-Fi Network Name",
      },
      {
        id: "wifi-pass",
        type: "text",
        placeholder: "Password",
        ariaLabel: "Wi-Fi Password",
      },
      {
        id: "wifi-sec",
        type: "select",
        options: [
          { value: "WPA", label: "WPA/WPA2" },
          { value: "WEP", label: "WEP" },
          { value: "nopass", label: "None" },
        ],
        ariaLabel: "Wi-Fi Security Type",
      },
      {
        id: "wifi-hidden",
        type: "checkbox",
        label: "Hidden Network",
        ariaLabel: "Is network hidden?",
      },
    ],
    getPayload: (data) =>
      `WIFI:S:${data["wifi-ssid"]};T:${data["wifi-sec"]};P:${data["wifi-pass"]};H:${data["wifi-hidden"] ? "true" : "false"};;`,
  },
  vcard: {
    label: "Contact (vCard)",
    fields: [
      {
        type: "group",
        fields: [
          { id: "vcard-prefix", type: "text", placeholder: "Prefix" },
          { id: "vcard-first", type: "text", placeholder: "First Name *" },
          { id: "vcard-middle", type: "text", placeholder: "Middle Name" },
        ],
      },
      {
        type: "group",
        fields: [
          { id: "vcard-last", type: "text", placeholder: "Last Name *" },
          { id: "vcard-suffix", type: "text", placeholder: "Suffix" },
          { id: "vcard-nickname", type: "text", placeholder: "Nickname" },
        ],
      },
      {
        type: "group",
        fields: [
          {
            id: "vcard-phone-home",
            type: "tel",
            placeholder: "Personal Phone *",
          },
          {
            id: "vcard-email-home",
            type: "email",
            placeholder: "Personal Email *",
          },
        ],
      },
      {
        type: "group",
        fields: [
          { id: "vcard-phone-work", type: "tel", placeholder: "Work Phone" },
          { id: "vcard-email-work", type: "email", placeholder: "Work Email" },
        ],
      },
      {
        type: "group",
        fields: [
          { id: "vcard-org", type: "text", placeholder: "Organization" },
          { id: "vcard-title", type: "text", placeholder: "Title" },
          { id: "vcard-role", type: "text", placeholder: "Role" },
        ],
      },
      {
        type: "group",
        fields: [
          {
            id: "vcard-gender",
            type: "select",
            label: "Gender",
            ariaLabel: "Gender",
            options: [
              { value: "", label: "Select Gender" },
              { value: "M", label: "Male" },
              { value: "F", label: "Female" },
              { value: "O", label: "Other" },
            ],
          },
          { id: "vcard-bday", type: "date", label: "Birthday" },
          { id: "vcard-anniversary", type: "date", label: "Anniversary" },
        ],
      },

      // Home Address
      {
        id: "vcard-adr-home-label",
        type: "text",
        placeholder: "Home Address Label (e.g., Summer House)",
      },
      { id: "vcard-adr-home-street", type: "text", placeholder: "Home Street" },
      {
        type: "group",
        fields: [
          { id: "vcard-adr-home-city", type: "text", placeholder: "Home City" },
          {
            id: "vcard-adr-home-state",
            type: "text",
            placeholder: "Home State",
          },
        ],
      },
      {
        type: "group",
        fields: [
          {
            id: "vcard-adr-home-zip",
            type: "text",
            placeholder: "Home Postal Code",
          },
          {
            id: "vcard-adr-home-country",
            type: "text",
            placeholder: "Home Country",
          },
        ],
      },

      // Work Address
      {
        id: "vcard-adr-work-label",
        type: "text",
        placeholder: "Work Address Label (e.g., HQ)",
      },
      { id: "vcard-adr-work-street", type: "text", placeholder: "Work Street" },
      {
        type: "group",
        fields: [
          { id: "vcard-adr-work-city", type: "text", placeholder: "Work City" },
          {
            id: "vcard-adr-work-state",
            type: "text",
            placeholder: "Work State",
          },
        ],
      },
      {
        type: "group",
        fields: [
          {
            id: "vcard-adr-work-zip",
            type: "text",
            placeholder: "Work Postal Code",
          },
          {
            id: "vcard-adr-work-country",
            type: "text",
            placeholder: "Work Country",
          },
        ],
      },

      // Links & Socials
      {
        type: "group",
        fields: [
          {
            id: "vcard-url-personal",
            type: "url",
            placeholder: "Personal URL",
          },
          { id: "vcard-url-work", type: "url", placeholder: "Work URL" },
        ],
      },
      {
        type: "group",
        fields: [
          {
            id: "vcard-linkedin",
            type: "url",
            placeholder: "LinkedIn Profile URL",
          },
          {
            id: "vcard-twitter",
            type: "url",
            placeholder: "Twitter Profile URL",
          },
        ],
      },
      {
        type: "group",
        fields: [
          {
            id: "vcard-instagram",
            type: "url",
            placeholder: "Instagram Profile URL",
          },
          {
            id: "vcard-url-custom",
            type: "text",
            placeholder: "Custom Links (comma separated)",
          },
        ],
      },

      {
        id: "vcard-note",
        type: "textarea",
        placeholder: "Notes / Details...",
        rows: 3,
      },
    ],
    getPayload: (data) => {
      // 1. Validate Mandatory Fields
      const first = data["vcard-first"]?.trim();
      const last = data["vcard-last"]?.trim();
      const emailHome = data["vcard-email-home"]?.trim();
      const phoneHome = data["vcard-phone-home"]?.trim();

      if (!first || !last || !emailHome || !phoneHome) {
        alert(
          "First Name, Last Name, Personal Email, and Personal Phone are mandatory.",
        );
        return null;
      }

      const prefix = data["vcard-prefix"]?.trim() || "";
      const middle = data["vcard-middle"]?.trim() || "";
      const suffix = data["vcard-suffix"]?.trim() || "";

      let payload = `BEGIN:VCARD\nVERSION:3.0\n`;

      // Name Construction (N: Last;First;Middle;Prefix;Suffix)
      payload += `N:${last};${first};${middle};${prefix};${suffix}\n`;
      let fn = [prefix, first, middle, last, suffix].filter(Boolean).join(" ");
      payload += `FN:${fn}\n`;

      // Demographics & Professional
      if (data["vcard-nickname"])
        payload += `NICKNAME:${data["vcard-nickname"].trim()}\n`;
      if (data["vcard-gender"]) payload += `GENDER:${data["vcard-gender"]}\n`;
      if (data["vcard-org"]) payload += `ORG:${data["vcard-org"].trim()}\n`;
      if (data["vcard-title"])
        payload += `TITLE:${data["vcard-title"].trim()}\n`;
      if (data["vcard-role"]) payload += `ROLE:${data["vcard-role"].trim()}\n`;

      // Phone & Email
      payload += `TEL;TYPE=CELL:${phoneHome}\n`;
      payload += `EMAIL;TYPE=HOME:${emailHome}\n`;
      if (data["vcard-phone-work"])
        payload += `TEL;TYPE=WORK:${data["vcard-phone-work"].trim()}\n`;
      if (data["vcard-email-work"])
        payload += `EMAIL;TYPE=WORK:${data["vcard-email-work"].trim()}\n`;

      // Dates
      if (data["vcard-bday"]) payload += `BDAY:${data["vcard-bday"]}\n`;
      if (data["vcard-anniversary"])
        payload += `ANNIVERSARY:${data["vcard-anniversary"]}\n`;

      // Address Formatter
      const formatAdr = (street, city, state, zip, country) =>
        `;;${street || ""};${city || ""};${state || ""};${zip || ""};${country || ""}`;

      // Home Address (with Apple Address Book custom label support mapping)
      const homeStreet = data["vcard-adr-home-street"]?.trim();
      const homeCity = data["vcard-adr-home-city"]?.trim();
      const homeState = data["vcard-adr-home-state"]?.trim();
      const homeZip = data["vcard-adr-home-zip"]?.trim();
      const homeCountry = data["vcard-adr-home-country"]?.trim();
      const homeLabel = data["vcard-adr-home-label"]?.trim();
      if (homeStreet || homeCity || homeState || homeZip || homeCountry) {
        if (homeLabel) {
          payload += `item1.ADR;TYPE=HOME:${formatAdr(homeStreet, homeCity, homeState, homeZip, homeCountry)}\n`;
          payload += `item1.X-ABLabel:${homeLabel}\n`;
        } else {
          payload += `ADR;TYPE=HOME:${formatAdr(homeStreet, homeCity, homeState, homeZip, homeCountry)}\n`;
        }
      }

      // Work Address
      const workStreet = data["vcard-adr-work-street"]?.trim();
      const workCity = data["vcard-adr-work-city"]?.trim();
      const workState = data["vcard-adr-work-state"]?.trim();
      const workZip = data["vcard-adr-work-zip"]?.trim();
      const workCountry = data["vcard-adr-work-country"]?.trim();
      const workLabel = data["vcard-adr-work-label"]?.trim();
      if (workStreet || workCity || workState || workZip || workCountry) {
        if (workLabel) {
          payload += `item2.ADR;TYPE=WORK:${formatAdr(workStreet, workCity, workState, workZip, workCountry)}\n`;
          payload += `item2.X-ABLabel:${workLabel}\n`;
        } else {
          payload += `ADR;TYPE=WORK:${formatAdr(workStreet, workCity, workState, workZip, workCountry)}\n`;
        }
      }

      // URLs & Social Profiles
      if (data["vcard-url-personal"])
        payload += `URL;TYPE=HOME:${data["vcard-url-personal"].trim()}\n`;
      if (data["vcard-url-work"])
        payload += `URL;TYPE=WORK:${data["vcard-url-work"].trim()}\n`;
      if (data["vcard-linkedin"])
        payload += `X-SOCIALPROFILE;TYPE=linkedin:${data["vcard-linkedin"].trim()}\n`;
      if (data["vcard-twitter"])
        payload += `X-SOCIALPROFILE;TYPE=twitter:${data["vcard-twitter"].trim()}\n`;
      if (data["vcard-instagram"])
        payload += `X-SOCIALPROFILE;TYPE=instagram:${data["vcard-instagram"].trim()}\n`;

      // Handling Comma-separated Custom URLs
      if (data["vcard-url-custom"]) {
        const links = data["vcard-url-custom"].split(",");
        links.forEach((link) => {
          if (link.trim()) payload += `URL:${link.trim()}\n`;
        });
      }

      // Notes (Newlines must be escaped for vCard)
      if (data["vcard-note"]) {
        let note = data["vcard-note"].replace(/\n/g, "\\n");
        payload += `NOTE:${note}\n`;
      }

      payload += `END:VCARD`;
      return payload;
    },
  },
  email: {
    label: "Email",
    fields: [
      {
        id: "email-address",
        type: "email",
        placeholder: "Recipient Email",
        ariaLabel: "Recipient Email Address",
      },
      {
        id: "email-sub",
        type: "text",
        placeholder: "Subject",
        ariaLabel: "Email Subject",
      },
      {
        id: "email-body",
        type: "textarea",
        placeholder: "Body Text",
        rows: 4,
        ariaLabel: "Email Body Text",
      },
    ],
    getPayload: (data) =>
      `mailto:${data["email-address"]}?subject=${encodeURIComponent(data["email-sub"] || "")}&body=${encodeURIComponent(data["email-body"] || "")}`,
  },
  sms: {
    label: "Phone / SMS",
    fields: [
      {
        id: "sms-phone",
        type: "tel",
        placeholder: "Phone Number",
        numericOnly: true,
        ariaLabel: "Phone Number",
      },
      {
        id: "sms-checkbox",
        type: "checkbox",
        label: "Format as SMS",
        checked: true,
        ariaLabel: "Format output as SMS instead of phone call",
        onChange: (e) => {
          const msgBox = document.getElementById("sms-msg");
          if (msgBox) msgBox.disabled = !e.target.checked;
        },
      },
      {
        id: "sms-msg",
        type: "textarea",
        placeholder: "Message content...",
        rows: 3,
        ariaLabel: "SMS Message Content",
      },
    ],
    getPayload: (data) =>
      data["sms-checkbox"]
        ? `smsto:${data["sms-phone"]}:${data["sms-msg"] || ""}`
        : `tel:${data["sms-phone"]}`,
  },
  event: {
    label: "Calendar Event",
    fields: [
      {
        id: "event-title",
        type: "text",
        placeholder: "Event Title",
        ariaLabel: "Event Title",
      },
      {
        id: "event-loc",
        type: "text",
        placeholder: "Location",
        ariaLabel: "Event Location",
      },
      {
        id: "event-desc",
        type: "textarea",
        placeholder: "Description",
        rows: 3,
        ariaLabel: "Event Description",
      },
      {
        id: "event-start",
        type: "datetime-local",
        label: "Start",
        ariaLabel: "Event Start Date and Time",
      },
      {
        id: "event-end",
        type: "datetime-local",
        label: "End",
        ariaLabel: "Event End Date and Time",
      },
    ],
    getPayload: (data) => {
      let payload = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${data["event-title"]}\n`;
      if (data["event-loc"]) payload += `LOCATION:${data["event-loc"]}\n`;
      if (data["event-desc"]) payload += `DESCRIPTION:${data["event-desc"]}\n`;
      if (data["event-start"])
        payload += `DTSTART:${formatIcalDate(data["event-start"])}\n`;
      if (data["event-end"])
        payload += `DTEND:${formatIcalDate(data["event-end"])}\n`;
      return payload + `END:VEVENT\nEND:VCALENDAR`;
    },
  },
};

// ==========================================
// 2. UI RENDERING ENGINE
// ==========================================
const typeSelect = document.getElementById("qr-type");
const formContainer = document.getElementById("dynamic-form-container");

Object.keys(qrConfig).forEach((key) => {
  const opt = document.createElement("option");
  opt.value = key;
  opt.innerText = qrConfig[key].label;
  typeSelect.appendChild(opt);
});

function createFieldNode(field) {
  if (field.type === "group") {
    const groupDiv = document.createElement("div");
    if (field.wrapperId) groupDiv.id = field.wrapperId;
    if (field.style) groupDiv.style.cssText = field.style;
    groupDiv.className = "field-group";
    field.fields.forEach((f) => groupDiv.appendChild(createFieldNode(f)));
    return groupDiv;
  }

  const wrapper = document.createElement("div");
  if (field.wrapperId) wrapper.id = field.wrapperId;
  if (field.style) wrapper.style.cssText = field.style;

  if (field.label && field.type !== "checkbox") {
    const lbl = document.createElement("label");
    lbl.className = "field-label";
    lbl.innerText = field.label;
    lbl.setAttribute("for", field.id);
    wrapper.appendChild(lbl);
  }

  let inputEl;

  if (field.type === "checkbox") {
    const label = document.createElement("label");
    label.className = "checkbox-label";
    inputEl = document.createElement("input");
    inputEl.type = "checkbox";
    if (field.checked) inputEl.checked = true;
    if (field.onChange) inputEl.addEventListener("change", field.onChange);
    label.appendChild(inputEl);
    label.appendChild(document.createTextNode(" " + field.label));
    wrapper.appendChild(label);
  } else if (field.type === "select") {
    inputEl = document.createElement("select");
    inputEl.className = "m3-input";
    field.options.forEach((opt) => {
      const option = document.createElement("option");
      option.value = opt.value;
      option.innerText = opt.label;
      inputEl.appendChild(option);
    });
    if (field.onChange) inputEl.addEventListener("change", field.onChange);
    wrapper.appendChild(inputEl);
  } else if (field.type === "textarea") {
    inputEl = document.createElement("textarea");
    inputEl.className = "m3-input";
    if (field.rows) inputEl.rows = field.rows;
    wrapper.appendChild(inputEl);
  } else {
    inputEl = document.createElement("input");
    inputEl.type = field.type;
    inputEl.className = "m3-input";
    if (field.maxlength) inputEl.maxLength = field.maxlength;
    if (field.inputmode) inputEl.inputMode = field.inputmode;
    if (field.pattern) inputEl.pattern = field.pattern;
    if (field.numericOnly) {
      inputEl.addEventListener("input", (e) => {
        e.target.value = e.target.value.replace(/\D/g, "");
      });
    }
    if (field.onChange) {
      inputEl.addEventListener("input", field.onChange);
    }
    wrapper.appendChild(inputEl);
  }

  inputEl.id = field.id;
  if (field.placeholder) inputEl.placeholder = field.placeholder;
  inputEl.setAttribute(
    "aria-label",
    field.ariaLabel || field.label || field.placeholder || "Input Field",
  );

  return wrapper;
}

function triggerInitialChanges(fields) {
  fields.forEach((field) => {
    if (field.type === "group") {
      triggerInitialChanges(field.fields);
    } else if (field.onChange) {
      const el = document.getElementById(field.id);
      if (el)
        el.dispatchEvent(
          new Event(
            field.type === "select" || field.type === "checkbox"
              ? "change"
              : "input",
          ),
        );
    }
  });
}

function renderForm(typeKey) {
  formContainer.innerHTML = "";
  const fields = qrConfig[typeKey].fields;
  fields.forEach((field) => formContainer.appendChild(createFieldNode(field)));
  triggerInitialChanges(fields);
}

function extractFormData(fields, dataObj = {}) {
  fields.forEach((field) => {
    if (field.type === "group") {
      extractFormData(field.fields, dataObj);
    } else {
      const el = document.getElementById(field.id);
      if (el)
        dataObj[field.id] = field.type === "checkbox" ? el.checked : el.value;
    }
  });
  return dataObj;
}

typeSelect.addEventListener("change", (e) => renderForm(e.target.value));
renderForm(Object.keys(qrConfig)[0]);

// ==========================================
// 3. CONTRAST MATH & PERSISTENCE
// ==========================================
// Math to calculate relative luminance & contrast ratio
function hexToRgb(hex) {
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function getLuminance(r, g, b) {
  let a = [r, g, b].map(function (v) {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function updateContrastUI() {
  const fg = document.getElementById("color-fg").value;
  const bg = document.getElementById("color-bg").value;

  let rgb1 = hexToRgb(fg);
  let rgb2 = hexToRgb(bg);
  let lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  let lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  let brightest = Math.max(lum1, lum2);
  let darkest = Math.min(lum1, lum2);
  let ratio = ((brightest + 0.05) / (darkest + 0.05)).toFixed(2);

  const contrastText = document.getElementById("contrast-text");
  const contrastSub = document.getElementById("contrast-subtext");

  if (ratio >= 7) {
    contrastText.innerHTML = `✅ Contrast: ${ratio}:1 (Excellent)`;
    contrastSub.innerText = "Cameras will read this instantly.";
  } else if (ratio >= 4.5) {
    contrastText.innerHTML = `⚠️ Contrast: ${ratio}:1 (Good)`;
    contrastSub.innerText = "Passable, but poor cameras might struggle.";
  } else {
    contrastText.innerHTML = `❌ Contrast: ${ratio}:1 (Poor)`;
    contrastSub.innerText =
      "Warning: Scanners may fail to read this QR code. Increase contrast.";
  }
}

const fgInput = document.getElementById("color-fg");
const bgInput = document.getElementById("color-bg");
const ecInput = document.getElementById("error-correction");

fgInput.value = localStorage.getItem("qr_fg") || "#000000";
bgInput.value = localStorage.getItem("qr_bg") || "#ffffff";
ecInput.value = localStorage.getItem("qr_ec") || "M";

const saveSettings = () => {
  localStorage.setItem("qr_fg", fgInput.value);
  localStorage.setItem("qr_bg", bgInput.value);
  localStorage.setItem("qr_ec", ecInput.value);
  updateContrastUI();
};

fgInput.addEventListener("input", saveSettings);
bgInput.addEventListener("input", saveSettings);
ecInput.addEventListener("change", saveSettings);
updateContrastUI(); // Init contrast on load

// App Theme Logic
const appThemeSelector = document.getElementById("app-theme-selector");
appThemeSelector.value = localStorage.getItem("qr_app_theme") || "system";

appThemeSelector.addEventListener("change", (e) => {
  const selectedTheme = e.target.value;
  localStorage.setItem("qr_app_theme", selectedTheme);
  if (selectedTheme === "system")
    document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", selectedTheme);
});

// Logo Logic
const logoInput = document.getElementById("logo-input");
const logoPreviewContainer = document.getElementById("logo-preview-container");
const logoPreview = document.getElementById("logo-preview");
let savedLogoData = localStorage.getItem("qr_logo") || null;

if (savedLogoData) {
  logoPreview.src = savedLogoData;
  logoPreviewContainer.style.display = "flex";
}

// Logo Logic
logoInput.addEventListener('change', (e) => {
  if (e.target.files[0]) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Compress image using canvas
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 200; // 200px is highly optimal for a QR center logo
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio preserving dimensions
        if (width > height && width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert back to base64 at 80% WebP quality
        savedLogoData = canvas.toDataURL('image/webp', 0.8);

        try {
          localStorage.setItem('qr_logo', savedLogoData);
          logoPreview.src = savedLogoData;
          logoPreviewContainer.style.display = 'flex';
        } catch(err) {
          alert("Storage limit exceeded. Try clearing cache or using a simpler image.");
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(e.target.files[0]);
  }
});

// Settings - Clear Logo Event
document.getElementById("btn-clear-logo").addEventListener("click", () => {
  savedLogoData = null;
  localStorage.removeItem("qr_logo");
  logoPreviewContainer.style.display = "none";
  logoInput.value = "";
});

// ==========================================
// 4. GENERATION & SCANNING LOGIC
// ==========================================
// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', () => navigator.serviceWorker.register('/service-worker.js'));
// }

const navItems = document.querySelectorAll(".nav-item");
const views = document.querySelectorAll(".view");
navItems.forEach((item) => {
  item.addEventListener("click", () => {
    navItems.forEach((nav) => nav.classList.remove("active"));
    views.forEach((view) => view.classList.remove("active"));
    item.classList.add("active");
    document.getElementById(item.dataset.target).classList.add("active");
  });
});

let currentQrInstances = [];

function chunkString(str, size) {
  const chars = Array.from(str);
  const chunks = [];
  for (let i = 0; i < chars.length; i += size) {
    chunks.push(chars.slice(i, i + size).join(""));
  }
  return chunks;
}

function createQRInstance(data) {
  return new QRCodeStyling({
    width: 300,
    height: 300,
    type: "canvas",
    data: data,
    image: savedLogoData,
    dotsOptions: { color: fgInput.value, type: "square" },
    backgroundOptions: { color: bgInput.value },
    imageOptions: { crossOrigin: "anonymous", margin: 10 },
    qrOptions: { errorCorrectionLevel: savedLogoData ? "H" : ecInput.value },
  });
}

function renderAccordionQRs(payloads, container) {
  container.style.flexDirection = payloads.length > 1 ? "column" : "row";
  currentQrInstances = [];
  payloads.forEach((payload, index) => {
    const details = document.createElement("details");
    details.className = "faq-item";
    details.style.marginBottom = "12px";
    if (index === 0) details.open = true;

    const summary = document.createElement("summary");
    summary.innerText = `QR Code - Part ${index + 1} of ${payloads.length}`;
    details.appendChild(summary);

    const qrWrapper = document.createElement("div");
    qrWrapper.style.padding = "16px";
    qrWrapper.style.display = "flex";
    qrWrapper.style.justifyContent = "center";

    const instance = createQRInstance(payload);
    instance.append(qrWrapper);
    currentQrInstances.push(instance);

    details.appendChild(qrWrapper);
    container.appendChild(details);
  });
}

document.getElementById("btn-generate").addEventListener("click", async () => {
  const container = document.getElementById("qr-canvas-container");
  container.innerHTML = "";
  const typeKey = typeSelect.value;

  const rawData = extractFormData(qrConfig[typeKey].fields);
  let qrPayloads = qrConfig[typeKey].getPayload(rawData);

  if (!qrPayloads)
    return alert("Please provide valid data to generate the QR.");

  if (!Array.isArray(qrPayloads)) qrPayloads = [qrPayloads];

  currentQrInstances = [];
  const resultCard = document.getElementById("qr-result-card");
  resultCard.style.display = "block";

  if (qrPayloads.length > 1) {
    renderAccordionQRs(qrPayloads, container);
  } else {
    try {
      const instance = createQRInstance(qrPayloads[0]);
      await instance.getRawData("png"); // Validate data size dynamically against current Error Correction limits
      container.style.flexDirection = "row";
      instance.append(container);
      currentQrInstances.push(instance);
    } catch (err) {
      console.warn("QR length overflow, chunking data...", err);
      container.innerHTML = "";
      const chunks = chunkString(qrPayloads[0], 800); // 800 chars is deeply safe for 'H' error correction
      renderAccordionQRs(chunks, container);
    }
  }

  setTimeout(
    () => resultCard.scrollIntoView({ behavior: "smooth", block: "start" }),
    100,
  );
});

document.getElementById("btn-clear-qr-result").addEventListener("click", () => {
  document.getElementById("qr-canvas-container").innerHTML = "";
  document.getElementById("qr-result-card").style.display = "none";
  currentQrInstances = [];
});

document.getElementById("btn-download").onclick = () => {
  currentQrInstances.forEach((inst, idx) => {
    setTimeout(() => {
      inst.download({
        name:
          currentQrInstances.length > 1
            ? `QR_${typeSelect.value}_${Date.now()}_part${idx + 1}`
            : `QR_${typeSelect.value}_${Date.now()}`,
        extension: "png",
      });
    }, idx * 300); // Stagger to prevent ad-blockers/browsers from canceling batched downloads
  });
};

document.getElementById("btn-share-qr").onclick = async () => {
  const canvases = Array.from(
    document.getElementById("qr-canvas-container").querySelectorAll("canvas"),
  );
  if (canvases.length > 0 && navigator.canShare) {
    const files = await Promise.all(
      canvases.map((canvas, index) => {
        return new Promise((resolve) => {
          canvas.toBlob((blob) =>
            resolve(
              new File(
                [blob],
                canvases.length > 1
                  ? `qrcode_part${index + 1}.png`
                  : "qrcode.png",
                { type: "image/png" },
              ),
            ),
          );
        });
      }),
    );

    try {
      await navigator.share({
        title: "QR Code",
        text: "QR created by QR Studio: qr.blzr.sbs",
        files: files,
      });
    } catch (err) {
      console.log("Share failed");
    }
  } else alert("Sharing not supported on this browser.");
};

// Scanner
let html5QrCode;
const scanResultCard = document.getElementById("scan-result-card");
const scanResultText = document.getElementById("scan-result-text");
const scanImagePreview = document.getElementById("scan-image-preview");
const cameraSelect = document.getElementById("camera-select");
const qrboxSizeInput = document.getElementById("qrbox-size");
const scannerControls = document.getElementById("scanner-controls");

let cameras = [];
let currentCameraId = null;

function handleScanSuccess(decodedText, isFile = false) {
  // 1. Haptic Feedback (Supported on most modern devices)
  if ("vibrate" in navigator) navigator.vibrate([100, 50, 100]);

  scanResultCard.style.display = 'block';
  scanResultText.value = decodedText;

  // 2. Smart Contextual Action Button
  const openLinkBtn = document.getElementById('btn-open-link');
  const txt = decodedText.trim();

  // Detects standard web links or native app intents (geo, mailto, tel, smsto, upi, wifi)
  if (txt.match(/^(https?|geo|mailto|tel|smsto|upi|WIFI):/i)) {
    openLinkBtn.style.display = 'inline-flex';
    openLinkBtn.innerText = txt.toLowerCase().startsWith('http') ? 'Open Link' : 'Launch App';

    // Override onClick to handle special intents appropriately
    openLinkBtn.onclick = () => {
      if (txt.toUpperCase().startsWith('WIFI:')) {
        alert("Copy the password manually, then use this data to connect via your device Wi-Fi settings.");
      } else {
        window.open(txt, '_blank', 'noopener,noreferrer');
      }
    };
  } else {
    openLinkBtn.style.display = 'none';
  }

  if (!isFile) scanImagePreview.style.display = 'none'; // Only show image preview if uploaded

  if(html5QrCode?.isScanning) {
    html5QrCode.stop();
    document.getElementById('btn-start-scan').style.display = 'inline-flex';
    document.getElementById('btn-stop-scan').style.display = 'none';
    scannerControls.style.display = 'none';
  }
  scanResultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function setupCameras() {
  if (cameras.length > 0) return true;
  try {
    cameras = await Html5Qrcode.getCameras();
    if (cameras && cameras.length > 0) {
      cameraSelect.innerHTML = "";
      cameras.forEach((cam) => {
        const opt = document.createElement("option");
        opt.value = cam.id;
        opt.innerText = cam.label || `Camera ${cameraSelect.length + 1}`;
        cameraSelect.appendChild(opt);
      });
      const backCam = cameras.find(
        (c) =>
          c.label.toLowerCase().includes("back") ||
          c.label.toLowerCase().includes("environment"),
      );
      currentCameraId = backCam ? backCam.id : cameras[0].id;
      cameraSelect.value = currentCameraId;
      return true;
    }
  } catch (err) {
    console.warn("Could not retrieve cameras", err);
  }
  return false;
}

function startScanner(cameraConfig) {
  const boxSize = parseInt(qrboxSizeInput.value, 10);
  const config = { fps: 10, qrbox: { width: boxSize, height: boxSize } };

  html5QrCode
    .start(
      cameraConfig,
      config,
      (txt) => handleScanSuccess(txt, false),
      () => {},
    )
    .then(() => {
      document.getElementById("btn-start-scan").style.display = "none";
      document.getElementById("btn-stop-scan").style.display = "inline-flex";
      scannerControls.style.display = "flex";
    })
    .catch(() => alert("Camera access denied or in use."));
}

function restartScanner() {
  if (html5QrCode?.isScanning) {
    html5QrCode
      .stop()
      .then(() => {
        startScanner(currentCameraId);
      })
      .catch((err) => console.log("Error stopping scanner", err));
  }
}

cameraSelect.addEventListener("change", (e) => {
  currentCameraId = e.target.value;
  restartScanner();
});

qrboxSizeInput.addEventListener("change", () => restartScanner());

document
  .getElementById("btn-start-scan")
  .addEventListener("click", async () => {
    if (!html5QrCode) html5QrCode = new Html5Qrcode("reader");
    const hasCameras = await setupCameras();
    startScanner(hasCameras ? currentCameraId : { facingMode: "environment" });
  });

document.getElementById("btn-stop-scan").addEventListener("click", () => {
  if (html5QrCode) {
    html5QrCode.stop();
    document.getElementById("btn-start-scan").style.display = "inline-flex";
    document.getElementById("btn-stop-scan").style.display = "none";
    scannerControls.style.display = "none";
  }
});

document.getElementById("qr-file-upload").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    if (!html5QrCode) html5QrCode = new Html5Qrcode("reader");
    html5QrCode
      .scanFile(file, true)
      .then((txt) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          scanImagePreview.src = e.target.result;
          scanImagePreview.style.display = "block";
        };
        reader.readAsDataURL(file);
        handleScanSuccess(txt, true);
      })
      .catch(() => alert("Could not find a QR code in that image."));
  }
});

// Scan View - Clear Scan Result Event
document
  .getElementById("btn-clear-scan-result")
  .addEventListener("click", () => {
    scanResultCard.style.display = "none";
    scanResultText.value = "";
    scanImagePreview.style.display = "none";
    scanImagePreview.src = "";
    document.getElementById("qr-file-upload").value = "";
  });

document.getElementById("btn-copy-result").onclick = () =>
  navigator.clipboard
    .writeText(scanResultText.value)
    .then(() => alert("Copied!"));
document.getElementById("btn-share-result").onclick = () => {
  if (navigator.share) navigator.share({ text: scanResultText.value });
};

// ==========================================
// 5. URL ROUTING & DEEP-LINK INTERCEPTION
// ==========================================

// SINGLE declaration for the entire app routing logic
const urlParams = new URLSearchParams(window.location.search);

// 1. If app was opened via shortcut or shared image, switch to Scan tab
if (
  urlParams.get("action") === "scan" ||
  urlParams.get("shared_file") === "true"
) {
  document.querySelector('[data-target="scan-view"]').click();
}

// 2. If app was opened via OS Image Share, fetch the cached image and scan it
if (urlParams.get("shared_file") === "true") {
  if ("caches" in window) {
    caches.open("qr-shared-image-cache").then((cache) => {
      cache.match("/shared-image-temp").then((response) => {
        if (response) {
          response.blob().then((blob) => {
            const file = new File([blob], "shared_qr.jpg", { type: blob.type });

            // Show preview to the user
            const reader = new FileReader();
            reader.onload = (e) => {
              scanImagePreview.src = e.target.result;
              scanImagePreview.style.display = "block";
            };
            reader.readAsDataURL(file);

            // Execute Scan
            if (!html5QrCode) html5QrCode = new Html5Qrcode("reader");
            html5QrCode
              .scanFile(file, true)
              .then((txt) => handleScanSuccess(txt, true))
              .catch(() => alert("No QR code found in the shared image."));

            // Clean up cache after processing to save space
            cache.delete("/shared-image-temp");
          });
        }
      });
    });
  }
}
