# Drone Flight Test Reporter — iOS

Native SwiftUI iPhone/iPad version of the Drone Flight Test Reporter.

## Current features

- Multi-flight test reports
- Main UAV categories matching the desktop application
- Aircraft/model and configuration
- Mission, telemetry, anomaly/bug, expected behaviour, immediate action and findings
- Operator timeline
- Pass / Fail / Pass with observations / Aborted / Pending
- Add/remove flights with automatic numbering
- Evidence/file attachments
- Import existing JSON reports from the desktop application
- Export JSON
- Markdown sharing through the iOS share sheet
- Native PDF generation and Quick Look preview
- Native speech-to-text voice notes for the operator timeline
- Offline/local-first operation

## Setup

Open `ios/DroneFlightTestReporter/DroneFlightTestReporter.xcodeproj` in Xcode on macOS. Select an iPhone/iPad simulator or connected device, set your Apple development team for signing, and run.

Minimum deployment target: iOS 17.

On first use, iOS will ask for microphone and speech-recognition permission because voice notes are supported.

## Desktop compatibility

The iOS app uses a Codable report model intended to stay compatible with the Electron application's report JSON. The importer accepts the existing desktop JSON shape where the field names overlap; future iterations can add a dedicated migration layer for every historical report version.
