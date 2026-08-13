# Drone Flight Test Reporter

[![CI](https://github.com/TectiveJK/drone-flight-test-reporter/actions/workflows/nodejs.yml/badge.svg)](https://github.com/TectiveJK/drone-flight-test-reporter/actions/workflows/nodejs.yml)
[![Repo Size](https://img.shields.io/github/repo-size/TectiveJK/drone-flight-test-reporter)](https://github.com/TectiveJK/drone-flight-test-reporter)

Desktop Electron application for drone flight-test logging, multi-flight reporting, voice-assisted operator notes, structured report generation, Markdown export, and PDF export.

## Current synchronized functionality

- multi-flight test reports with add/remove flight support
- Car / Van plate No. selector: `V-328-TL (Old)` and `V-960-VH (New)`
- Test Objective Type selector:
  - Unit test
  - Integration test
  - Requirement verification
  - Exploratory test
  - Regression test
  - Stress test
  - Acceptance test
  - User or stakeholder feedback test
- UAV / Aircraft Category selector:
  - Fixed-Wing UAVs
  - Multirotor UAVs
  - Single-Rotor UAVs (Helicopter)
  - VTOL UAVs
  - Hybrid UAVs
  - Lighter-than-Air UAVs
  - Flapping-Wing / Ornithopter UAVs
  - Unconventional / Experimental UAVs
- Specific Aircraft / Model input
- Equipment / Hardware input
- serial number, flight controller/autopilot, and ground-control software fields
- battery, mission, flight modes, telemetry, anomalies, expected behaviour, immediate action, findings, and operator timeline
- flight log and Wireshark capture support
- evidence and attachment support
- voice note transcription using browser speech recognition
- professional multi-flight report preview
- save and open flight data as JSON
- export report to Markdown or PDF
- light-grey application background, white fields, black field text, and black field titles

## Setup

1. Open a terminal in the project directory.
2. Run:
   ```bash
   npm install
   ```
3. Start the Electron application:
   ```bash
   npm start
   ```

## Notes

- Voice transcription uses the browser `SpeechRecognition` API and depends on platform support.
- The Linux/Electron version keeps its native file dialogs and local/offline reporting capabilities.
- The Linux branch is synchronized with the current Web/iOS reporting fields and selectable options while retaining Electron-specific functionality.

## GitHub

Repository: https://github.com/TectiveJK/drone-flight-test-reporter

## Releases

The project includes Linux/Electron, iOS/PWA, and public Web variants. The Linux branch is maintained separately so Electron-specific functionality is preserved.