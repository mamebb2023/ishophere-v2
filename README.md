# Tofik Store

Tofik Store is an online shop for browsing products, building a cart, and checking out with a name and phone number. Customers can use one account with either an email address or a phone number, so they never need two logins.

## Shopping

- Browse the full catalogue or filter by category.
- Search by product name and see live stock badges.
- Open an item to view its photos, price, description, and availability.
- Add items to the cart and adjust quantities before checkout.
- The cart is saved to the account, so it is still there after signing back in.

## Checkout and orders

- Checkout asks for a name and phone number, prefilled from the account when available.
- Orders are confirmed with an order number and summary.
- The shop owner is alerted when a new order arrives.

## One account, two ways to sign in

- Create an account with an email address or a phone number.
- Add the other contact method later from the Account page without creating a second account.
- A phone number is stored in full international format and remains separate from the email address.
- No email or SMS verification step is required.
- The shop owner account uses email and password.

## Shop management

The owner signs in with the same login page as customers, then opens **Admin** from the header or account menu to:

- See dashboard totals for sales, orders, and stock.
- Add, edit, and remove items, including photos and stock levels.
- Organise products into categories.
- Review orders and move them through **new**, **confirmed**, **shipped**, and **cancelled**.
- Update the shop name and brand colours.
- Receive in-app and device alerts for new orders.

## Good to know

- Prices are shown in Saudi riyals (SAR).
- Customers only see their own cart, orders, and account details.
- The shop works on phones, tablets, and desktop screens.

## Android app

The Android app is a bundled Capacitor build: the WebView loads `dist/` from inside the APK/AAB, not a remote URL. Product data, prices, stock, and orders still come live from Supabase. Google Play treats remote-URL shells as low-value WebView wrappers under its minimum-functionality policy, so do not add a `server.url` back to the config for production builds.

- `capacitor.config.ts` holds the app ID (`com.tofik.store`), app name, and plugins. It deliberately has no `server` block.
- `android/` is the generated native project (Capacitor 8).
- `webDir` points at `dist` (Vite's production build), which is copied into the native project by `npx cap sync android`.
- Native-only behavior lives in `src/components/layout/NativeShell.tsx`: hardware back navigates history then minimizes, and an offline banner appears when the network drops.
- Fonts are self-hosted from `public/fonts`. Country flags use emoji, so the app renders without Google Fonts or flag CDNs.
- The service worker and web notification controls are disabled on native. Web push does not work in the Android WebView, so the app uses native push notifications (FCM); see **Push notifications (FCM)** below.
- Auth email links use `https://tofik.store` via `src/lib/platform.ts`, because the native WebView origin is `https://localhost`.

After changing the Capacitor config or adding plugins, sync the native project:

```bash
npx cap sync android
npx cap open android
```

To build a debug APK from the command line, use JDK 21 and the Android SDK. This Gradle/AGP version does not support JDK 25 or 27, so point `JAVA_HOME` at a JDK 21 install first:

```powershell
$env:JAVA_HOME = 'C:\Program Files\Eclipse Adoptium\jdk-21'
cd android
.\gradlew.bat assembleDebug
```

The debug APK is written to `android/app/build/outputs/apk/debug/app-debug.apk`.

### Native features

- **Push notifications:** opt-in order alerts through Firebase Cloud Messaging; see below.
- **Camera and gallery:** administrators can take a product photo or pick one from the library on the item form. The web build keeps the normal file picker.
- **Share:** item pages open the Android share sheet. Browsers use the Web Share API, or copy the link when it is unavailable.
- **Haptics:** light feedback when an item is added to the cart and when a product photo is selected.
- **App lock:** an optional privacy screen that asks for a fingerprint, face, or device PIN after the app has been in the background for a few minutes. It is enabled from **Account → Security** in the Android app. This is not encryption: the Supabase session still lives in WebView storage, so it deters casual access rather than a determined attacker with the unlocked device.

The Android manifest declares `CAMERA`, `USE_BIOMETRIC`, `INTERNET`, and `POST_NOTIFICATIONS`. The camera is marked as optional (`android:required="false"`) because only administrators add photos; the shop itself works without one.

### Play Store declarations

- **Data safety:** declare account details, order history, push tokens, and product photos selected by administrators. Biometric data is verified by the device and never leaves it.
- **Account deletion:** available in the app under **Account → Security** and on the web at `/delete-account`.
- **Billing:** the app sells physical goods only and takes no online payment, so it does not use Google Play Billing.
- **Ads:** none.

### Push notifications (FCM)

The app saves its FCM token in `device_tokens`, and a trigger on `notifications` calls the `send-push` Edge Function. Push is off until the user turns it on, and a failed push never blocks an order.

1. Put `google-services.json` (Firebase Android app `com.tofik.store`) in `android/app/`. Without it the app crashes when it registers for push.
2. Apply the migrations: `supabase db push`. Migration 0009 creates `public.app_config` for the trigger secret.
3. Set the function secrets: `supabase secrets set FCM_PROJECT_ID=... FCM_CLIENT_EMAIL=... FCM_PRIVATE_KEY=... PUSH_INTERNAL_SECRET=...`
4. Store the same secret for the database trigger (SQL editor): `insert into public.app_config (key, value) values ('send_push_secret', '<secret>') on conflict (key) do update set value = excluded.value;`
5. Deploy the function: `supabase functions deploy send-push`. Its `verify_jwt` is off in `supabase/config.toml` because the trigger authenticates with the shared secret.
6. Build the store bundle with `npm run build:native`. It builds the web app, removes the sideload APK (`dist/app`) so it is not bundled into the store build, and runs `cap sync android`.

### Signed release build

The public download page is at `/download`. It links to the APK served from `public/app/`, so the file is deployed with the site and no GitHub release is required.

Release builds are signed with a keystore stored outside the repository at `%USERPROFILE%\AndroidKeystores\tofik-store`. Gradle reads the git-ignored `android/keystore.properties`. Back up that folder and its password: losing them prevents shipping updates that Android will accept.

```powershell
$env:JAVA_HOME = 'C:\Program Files\Eclipse Adoptium\jdk-21'
cd android
.\gradlew.bat assembleRelease
```

The signed APK is written to `android/app/build/outputs/apk/release/app-release.apk`. Copy it to `public/app/TofikStore-<version>.apk`, then update `APP_VERSION`, `APK_SIZE`, and `APK_URL` in `src/pages/Download.tsx`. Keep the version in the filename so browsers and CDNs never serve an older build. For a new version, also bump `versionCode`/`versionName` in `android/app/build.gradle`.

Build the Google Play artifact with `.\gradlew.bat bundleRelease`; the AAB is written to `android/app/build/outputs/bundle/release/app-release.aab`. Enroll in Play App Signing and keep the upload keystore backed up.

Note: `public/app` is part of the web build, so use `npm run build:native` for the store bundle — it removes `dist/app` before `cap sync`. A plain `npm run build` followed by `cap sync` would bundle the sideload APK into the app. Serve `/download` on the web only; inside the app it shows an "installed" state.

Debug and release builds use different signing keys, so uninstall one before installing the other.

Google Play may reject apps that are only a WebView wrapper under its minimum-functionality policy, so native features such as push notifications, camera access, sharing, haptics, and app lock reduce that risk.
