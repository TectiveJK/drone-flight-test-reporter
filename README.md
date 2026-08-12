# Drone Flight Test Reporter

Desktop prototype for drone flight-test logging, voice-assisted operator notes, structured report generation, and PDF export.

## Features

- flight/mission metadata input
- battery, firmware, mission, flight modes, telemetry, anomalies, operator notes
- voice note transcription using browser speech recognition
- professional report preview
- save flight data as JSON
- export report to PDF

## Setup

1. Open a terminal in `flight-test-reporter`
2. Run `npm install`
3. Run `npm start`

## Notes

- Voice transcription uses the browser `SpeechRecognition` API and may depend on platform support.
- This prototype is built with Electron and a simple local renderer.
- Add real telemetry ingestion, screenshot/video attachments, and Jira integration in future iterations.
