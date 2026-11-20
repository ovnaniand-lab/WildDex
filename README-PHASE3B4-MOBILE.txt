WildDex Phase 3B.4 mobile integration

Files:
- app/(tabs)/identify.tsx (REPLACE existing)
- src/api/plantIdentification.ts (NEW)

Before extraction: ensure branch feature/phase3b-plant-identification and commit/stash any uncommitted edits.
From D:\WildDex-git in PowerShell:
  Expand-Archive -LiteralPath "$HOME\Downloads\wilddex-phase3b4-mobile.zip" -DestinationPath "D:\WildDex-git" -Force

Set .env at WildDex project root to:
  EXPO_PUBLIC_WILDDEX_API_URL=https://wilddex-api.YOUR-SUBDOMAIN.workers.dev

Never place PLANTNET_API_KEY or TEST_ACCESS_TOKEN in .env or app source.
Run:
  npx tsc --noEmit
  npm test
  npx expo start --tunnel --clear

On phone: choose photo -> Identify Plant -> verify actual suggestions; retry if needed.
Photos upload only when Identify Plant is tapped. Suggestions are not saved yet.
Guest Worker rate limits are not a strict daily provider quota. Do not promote to public launch without global budget and abuse controls.
