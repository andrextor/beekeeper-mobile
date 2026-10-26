# NativeWind choice (M1 task 2)

Checked 2026-10-26 on npm and nativewind.dev: the stable release is **NativeWind 4.2.7**, which uses **Tailwind CSS 3** (`tailwindcss@^3.4.17`). NativeWind 5 (Tailwind 4) is still a release candidate (`5.0.0-rc.0`), so the spec's fallback applies: **NativeWind v4 + Tailwind 3**.

Tokens live in `src/lib/colors.json` (the only hex values in the app), read by `tailwind.config.js` and by `src/lib/theme.ts` for the few props classes cannot reach (icon colors). Move to NativeWind 5 + Tailwind 4 in its own spec once it is stable on the current Expo SDK.
