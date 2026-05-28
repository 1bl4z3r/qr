# QR Studio

QR Studio is a privacy-first, offline-capable QR code generator and scanner built as a static Progressive Web App for GitHub Pages. The production site is intended to be served from:

```txt
https://qr.blzr.sbs/
```

Repository:

```txt
https://github.com/1bl4z3r/qr
```

## Overview

QR Studio lets users generate, customize, download, share, and scan QR codes directly in the browser. The application is designed to run without a backend. QR generation, QR scanning, validation, and data formatting happen locally on the user's device.

The application supports common QR formats such as URLs, plain text, Wi-Fi credentials, vCards, email, phone/SMS, calendar events, and UPI payment QR codes.

 

## Core Features

### 1. QR Code Generation

QR Studio generates QR codes in the browser using the local vendor build of `qr-code-styling`.

Supported QR types:

- Plain text
- URL with optional UTM campaign parameters
- UPI payment QR
- Wi-Fi QR
- Contact card / vCard
- Email QR
- Phone / SMS QR
- Event / calendar QR

Implementation details:

- The QR type dropdown controls the dynamic form rendered inside the generator panel.
- Each QR type has its own field template in `assets/app.js`.
- The selected form values are converted into a QR payload by `buildQRData()`.
- The QR preview updates live whenever the user changes content, colors, QR size, logo, or error correction level.
- QR rendering is handled by `QRCodeStyling`.
- PNG and SVG downloads are triggered through the QR library's download API.

 

### 2. QR Code Size Control

Users can adjust QR code size using a range slider.

Implementation details:

- The slider is defined in `index.html` as:

```html
<input id="qrSize" type="range" min="180" max="420" value="280">
```

- The selected value is read in `updateQR()`.
- The QR preview width and height are updated dynamically.
- The visible size label is updated through `#sizeValue`.

 

### 3. QR Error Correction Level

Users can select the QR error correction level below the QR size control.

Supported levels:

- `L` — Low, approximately 7% recovery
- `M` — Medium, approximately 15% recovery
- `Q` — Quartile, approximately 25% recovery
- `H` — High, approximately 30% recovery

Implementation details:

- The error correction dropdown is defined as `#errorCorrection`.
- The selected value is passed to the QR generation options:

```js
qrOptions: {
  errorCorrectionLevel: ec
}
```

- The preview helper text displays the current selected error correction level using `#previewEcHint`.
- The text previously shown as `Scan-test before sharing` now displays the active error correction level.


### 4. QR Color Customization

Users can customize foreground and background colors.

Implementation details:

- Foreground color is controlled by `#foregroundColor`.
- Background color is controlled by `#backgroundColor`.
- Color changes trigger `updateQR()`.
- The selected foreground color is applied to QR dots, corner squares, and corner dots.
- The selected background color is applied to the QR background.
- Validation checks warn users if foreground and background contrast is too low.


### 5. Logo Support

Users can add a logo or image inside the generated QR code.

Implementation details:

- The file input `#logoInput` accepts image files.
- A `FileReader` converts the image into a data URL.
- The data URL is passed to the QR library as the QR image overlay.
- The `Remove` button clears the logo and regenerates the QR code.
- Validation warns users to scan-test QR codes that contain logos.


## QR Types and Payload Implementation

### 1. Plain Text QR

Plain text QR codes encode user-entered text directly.

Implementation details:

- The text field is rendered from the `text` field template.
- `buildQRData()` returns the text value directly.
- Empty values fallback to a blank string-safe payload.

### 2. URL QR with UTM Parameters

URL QR codes encode a valid URL. Optional UTM fields can be added for campaign tracking.

Fields:

- URL — mandatory
- Campaign Source — optional, maps to `utm_source`
- Campaign medium — optional, maps to `utm_medium`
- Campaign Name — optional, maps to `utm_campaign`

Implementation details:

- The URL field is mandatory.
- UTM fields are visually marked as optional.
- The optional UTM input placeholders are:

```txt
utm_source
utm_medium
utm_campaign
```

- `buildUrl()` creates a `URL` object from the mandatory URL value.
- If UTM values are provided, `buildUrl()` appends them using `URLSearchParams`.
- If no UTM fields are provided, the original URL is encoded.

Example output:

```txt
https://example.com/?utm_source=newsletter&utm_medium=email&utm_campaign=launch
```

### 3. UPI Payment QR

UPI QR codes encode a UPI payment URI.

Supported UPI methods:

- UPI ID / VPA
- Bank account number + IFSC
- 12-digit Aadhaar number
- 10-digit mobile number

Mandatory field:

- Payee / Merchant name

Optional fields:

- Amount
- Note

Implementation details:

- The UPI QR payload uses this URI format:

```txt
upi://pay?pa=<payee-address>&pn=<payee-name>&cu=INR&am=<optional-amount>&tn=<optional-note>
```

- The payee address is generated according to the selected UPI method:

