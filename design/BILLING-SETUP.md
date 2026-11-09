# Google Play full-game unlock — setup and release gate

## Implemented contract

Native Capacitor plugin `BellBilling` exposes `status()`, `purchase()`, and `restore()`.
Each Promise resolves `{ owned, pending, available, price, message, configured }`.
The optional `billingChanged` event returns the same object. Never send a purchase
token, receipt, signature, or billing debug message into the game/JavaScript logs.
Call status on foreground/resume to detect pending-payment completion and ownership
changes. Call purchase only after an explicit player action and show Play's returned
localized price; never substitute a hardcoded price.

The product is `full_game_unlock`, a permanent INAPP/non-consumable. It is never
consumed. The client queries real ProductDetails, selects an eligible non-rental,
non-preorder option, and opens the actual Google Play purchase sheet. A pending or
cancelled payment grants no access. ITEM_ALREADY_OWNED queries current purchases
instead of initiating another charge. Unacknowledged purchases are retried on
status/restore. Concurrent requests cannot start two checkout sheets; requests
have bounded timeouts. Late confirmed updates can still update native ownership.

New entitlements require PURCHASED, a valid Google Play RSA receipt signature,
matching package/product, and acknowledgement success (or an already acknowledged
purchase). Verified receipts live only in app-private native SharedPreferences,
not the browser save. They are reverified on launch to allow offline play. A
successful ownership query is authoritative: an empty/revoked purchase result
removes cached access. Service/network errors preserve previously verified offline
access rather than claiming a new purchase. No account creation or backend login
is included.

## Required owner configuration — not completed by this implementation

1. Choose the permanent application/package identity and release signing before
   creating the store product. The current playtest ID is not an approved release ID.
2. Already integrated: dependency `com.android.billingclient:billing:8.3.0`,
   `BellBillingPlugin.class` registered before `super.onCreate`, the merged billing
   permission, and Capacitor's offline public JS runtime. Do not add duplicate bridges.
3. Create and activate one-time product `full_game_unlock` in this exact app in
   Play Console. Configure a permanent buy option, price, and availability. Do not
   configure it as a consumable, rental, subscription, or preorder.
4. Copy this app's Play licensing RSA public key into Android string resource
   `bell_billing_public_key`. This is a public verification key, NOT the private
   upload/app-signing key. Blank or invalid configuration fails closed: purchase is
   unavailable and no new entitlement is accepted. No secret key is generated here.
5. Build/upload a signed AAB to a Play test track and use Play license-test accounts
   to test the actual checkout flow. A sideloaded debug APK with a blank key does
   not prove checkout or restoration. Never use a live charge as an automated test.

## Mandatory billing acceptance cases

- Localized displayed price equals the Play sheet; unavailable product/account
  disables purchase and explains the problem.
- Successful purchase and acknowledgement unlock exactly once; a second attempt
  reports owned. Cancellation and declined payment leave the demo playable.
- Pending payment does not unlock; completion is detected on foreground/restore.
- Kill/background during the sheet, after payment, and during acknowledgement;
  restore recovers legitimate ownership without charging twice.
- Reinstall/update, same account on another phone, offline launch after verification,
  network outage, account change, refund/revocation after an authoritative query,
  and invalid/blank-key receipt rejection.
- Demo saves cannot grant entitlement by editing localStorage; release builds have
  no debug unlock flag. Preserve gameplay progress when access is unavailable.

## Security/release limits

This implementation performs local RSA verification. It does not implement the
Google Play Developer API server-verification backend, RTDN/refund notifications,
cross-store identity, or cryptographically protected offline preferences. Rooted
devices/app tampering can bypass a client-only gate. Refund/account changes are
noticed only after a successful online ownership query. Before monetized public
release, choose and validate the backend-verification/refund strategy; do not label
the current bridge as a fully production-verified payment system.

Source guidance: [integration](https://developer.android.com/google/play/billing/integrate),
[release notes](https://developer.android.com/google/play/billing/release-notes), and
[security](https://developer.android.com/google/play/billing/security). Version8.3.0
is pinned deliberately for this integration; it is not claimed to be the latest
library release.
