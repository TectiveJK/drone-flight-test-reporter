# Drone Flight Test Reporter

[![CI](https://github.com/TectiveJK/drone-flight-test-reporter/actions/workflows/nodejs.yml/badge.svg)](https://github.com/TectiveJK/drone-flight-test-reporter/actions/workflows/nodejs.yml)
[![Repo Size](https://img.shields.io/github/repo-size/TectiveJK/drone-flight-test-reporter)](https://github.com/TectiveJK/drone-flight-test-reporter)

Desktop prototype for drone flight-test logging, voice-assisted operator notes, structured report generation, Markdown export, and PDF export.

## Features

- flight/mission metadata input
- battery, firmware, mission, flight modes, telemetry, anomalies, operator notes
- flight log and Wireshark capture support
- Jira ticket links and attachments
- voice note transcription using browser speech recognition
- professional report preview
- save flight data as JSON
- export report to Markdown or PDF

## Setup

1. Open a terminal in `flight-test-reporter`
2. Run:
   ```bash
   npm install
   ```
3. Start the app:
   ```bash
   npm start
   ```

## Desktop shortcut

A shortcut can be created on your desktop pointing to the Electron binary and this folder. On Linux, you can use a `.desktop` file.

## Notes

- Voice transcription uses the browser `SpeechRecognition` API and may depend on platform support.
- The app path should not contain spaces on Linux for Electron to launch correctly.
- This repository is a prototype. Future improvements can include better telemetry ingestion, screenshot/video attachment handling, and Jira issue automation.

## GitHub

Repository: https://github.com/TectiveJK/drone-flight-test-reporter

## Releases

This project is currently a prototype with an initial release milestone.

Future releases may include:

- built installers for Linux, macOS, and Windows
- screenshot/video attachment management
- telemetry analytics and charts
- Jira issue automation