```txt
UPI ID / VPA:         <vpa>
Account + IFSC:       <account>@<ifsc>.ifsc.npci
Aadhaar:              <aadhaar>@aadhaar.npci
Mobile:               <mobile>@mobile.npci
```

- The app validates UPI-specific fields before allowing download/share.
- UPI ID/VPA mode is treated as the most reliable option.
- Account + IFSC, Aadhaar, and mobile modes display warnings because support can vary by UPI app and bank.

### 4. Wi-Fi QR

Wi-Fi QR codes encode network credentials using the common Wi-Fi QR payload format.

Fields:

- Network name / SSID — mandatory
- Password — optional depending on security type
- Security type — WPA, WEP, or nopass
- Hidden network — true or false

Implementation details:

- The payload is generated as:

```txt
WIFI:T:<security>;S:<ssid>;P:<password>;H:<hidden>; ;
```

- Special QR characters are escaped using `escapeQR()`.
- The validation layer requires SSID to be present.

### 5. Contact Card / vCard QR

Contact card QR codes encode contact details in vCard 3.0 format.

Fields:

- Full name — mandatory
- Organization — optional
- Phone — optional
- Email — optional
- Website — optional
- Birthdate — optional
- Address — optional

Implementation details:

- The app creates a `BEGIN:VCARD` / `END:VCARD` payload.
- Birthdate is encoded using the `BDAY` vCard field.
- The birthdate field is rendered as a date picker beside the Website field.
- The app converts the date picker value from `YYYY-MM-DD` to `YYYYMMDD` for the vCard payload.

Example payload fragment:

```txt
BEGIN:VCARD
VERSION:3.0
FN:Alex Doe
TEL:+91...
EMAIL:hello@example.com
URL:https://example.com
BDAY:19900101
END:VCARD
```
### 6. Email QR

Email QR codes encode email recipient, subject, and body.

Fields:

- Email address — mandatory
- Subject — optional
- Body — optional

Implementation details:

- The app uses the `MATMSG` format:

```txt
MATMSG:TO:<email>;SUB:<subject>;BODY:<body>; ;
```

- The email address is validated before QR download/share.

### 7. Phone / SMS QR

Phone and SMS are merged into a single QR type called `Phone / SMS`.

Fields:

- Phone number — mandatory
- Send as SMS? — optional checkbox
- Message — optional and enabled only when SMS mode is selected

Implementation details:

- By default, the QR encodes a phone link:

```txt
tel:<phone-number>
```

- When `Send as SMS?` is checked, the message field is enabled.
- In SMS mode, the QR encodes:

```txt
SMSTO:<phone-number>:<message>
```

- The message field is disabled until the SMS checkbox is selected.
- The previous separate SMS dropdown option was removed.

### 8. Event QR

Event QR codes encode a calendar event using a VCALENDAR payload.

Fields:

- Title — mandatory
- Description — optional
- Location — optional
- Start Date — recommended
- Start Time — optional
- End Date — optional
- End Time — optional

Implementation details:

- The Event QR type creates a `VCALENDAR` payload with a `VEVENT` entry.
- Dates are converted from `YYYY-MM-DD` to `YYYYMMDD`.
- Times are converted from `HH:MM` to `HHMMSS`.
- Date and time are combined into this format:

```txt
YYYYMMDDTHHMMSS
```

Example payload:

```txt
BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:Event title
DESCRIPTION:Event description
LOCATION:Event location
DTSTART:20260528T100000
DTEND:20260528T110000
END:VEVENT
END:VCALENDAR
```

## Validation System

QR Studio validates user input before allowing downloads or sharing.

Validation includes:

- Required fields for each QR type
- URL format validation
- UPI ID format validation
- IFSC format validation
- Aadhaar 12-digit validation
- Mobile 10-digit validation
- UPI amount decimal validation
- Event title validation
- QR foreground/background contrast check

Implementation details:

- `validateQR()` runs before every QR update.
- Blocking errors disable:
  - Download PNG
  - Download SVG
  - Share QR
- Warnings do not block generation but inform the user.
- The validation badge changes state between:
  - Good
  - Warnings
  - Needs fix

## Mandatory and Optional Field Labels

Generator fields are visually marked as mandatory or optional.

Implementation details:

- Field labels are generated with `.field-meta` badges.
- Mandatory badges use `.field-meta.mandatory`.
- Optional badges use `.field-meta.optional`.
- The generator helper text was changed from `Updates live` to `Fill mandatory fields`.

## QR Scanner

QR Studio can scan QR codes using multiple input methods.

Supported scan methods:

- Device camera
- Image upload
- Drag and drop image
- Clipboard paste image

Implementation details:

- Camera scanning uses the local vendor build of `html5-qrcode`.
- The scanner is started through `Html5Qrcode.start()`.
- Uploaded, dropped, and pasted images are scanned through `scanFile()`.
- The camera helper text says:

```txt
Display QR in front of camera
```

