# 🌿 WildDex

**Discover. Identify. Explore.**

WildDex is a nature exploration and species encyclopedia app built with **React Native, Expo and TypeScript**.

Inspired by the idea of a Pokédex for the natural world, WildDex helps users discover species, identify plants, explore biodiversity and learn more about nature around the world.

The long-term vision is to combine a worldwide nature encyclopedia with personal discoveries, regional collections, exploration challenges and achievements.

## 🚀 Project Status

**Current version:** 0.1.0
**Development stage:** Phase 3C implemented — Phase 3C.5 next
**Platforms:** Android (APK), iOS and Web development support

The Android application has been successfully built and tested through EAS Build.

## ✨ Implemented Features

### 🌍 Nature Encyclopedia
- Species information and descriptions.
- Taxonomy and classification.
- Species data from GBIF and iNaturalist.
- Geographic exploration and regional filtering.
- Worldwide species coverage through connected biodiversity data sources.

### 📷 Plant Identification
- Take a photo using your device camera.
- Select an image from your gallery.
- Identify plants using the Pl@ntNet API.
- View possible species matches and identification suggestions.
- Retry identification when necessary.

### 📱 Mobile Experience
- Expo Router navigation.
- Camera and gallery integration.
- Android device support.
- Guest access to plant identification.

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| React Native | Mobile application |
| Expo SDK 57 | Development and native tooling |
| Expo Router | File-based navigation |
| TypeScript | Application development |
| Cloudflare Workers | Backend API |
| Pl@ntNet | Plant identification |
| GBIF | Biodiversity data |
| iNaturalist | Species observations and data |
| Vitest | Automated testing |

## 🏗️ Architecture

WildDex uses a mobile application with a lightweight backend.

- **Mobile app:** React Native and Expo.
- **Biodiversity data:** GBIF and iNaturalist integrations.
- **Plant identification:** Photos are submitted to a Cloudflare Worker, which communicates with Pl@ntNet.
- **Backend protection:** API keys remain on the server rather than inside the mobile application.

Plant photos are uploaded only when the user chooses to identify a plant.

## 📲 Android Installation

WildDex currently has an internal Android APK build distributed through Expo EAS Build.

A public APK download through GitHub Releases has not yet been configured.

Future releases will be published through GitHub Releases.

## 💻 Development Setup

### Requirements

- Node.js 20 or newer
- npm
- Git
- Expo Go for device testing
- An Expo account for EAS cloud builds

### 1. Clone the repository

```bash
git clone https://github.com/ovnaniand-lab/WildDex.git
cd WildDex
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure the API

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_WILDDEX_API_URL=https://your-worker-url
```

The URL should point to your deployed WildDex Cloudflare Worker.

**Security:** Never place `PLANTNET_API_KEY` or other private API credentials in the mobile application or commit them to GitHub. Configure private credentials as Cloudflare Worker secrets.

### 4. Start development

```bash
npx expo start --tunnel --clear
```

### 5. Run checks

```bash
npx tsc --noEmit
npm test
npx expo-doctor
```

### 6. Build an Android APK

```bash
npx eas-cli@latest build --platform android --profile preview
```

The preview profile generates an installable APK through Expo EAS Build.

## 🗺️ Roadmap

### Phase 3C — Personal Discoveries and Profiles
- [x] Save identified species to a personal collection.
- [x] Store discovery photos locally.
- [x] Record discovery dates and optional locations.
- [x] Update existing records when the same species is discovered again.
- [x] Browse saved discoveries and view individual discovery details.
- [x] Create personal profiles with editable nicknames and avatars.
- [x] Display discovery statistics on the profile.
- [x] Connect the profile nickname to the Home screen greeting.
- [x] Review the main interface and navigation.

### Phase 3C.5 — APK Optimization and Branding
- [ ] Optimize app images and assets.
- [ ] Verify Android launcher icon and splash screen.
- [ ] Review APK size.
- [ ] Complete fresh-install testing.
### Future Development
- Personal nature journal.
- Regional species collections.
- Exploration challenges.
- Achievement and badge system.
- Animal and fungi identification.
- Offline encyclopedia support.
- Cloud synchronization and user accounts.

## 🧪 Testing

The project currently includes automated tests covering:

- Taxonomy.
- Species descriptions.
- GBIF integration.
- iNaturalist integration.
- Encyclopedia functionality.
- Infinite species loading.

Latest verified result: **20 tests passed across 6 test files.**

## 📁 Project Structure

```text
WildDex/
├── app/                 # Expo Router screens
├── assets/              # Images, icons and visual assets
├── components/          # Reusable UI components
├── src/
│   └── api/             # API integrations
├── wilddex_phase3b4/
│   └── worker/          # Cloudflare Worker
├── __tests__/           # Automated tests
├── app.json             # Expo configuration
├── eas.json             # EAS build configuration
├── package.json
└── tsconfig.json
```

## 📄 License

Currently all rights reserved. No open-source license has been assigned yet.

---

**WildDex — Explore the living world. 🌱**
