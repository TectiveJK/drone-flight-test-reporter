# Drone Flight Test Reporter — iOS

SwiftUI iPhone/iPad version of the Drone Flight Test Reporter.

## Included

- Multi-flight test reports
- Test ID, project/customer, objective, location, operator and observer
- Main UAV categories matching the desktop application
- Aircraft/model, serial number, flight controller, GCS and firmware
- Weather/environment notes
- Flight date/time, mission ID, battery, duration and flight modes
- Mission, telemetry, anomaly/bug, expected behaviour, immediate action and findings fields
- Operator timeline/notes
- Flight result: Pending, Pass, Pass with observations, Fail, Aborted
- Multiple flights with add/remove and automatic numbering
- Evidence/attachment file selection
- JSON report export
- Markdown report sharing through the iOS share sheet
- Offline/local-first operation

## Open in Xcode

Open `ios/DroneFlightTestReporter/DroneFlightTestReporter.xcodeproj` in Xcode on macOS, select an iPhone or iPad simulator/device, choose your Apple development team for signing, and run.

Minimum deployment target: iOS 17.

The iOS app intentionally keeps the report model close to the Electron application's JSON structure so the desktop and mobile versions can evolve toward a shared report format.

## Next parity work

The remaining desktop-parity items are native iOS PDF generation/preview, voice transcription, richer photo/video evidence handling, and direct import of existing desktop JSON reports. These should be added without changing the core report model.
