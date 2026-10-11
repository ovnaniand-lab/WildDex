# 🌿 WildDex

**WildDex** is a worldwide nature encyclopedia for iOS and Android, built with [React Native](https://reactnative.dev/) and [Expo](https://expo.dev/).

The goal of WildDex is to let anyone explore the natural world: discover plants, animals, fungi, and other species from around the globe, learn about their habitats and conservation status, and build a personal "dex" of wildlife encountered in the field.

> **Status:** Foundation only. This branch sets up the project skeleton (Expo + Expo Router + TypeScript). The encyclopedia features are not implemented yet.

## Tech Stack

- **Expo SDK 57** (React Native 0.86, React 19)
- **Expo Router v6** — file-based routing under `app/`
- **TypeScript** (strict mode)
- Runs on **iOS**, **Android**, and the **web** via Metro

## Project Structure

```
.
├── app/                # Expo Router screens (file-based routing)
│   ├── _layout.tsx     # Root layout (native stack navigator)
│   └── index.tsx       # Home screen placeholder
├── assets/             # Icons, splash screen, favicon
├── app.json            # Expo configuration (name: WildDex, slug: wilddex)
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript config (extends expo/tsconfig.base, strict)
└── .gitignore          # Expo / React Native / env-file ignores
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20 or newer
- [Git](https://git-scm.com/)
- For device testing: [Expo Go](https://expo.dev/go) on iOS/Android, or Xcode / Android Studio for simulators/emulators

### Install dependencies

```bash
npm install
```

### Run the app

```bash
# Start the Expo dev server (press i / a / w to open iOS, Android, or web)
npm start

# Directly open a platform
npm run ios
npm run android
npm run web
```

### Checks

```bash
# Type checking
npm run typecheck

# Linting (ESLint; scaffolds config on first run if needed)
npm run lint
```

## Configuration Notes

- App display name is **WildDex** (`app.json → expo.name`), slug `wilddex`, deep-link scheme `wilddex`.
- Bundle identifier / Android package: `app.wilddex.mobile`.
- Environment variables: never commit real `.env` files (they are gitignored). Use a `.env.example` file to document required variables such as third-party nature-API keys.

## Roadmap (not implemented yet)

- Species browse/search with images and descriptions
- Region-based exploration (worldwide coverage)
- Personal life-list / sightings log
- Camera-based identification
- Offline support and multilingual content

## License

TBD — all rights reserved unless otherwise stated.