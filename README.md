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

The Android app is a thin Capacitor shell that loads the production site at <https://tofik.store>. Web deploys are reflected immediately, but the app needs a network connection.

- `capacitor.config.ts` holds the app ID (`com.tofik.store`), app name, and remote URL.
- `android/` is the generated native project (Capacitor 8).
- `webDir` points at `dist` (Vite's production build), which is copied into the native project as a fallback; the WebView loads the remote site.

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

### Signed release build

The public download page is at `/download`. It links to the APK served from `public/app/TofikStore-1.0.0.apk`, so the file is deployed with the site and no GitHub release is required.

Release builds are signed with a keystore stored outside the repository at `%USERPROFILE%\AndroidKeystores\tofik-store`. Gradle reads the git-ignored `android/keystore.properties`. Back up that folder and its password: losing them prevents shipping updates that Android will accept.

```powershell
$env:JAVA_HOME = 'C:\Program Files\Eclipse Adoptium\jdk-21'
cd android
.\gradlew.bat assembleRelease
```

The signed APK is written to `android/app/build/outputs/apk/release/app-release.apk`. Copy it to `public/app/TofikStore-<version>.apk`, then update `APP_VERSION`, `APK_SIZE`, and `APK_URL` in `src/pages/Download.tsx`. Keep the version in the filename so browsers and CDNs never serve an older build. For a new version, also bump `versionCode`/`versionName` in `android/app/build.gradle`.

Debug and release builds use different signing keys, so uninstall one before installing the other.

Google Play may reject apps that are only a WebView wrapper under its minimum-functionality policy, so native features such as push notifications or offline support reduce that risk.
