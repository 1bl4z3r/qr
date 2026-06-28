# QR Studio

[![Live Demo](https://img.shields.io/badge/Live-Demo-6750A4?style=for-the-badge)](https://qr.blzr.sbs/)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-success?style=for-the-badge&logo=pwa)](#)
[![100% Offline](https://img.shields.io/badge/Offline-100%25-blue?style=for-the-badge)](#)
[![Privacy First](https://img.shields.io/badge/Privacy-First-brightgreen?style=for-the-badge)](#)

**QR Studio** is a privacy-focused, offline-capable Progressive Web App (PWA) for creating, customizing, and scanning QR codes natively on your device.

Because it is built entirely as a static client-side application, **no data ever leaves your device**. Once loaded, it works completely without an internet connection.

## ✨ Key Features

### 🛠️ Advanced Generation
Generate complex QR codes with built-in formatters:
* **Plain Text & URLs:** Includes a built-in UTM campaign builder.
* **UPI Payments:** Native routing for VPA, Bank Account + IFSC, Mobile numbers, and 12-digit Aadhaar.
* **vCard (Contact):** Standardized `.vcf` format for instant contact saving.
* **Wi-Fi Networks:** Auto-connect strings (WPA/WEP/Hidden).
* **Calendar Events:** Native `iCal` formatting.
* **Phone / SMS / Email:** Pre-filled intent URIs.

### 🎨 Customization & Accessibility
* **Integrated Logos:** Safely embed a center PNG/JPG logo (automatically bumps Error Correction to 'High').
* **Custom Colors:** Change foreground and background colors.
* **Live Contrast Checker:** Automatically calculates relative luminance (WCAG math) to warn you if your chosen colors will fail to scan on older smartphone cameras.

### 📷 Smart Scanning
* **Camera Integration:** Uses the environment-facing camera to decode QRs in real time.
* **Image Upload:** Scan a QR code from a saved photo with a built-in image preview.
* **OS Web Share Target:** (Standalone mode only) Share an image directly from your Android/Windows photo gallery *to* QR Studio to scan it instantly.

### 📱 PWA Features
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
2. Profit !!