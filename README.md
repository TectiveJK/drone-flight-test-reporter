# Drone Flight Test Reporter

[![CI](https://github.com/TectiveJK/drone-flight-test-reporter/actions/workflows/nodejs.yml/badge.svg)](https://github.com/TectiveJK/drone-flight-test-reporter/actions/workflows/nodejs.yml)
[![Repo Size](https://img.shields.io/github/repo-size/TectiveJK/drone-flight-test-reporter)](https://github.com/TectiveJK/drone-flight-test-reporter)

Linux-first Electron desktop app for professional multi-flight drone flight-test reporting.

## Features

- flight/mission metadata: objective types, location, responsible, robotics & software, UAV category, weather
- Equipment checklist for Refly/Skyhive units, rotator 25, and test batteries. Select as many items as needed (more than 10 is allowed); every selected item appears in the report preview, Markdown, and PDF.
- choose up to two Test Objective Types (Type 1 and Type 2), including GNSS Denied and April Tag Landing test. Both appear in the report preview, Markdown, and PDF.
- mission performed, anomalies, immediate action
- Flight Modes checklist: Mission, Loiter, Posctl, Rtl, Efl, Land, Home, and Kill Switch. Selected modes are stored per flight and appear in the report preview, Markdown, and PDF.
- flight log, Wireshark capture, and attachment files stay on the flight and appear under Evidence in the report preview, Markdown, and PDF
- **Export Report** saves a ZIP with the PDF plus the actual selected logs, captures, and attachments under `evidence/`, so a recipient can open those files. PDF-only export still writes a sibling `…-attachments` folder next to the PDF.
- overall result ignores Pending flights; mixed Pass and Fail/Aborted concludes as PASS WITH OBSERVATIONS instead of FAIL
- Jira ticket links and attachments
- professional report preview
- save and open reports as JSON in `~/DroneTestDay`
- export report to Markdown or ZIP/PDF

## Setup

1. Open a terminal in `drone-flight-test-reporter`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Electron app:
   ```bash
   npm start
   ```

## Desktop shortcut

On Linux, install a desktop icon that launches the Electron window only. It does **not** start a local web server or open a browser tab.

```bash
chmod +x scripts/install-desktop.sh scripts/launch-desktop.sh
./scripts/install-desktop.sh
```

After that, double-click **Drone Flight Test Reporter** on the desktop, or run:

```bash
~/.local/bin/drone-flight-test-reporter
```

## Linux packages

```bash
npm run build:linux
```

This builds an AppImage and a `.deb` in `dist/`.

## iOS / PWA

A separate mobile/PWA app lives in `ios-app/`. See [ios-app/README.md](ios-app/README.md). It does not change this Electron desktop app.

On an iPhone, open this address in **Safari** (not Chrome):

https://tectivejk.github.io/drone-flight-test-reporter/

Then tap **Share** → **Add to Home Screen**. The app icon appears on the home screen. Selected flight logs on iPhone are file names only; use the Linux desktop **Export Report** ZIP when someone needs the actual log files.

## Notes

- Saved reports default to the shared `~/DroneTestDay` folder.
- Selecting a flight log, capture, or attachment updates the current flight immediately and regenerates the report preview.
- Send the ZIP from **Export Report** when someone else needs to open the flight log. The PDF names the attached files; the originals are in `evidence/` inside the ZIP.
- This repository is a prototype. Future improvements can include better telemetry ingestion, screenshot/video attachment handling, and Jira issue automation.

## GitHub

Repository: https://github.com/TectiveJK/drone-flight-test-reporter
