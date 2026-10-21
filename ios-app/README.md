# Drone Flight Test Reporter — iOS

This directory is a separate iOS-compatible application and does **not** modify the existing Electron/Linux application.

## Install on iPhone

The iOS app is published as a web app (PWA). It is **not** on the App Store.

1. On the iPhone, open **Safari** (not Chrome).
2. Go to https://tectivejk.github.io/drone-flight-test-reporter/
3. Tap the **Share** button, then **Add to Home Screen**.
4. Open **Flight Reporter** from the home screen.

If a home-screen icon stays blank, delete it, open the Safari link again, then Add to Home Screen. Use Wi-Fi or mobile data the first time.

Selected flight logs on iPhone are file names only. Use the Linux desktop **Export Report** ZIP when a recipient needs the actual log files.

## Branch

`main` (PWA is deployed to GitHub Pages from `main`)

## Ubuntu development

```bash
cd ios-app
npm install
npm run dev
```

For a production web build:

```bash
npm run build
```

## iOS packaging

The project uses Capacitor. The final native iOS project must be generated/opened with Apple's Xcode toolchain on macOS:

```bash
npm install
npm run build
npx cap add ios
npx cap sync ios
npx cap open ios
```

Then select an iPhone device in Xcode and build/sign with an Apple account.

## Current iOS features

- Multi-flight reports
- Test Report fields are stored per flight: car/van plate, Test Objective Types, Location, Responsible, Robotics & Software, UAV category, Equipment, and weather. Switch flights to enter different values; a new flight starts with a copy of the current flight so you only change what is different. In the exported report those fields appear once at the top, not under every flight.
- Conclusion field for the whole campaign. The written conclusion appears once at the end of the report, after all flights.
- UAV category selector
- Equipment checklist for Refly/Skyhive units, rotator 25, and test batteries. Select as many items as needed (more than 10 is allowed); every selected item appears in the report preview.
- choose up to two Test Objective Types (Type 1 and Type 2), including GNSS Denied and April Tag Landing test. Both appear in the report preview.
- Responsible and Robotics & Software fields
- Flight result and mission information. Mixed Pass and Fail/Aborted flights conclude as PASS WITH OBSERVATIONS instead of FAIL.
- Flight Modes checklist: Mission, Loiter, Posctl, Rtl, Efl, Land, Home, Kill Switch, Manual-GNSS Denied, and Mission-GNSS Denied. Selected modes are stored per flight and appear in the report preview.
- Combined Anomalies / Bugs/Immediate Action field per flight
- Local draft persistence with `localStorage`
- iOS Share Sheet via Web Share API where available
- Browser print/export to PDF
- Mobile-first light-grey/white/black UI
- File selection for flight logs, Wireshark captures and attachments (file names only; the desktop app is the sendable ZIP package with the actual files)

The Linux Electron application remains separate and unchanged by this directory.
