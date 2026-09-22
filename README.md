# QR Studio

**QR Studio** is a privacy-focused, offline-capable Progressive Web App (PWA) for creating, customizing, and scanning QR codes natively on your device.

Because it is built entirely as a static client-side application, **no data ever leaves your device**. Once loaded, it works completely without an internet connection.

## ✨ Key Features

### 🛠️ Advanced Generation & Deep Linking

Generate complex QR codes with built-in formatters, all of which are directly accessible via SEO-friendly URL parameters (`?action=create&type=vcard`):

* **Dynamic SEO Metadata:** The app reactively updates `<title>` and `<meta description>` tags as users navigate between tools, ensuring optimal search engine indexing for every specific formatter.
* **Plain Text & URLs:** Includes a built-in UTM campaign builder and safe `try...catch` URI validation to prevent fatal app crashes on malformed inputs.
* **UPI Payments:** Native routing for VPA, Bank Account + IFSC, Mobile numbers, and 12-digit Aadhaar mapping.
* **vCard (Contact):** Standardized `.vcf` format for instant contact saving.
* **Wi-Fi Networks:** Auto-connect strings (WPA/WEP/Hidden).
* **Calendar Events:** Native `iCal` formatting.
* **Phone / SMS / Email:** Pre-filled intent URIs.
* **Location (Geo):** Standardized coordinate tracking.

### 📷 Smart Scanning

* **Top-Level Controls:** Start/Stop camera and load images using accessible, top-mounted UI controls without scrolling past the viewport.
* **Premium UX & Graceful Error Handling:** Replaced generic browser `alert()` popups with clean, 5-second inline fading error messages. Includes a hardware-safe 250ms camera reboot delay to prevent freezes on older Android devices when dynamically resizing the scan box.
* **Camera Integration:** Uses the environment-facing camera to decode QRs in real time.
* **Image Upload:** Scan a QR code from a saved photo with a built-in image preview.
* **OS Web Share Target:** Share an image directly from your Android/Windows photo gallery *to* QR Studio to scan it instantly.

### 🎨 Deep Customization

* **Advanced Module Styling:** Independently customize the shapes of the **Main Dots**, **Corner Squares**, and **Corner Dots** (Square, Dots, Rounded, Classy, Extra Rounded).
* **Integrated Logos:** Safely embed a center PNG/JPG logo (automatically bumps Error Correction to 'High').
* **Custom Colors:** Change foreground and background colors.
* **Live Contrast Checker:** Automatically calculates relative luminance (WCAG math) to warn you if your chosen colors will fail to scan on older smartphone cameras.

### ⚡ Performance & Architecture

* **In-Memory QR Caching:** Reuses instantiated `QRCodeStyling` objects in memory and applies `.update()` patches during rapid data entry, drastically reducing canvas teardown/rebuild CPU overhead.
* **Consolidated Storage I/O:** Groups all user preferences (colors, themes, styles, logos) into a single debounced `qr_settings` JSON object, minimizing `localStorage` read/write bottlenecks.
* **DOM Paint Batching:** Utilizes `DocumentFragment` to batch dynamic form inputs in memory, executing a single, lightning-fast DOM paint when switching tools instead of forcing constant layout recalculations.
* **Asynchronous Blob Mapping:** Leverages modern `Promise.all` and `.map()` arrays for batched Canvas processing during multi-QR share events.
* **DRY Utility Functions:** Features reusable asynchronous helpers (like `readImageFile`) to deduplicate FileReader logic across logo uploads and scanner inputs.

### 📱 PWA Features

* **Seamless Background Updates:** Utilizes a modern Service Worker lifecycle that silently downloads new GitHub commits in the background and prompts the user with an unobtrusive "Update" toast when the latest version is ready.
* Installs as a native-feeling app on iOS, Android, and Desktop.
* Auto-syncs to your system's Light/Dark mode.
* Quick-action home screen shortcuts for "Create QR" and "Scan QR".

## 🚀 Live Demo & Installation

You can use the app instantly at: **[https://qr.blzr.sbs/](https://qr.blzr.sbs/)**

**To install on your device:**

* **Android / Desktop (Chrome/Edge):** Tap the menu icon (⋮) or look in the address bar and select **"Install App"**.
* **iOS (Safari):** Tap the Share icon (⍐) and select **"Add to Home Screen"**.

## 🔒 Privacy & Data

This app is essentially a set of static HTML, CSS, and JS files.

* **No backend servers:** There are no databases, analytics, or tracking scripts.
* **Local processing:** All image decoding and QR canvas drawing happen on your CPU/GPU using JavaScript.
* **Persistent Settings:** Your color and theme preferences are saved locally in your browser's `localStorage`.

## 💻 Running Locally

Because QR Studio is a purely static site, there is no build step or package manager required.

1. Clone the repository:

```bash
   git clone https://github.com/1bl4z3r/qr.git
   cd qr

```

2. Open `index.html` in your browser.
