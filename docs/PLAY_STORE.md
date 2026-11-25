# Google Play release kit

This is the checklist and copy for publishing Tofik Store. The app itself is
ready; the remaining steps require the Play Console account owner.

## Artifact

- Package: `com.tofik.store`
- Version: `1.2.1` (`versionCode` 4)
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`
- Upload key: `%USERPROFILE%\AndroidKeystores\tofik-store` (back up the folder and
  password; losing it blocks updates until you reset the upload key with Google)
- Play App Signing: enroll on the first upload. Play re-signs installs, so the
  Play build and the sideload APK from `/download` have different signatures.
  Testers must uninstall one before installing the other.

Build a fresh artifact with JDK 21:

```powershell
$env:JAVA_HOME = 'C:\Program Files\Java\jdk-21.0.12.1'
npm run build:native
cd android
.\gradlew.bat bundleRelease
```

## Account and app setup

1. Create a personal Google Play developer account, pay the one-time fee, and
   complete identity verification. Personal accounts created after 13 November
   2023 must run closed testing with at least 12 testers for 14 continuous days
   before applying for production.
2. Create the app with name **Tofik Store**, default language **English (US)**,
   type **App**, and price **Free**.
3. Store settings: category **Shopping**, contact email, website
   `https://tofik.store`, privacy policy `https://tofik.store/privacy`.
4. App content:
   - **Ads:** No.
   - **App access:** Restricted. Provide the demo account below and the steps to
     reach checkout, because placing an order requires sign-in.
   - **Content rating:** complete the questionnaire. The app has no violence,
     gambling, sexual content, or user-generated content.
   - **Target audience:** 18 and over. The app is a general shop and is not
     designed for children.
   - **News app:** No.
   - **Data safety:** answers below.
   - **Government app:** No.
   - **Financial features:** None. The app does not process payments.
   - **Health:** No.
5. Create a **Closed testing** track, upload the AAB, add at least 12 testers
   (email list or Google Group), send the opt-in link, and keep the release live
   for 14 continuous days.
6. Apply for production, complete the production questionnaire, and roll out.

## Demo account for review

Create a normal customer account (not an admin) in production and put the
credentials only in the Play Console **App access** field, never in this repo.
Seed a small cart or order if you want the reviewer to see that state. The review
notes should say:

> Sign in with the provided email and password. Browse the shop, open an item,
> add it to the cart, and continue to checkout. No payment is taken; the shop
> confirms orders by phone. Account deletion is under Account → Security.

## Data safety answers

- Does the app collect or share required user data types? **Yes.**
- Data encrypted in transit? **Yes.**
- Can users request data deletion? **Yes**, `https://tofik.store/delete-account`.
- Data types collected (all **not shared**, all for **App functionality** and
  **Account management** where applicable):
  - **Personal info → Name** — checkout and account profile. Required for orders.
  - **Personal info → Phone number** — sign-in and order contact. Required.
  - **Personal info → Email address** — optional second sign-in method.
  - **Personal info → Address** — optional delivery address at checkout.
  - **Financial info → Purchase history** — order records. Required to fulfil
    orders.
  - **Photos and videos → Photos** — only when an administrator chooses a
    product image. Optional; the shop works without it.
  - **Device or other IDs** — FCM push token when the user turns on
    notifications. Optional; deleted on sign-out, opt-out, or account deletion.
- Is all collected data encrypted in transit? **Yes.**
- Is data deletion available in the app? **Yes**, Account → Security.
- Retention: account data is deleted on request. Order history is retained with
  the customer name, phone, and address removed so sales records remain.

## Store listing copy

**Short description** (72 characters):

> Shop essentials with live stock, a saved cart, and quick phone checkout.

**Full description:**

> Tofik Store makes it easy to shop everyday essentials from your phone.
>
> Browse the catalogue, search for what you need, and see live prices and stock
> before you order. Add items to your cart and check out with your name and
> phone number — no online payment is required. The shop confirms your order and
> keeps you updated as it moves from new to confirmed and shipped.
>
> • Live catalogue and stock: see what is available right now.
> • Saved cart: your items stay with your account across devices.
> • Quick checkout: confirm your contact and delivery details in a few taps.
> • Order updates: turn on notifications to hear when your order status changes.
> • One account, two ways to sign in: use your phone number or email address.
> • App lock: optionally protect the app with your fingerprint, face, or device
>   PIN.
>
> Tofik Store delivers within Saudi Arabia. Prices are shown in Saudi riyals
> (SAR). The app is free and contains no ads.
>
> Questions or need help with an order? Contact the shop through the details on
> tofik.store.

## Graphic assets

- **App icon:** 512 × 512 PNG, no transparency. Use `public/icon-512.png`.
- **Feature graphic:** 1024 × 500 PNG or JPEG. Must not contain the Google Play
  logo or a "download" call to action.
- **Phone screenshots:** 2–8 images, 16:9 or 9:16, 1080 px wide is a safe size.
  Use the real app UI: home/catalogue, item detail, cart, checkout, and account.
  Do not show the `/download` APK page; it is hidden inside the native app.
- **Tablet screenshots:** optional, but the responsive layout supports them.

## Closed testing notes

- Testers install from the Play opt-in link, not from `tofik.store/download`.
- If a tester already installed the sideload APK, they must uninstall it first
  because the signatures differ.
- Push notifications need the tester to opt in under Account → Notifications and
  grant the Android notification permission.
- App lock is under Account → Security and needs a device screen lock.
- Camera/gallery product photos are only visible to an admin account. Testers do
  not need an admin account for normal shopping.