- The previous `Upload / drop / paste` helper text was removed from the image scan tile header.

## Image Paste Support

Users can paste a copied QR screenshot directly on the page.

Implementation details:

- The app listens for the browser `paste` event.
- If the clipboard contains an image item, the image is extracted using `getAsFile()`.
- The image file is passed to the same scanner flow used by uploads.

## Share Support

QR Studio supports browser-native sharing where available.

Implementation details:

- The app uses the Web Share API through `navigator.share`.
- QR sharing attempts to share a generated PNG file when supported.
- If file sharing is not available, the app falls back to sharing text and/or the current page URL.
- Scan result sharing uses the scan result text.
- If result sharing fails, the app copies the result to the clipboard as a fallback.

## PWA and Offline Support

QR Studio is configured as a Progressive Web App.

PWA files:

```txt
manifest.webmanifest
service-worker.js
assets/icon.svg
assets/icon-192.png
```

Implementation details:

- The manifest uses root scope:

```json
{
  "start_url": "/",
  "scope": "/",
  "display": "standalone"
}
```

- The service worker cache name is derived from that version.
- The service worker uses a cache-first strategy.
- During activation, older caches are aggressively deleted.
- Navigation requests fall back to `index.html` when offline.
- Local vendor libraries are included in the service worker app shell.

Cached resources include:

```txt
./
./index.html
./about.html
./404.html
./manifest.webmanifest
./robots.txt
./sitemap.xml
./assets/styles.css
./assets/app.js
./assets/icon.svg
./assets/icon-192.png
./assets/og-image.png
./assets/vendor/qr-code-styling.min.js
./assets/vendor/html5-qrcode.min.js
```

## Local Vendor Libraries

The application references local vendor files instead of CDN scripts.

Expected files:

```txt
assets/vendor/qr-code-styling.min.js
assets/vendor/html5-qrcode.min.js
```

Implementation details:

- `index.html` preloads both vendor scripts.
- The scripts are loaded with `defer`.
- The service worker caches both local vendor files.
- Placeholder files are included in the repository structure and should be replaced with real minified builds before deployment.

## Install and Update Handling

QR Studio includes PWA install and update UI.

Implementation details:

- The app listens for `beforeinstallprompt`.
- The install button appears when the browser determines the app can be installed.
- The service worker listens for update events.
- When a new service worker is installed, a reload button appears:

```txt
New version available — reload
```

- Clicking the reload button sends a `SKIP_WAITING` message to the waiting service worker.
- The page reloads after `controllerchange`.

## Network Status Indicator

The network status pill displays whether the browser is online or offline.

Implementation details:

- The pill is placed beside the `QR Studio` title like a small superscript badge.
- The app listens to the browser `online` and `offline` events.
- The pill text changes between:

```txt
Online
Offline
```

- The pill uses compact styling to avoid dominating the hero section.

## Dark Mode

QR Studio supports light and dark mode.

Implementation details:

- The app detects the system color scheme on first load.
- The user can toggle the theme manually.
- Theme preference is stored in `localStorage`.
- Dark-mode form inputs and dropdown options are explicitly styled to remain readable.

Dropdown fix:

```css
[data-theme=dark] select,
[data-theme=dark] input,
[data-theme=dark] textarea {
  color: #f9fafb;
  background-color: #202738;
}

[data-theme=dark] select option {
  color: #f9fafb;
  background: #202738;
}
```

## SEO, OpenGraph, and Structured Data

QR Studio includes production SEO metadata for:

```txt
https://qr.blzr.sbs/
```

SEO implementation includes:

- Production canonical URL
- Meta title
- Meta description
- Robots meta tag
- OpenGraph tags
- Twitter card tags
- Absolute OpenGraph image URL
- Schema.org JSON-LD
- `robots.txt`
- `sitemap.xml`
- `404.html`

Schema-LD publisher and creator:

```json
{
  "@type": "Organization",
  "name": "BLZR",
  "url": "https://qr.blzr.sbs/"
}
```

## GitHub Pages Deployment

The site is intended to be deployed from the root of the `main` branch.

Expected root-level files:

```txt
index.html
about.html
404.html
manifest.webmanifest
robots.txt
sitemap.xml
service-worker.js
README.md
assets/
```

## Repository Structure

```txt
.
├── index.html
├── about.html
├── 404.html
├── manifest.webmanifest
├── robots.txt
├── sitemap.xml
├── service-worker.js
├── README.md
└── assets/
    ├── app.js
    ├── styles.css
    ├── icon.svg
    ├── icon-192.png
    ├── og-image.png
    └── vendor/
        ├── README.md
        ├── qr-code-styling.min.js
        └── html5-qrcode.min.js
```

## Privacy

QR Studio does not require a backend server.

- QR generation happens locally in the browser.
- QR scanning happens locally in the browser.
- Scan history is not stored.
- Generated QR content is not uploaded by the app.
- Theme preference may be stored locally in `localStorage`.
