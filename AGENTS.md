# Repository Guidelines

## Project Structure & Module Organization
- `YouTube Shorts Block/` holds the main app source, SwiftUI views, and app resources
- `YouTube Shorts Block/Resources/` includes local HTML and CSS used by the app
- `YouTube Shorts Block/Assets.xcassets/` stores icons and color assets
- `YouTube Shorts Block Extension/` contains the Safari Web Extension target and its resources
- `YouTube Shorts Block Extension/Resources/` includes `manifest.json`, JS, HTML, and CSS for the extension
- `YouTube Shorts Block.xcodeproj/` is the Xcode project with shared schemes

## Build, Test, and Development Commands
Use Xcode for day to day development, or use `xcodebuild` from the repo root

```sh
xcodebuild -scheme "YouTube Shorts Block" -configuration Debug build
```

If you add tests later, run them with a simulator destination

```sh
xcodebuild -scheme "YouTube Shorts Block" -destination 'platform=iOS Simulator,name=iPhone 15' test
```

## Security & Configuration Tips
- App and extension settings live in `Info.plist` and `manifest.json`, keep changes minimal and reviewed

## Agent Specific Notes
- Do not build or create unit tests unless requested
