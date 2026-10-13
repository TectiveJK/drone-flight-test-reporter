# Drone Flight Test Reporter — iOS

This directory is a separate iOS-compatible application and does **not** modify the existing Electron/Linux application.

## Branch

`feature/ios-version`

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
- UAV category selector
- Specific aircraft/model
- Equipment checklist for Refly/Skyhive units, rotator 25, and test batteries. Select as many items as needed (more than 10 is allowed); every selected item appears in the report preview.
- choose up to two Test Objective Types (Type 1 and Type 2), including GNSS Denied and April Tag Landing test. Both appear in the report preview.
- Responsible and Robotics & Software fields
- Detailed test objective
- Flight result and mission information
- Flight Modes checklist: Mission, Loiter, Posctl, Rtl, Efl, Land, Home, and Kill Switch. Selected modes are stored per flight and appear in the report preview.
- Anomalies and immediate action
- Local draft persistence with `localStorage`
- iOS Share Sheet via Web Share API where available
- Browser print/export to PDF
- Mobile-first light-grey/white/black UI
- File selection for flight logs, Wireshark captures and attachments

The Linux Electron application remains separate and unchanged by this directory.
