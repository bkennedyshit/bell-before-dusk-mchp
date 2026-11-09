package com.bellbeforedusk.playtest;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Handler;
import android.os.Looper;
import android.util.Base64;
import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.Signature;
import java.security.spec.X509EncodedKeySpec;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.json.JSONObject;

/** One non-consumable full-game unlock. No entitlement is accepted from JavaScript. */
@CapacitorPlugin(name = "BellBilling")
public class BellBillingPlugin extends Plugin {
    private static final String PRODUCT = "full_game_unlock";
    private final Handler main = new Handler(Looper.getMainLooper());
    private final Map<String, List<Runnable>> acknowledgements = new HashMap<>();
    private BillingClient client;
    private SharedPreferences cache;
    private PublicKey licensingKey;
    private PluginCall active;
    private String operation = "", price = "", message = "Google Play is not connected.";
    private ProductDetails product;
    private ProductDetails.OneTimePurchaseOfferDetails offer;
    private boolean owned, pending, available, destroyed;
    private long serial;
    private Runnable timeout;

    @Override public void load() { main.post(this::initialize); }

    private void initialize() {
        if (client != null || destroyed) return;
        cache = getContext().getSharedPreferences("bell.verified.play.purchase", Context.MODE_PRIVATE);
        try {
            int id = getContext().getResources().getIdentifier("bell_billing_public_key", "string", getContext().getPackageName());
            String value = id == 0 ? "" : getContext().getString(id).replaceAll("\\s", "");
            if (!value.isEmpty()) licensingKey = KeyFactory.getInstance("RSA")
                .generatePublic(new X509EncodedKeySpec(Base64.decode(value, Base64.DEFAULT)));
        } catch (Exception ignored) { licensingKey = null; }
        try {
            Purchase saved = new Purchase(cache.getString("purchase", ""), cache.getString("signature", ""));
            owned = cache.getBoolean("acknowledged", false) && verified(saved);
        } catch (Exception ignored) { owned = false; }
        client = BillingClient.newBuilder(getContext())
            .setListener((result, purchases) -> main.post(() -> purchaseUpdated(result, purchases)))
            .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
            .enableAutoServiceReconnection()
            .build();
    }

    @PluginMethod public void status(PluginCall call) { main.post(() -> begin(call, "status")); }
    @PluginMethod public void restore(PluginCall call) { main.post(() -> begin(call, "restore")); }
    @PluginMethod public void purchase(PluginCall call) { main.post(() -> begin(call, "purchase")); }

    private JSObject snapshot() {
        JSObject out = new JSObject();
        out.put("owned", owned); out.put("pending", pending);
        out.put("available", available && licensingKey != null && !owned && !pending);
        out.put("price", price); out.put("message", message); out.put("configured", licensingKey != null);
        return out;
    }

    private void begin(PluginCall call, String kind) {
        if (destroyed) { call.reject("Billing activity is closed."); return; }
        initialize();
        if (active != null) {
            JSObject busy = snapshot(); busy.put("message", "Another Google Play request is in progress.");
            call.resolve(busy); return;
        }
        active = call; operation = kind; final long id = ++serial;
        available = false; product = null; offer = null; price = "";
        if (licensingKey == null) {
            finish(id, "Google Play purchases are not configured for this build."); return;
        }
        timeout = () -> finish(id, "Google Play has not confirmed this request. Try Restore purchases when connected.");
        main.postDelayed(timeout, kind.equals("purchase") ? 180000 : 20000);
        if (client.isReady()) queryOwned(id);
        else try {
            client.startConnection(new BillingClientStateListener() {
                @Override public void onBillingSetupFinished(BillingResult result) {
                    main.post(() -> {
                        if (!current(id)) return;
                        if (result.getResponseCode() == BillingClient.BillingResponseCode.OK) queryOwned(id);
                        else finish(id, "Google Play is unavailable. Verified offline access is retained.");
                    });
                }
                @Override public void onBillingServiceDisconnected() {
                    main.post(() -> { available = false; if (current(id)) finish(id, "Google Play disconnected. Try again when connected."); });
                }
            });
        } catch (Exception ignored) { finish(id, "Could not connect to Google Play."); }
    }

    private boolean current(long id) { return !destroyed && active != null && serial == id; }

    private void finish(long id, String text) {
        if (!current(id)) return;
        message = text;
        if (timeout != null) main.removeCallbacks(timeout);
        PluginCall call = active; active = null; operation = ""; timeout = null;
        call.resolve(snapshot());
        notifyListeners("billingChanged", snapshot());
    }

    private void queryOwned(long id) {
        try {
            client.queryPurchasesAsync(QueryPurchasesParams.newBuilder()
                .setProductType(BillingClient.ProductType.INAPP).build(), (result, purchases) -> main.post(() -> {
                    if (!current(id)) return;
                    if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                        finish(id, "Could not check Google Play ownership. Verified offline access is retained."); return;
                    }
                    processPurchases(purchases, true, () -> {
                        if (!current(id)) return;
                        if (operation.equals("purchase") && (owned || pending)) {
                            finish(id, owned ? "Full game already unlocked." : "Payment is pending. The full game unlocks only after payment completes.");
                        } else queryProduct(id);
                    });
                }));
        } catch (Exception ignored) { finish(id, "Could not check Google Play ownership."); }
    }

    private void queryProduct(long id) {
        QueryProductDetailsParams.Product item = QueryProductDetailsParams.Product.newBuilder()
            .setProductId(PRODUCT).setProductType(BillingClient.ProductType.INAPP).build();
        try {
            client.queryProductDetailsAsync(QueryProductDetailsParams.newBuilder()
                .setProductList(Collections.singletonList(item)).build(), (result, details) -> main.post(() -> {
                    if (!current(id)) return;
                    product = null; offer = null; price = ""; available = false;
                    if (result.getResponseCode() == BillingClient.BillingResponseCode.OK && details != null) {
                        for (ProductDetails candidate : details.getProductDetailsList()) {
                            if (!PRODUCT.equals(candidate.getProductId())) continue;
                            List<ProductDetails.OneTimePurchaseOfferDetails> offers = candidate.getOneTimePurchaseOfferDetailsList();
                            if (offers == null) {
                                ProductDetails.OneTimePurchaseOfferDetails legacy = candidate.getOneTimePurchaseOfferDetails();
                                offers = legacy == null ? Collections.emptyList() : Collections.singletonList(legacy);
                            }
                            for (ProductDetails.OneTimePurchaseOfferDetails option : offers) {
                                // This entitlement is permanent: never sell a rental or pre-order.
                                if (option.getRentalDetails() == null && option.getPreorderDetails() == null) {
                                    product = candidate; offer = option; price = option.getFormattedPrice(); available = true; break;
                                }
                            }
                        }
                    }
                    if (operation.equals("purchase") && available && !owned && !pending) launch(id);
                    else finish(id, owned ? "Full game unlocked." : pending ? "Payment pending. Return after payment completes." :
                        available ? "One-time full game unlock. No recurring charge." : "The full game product is not available from Google Play for this build/account.");
                }));
        } catch (Exception ignored) { finish(id, "Could not load the Google Play product."); }
    }

    private void launch(long id) {
        if (!current(id) || getActivity() == null || product == null || offer == null) {
            finish(id, "The purchase screen is not available."); return;
        }
        try {
            BillingFlowParams.ProductDetailsParams.Builder item = BillingFlowParams.ProductDetailsParams.newBuilder().setProductDetails(product);
            String token = offer.getOfferToken();
            if (token != null && !token.isEmpty()) item.setOfferToken(token);
            BillingResult result = client.launchBillingFlow(getActivity(), BillingFlowParams.newBuilder()
                .setProductDetailsParamsList(Collections.singletonList(item.build())).build());
            if (result.getResponseCode() == BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED) queryOwned(id);
            else if (result.getResponseCode() == BillingClient.BillingResponseCode.USER_CANCELED) finish(id, "Purchase cancelled. No unlock was granted.");
            else if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) finish(id, "Google Play could not open the purchase screen.");
        } catch (Exception ignored) { finish(id, "Google Play could not open the purchase screen."); }
    }

    private void purchaseUpdated(BillingResult result, List<Purchase> purchases) {
        if (destroyed) return;
        final long id = serial;
        if (result.getResponseCode() == BillingClient.BillingResponseCode.OK && purchases != null) {
            processPurchases(purchases, false, () -> {
                message = owned ? "Full game unlocked." : pending ? "Payment pending. Full game access has not been granted." : "Purchase could not be verified. Use Restore purchases to retry.";
                if (current(id)) finish(id, message); else notifyListeners("billingChanged", snapshot());
            });
        } else if (result.getResponseCode() == BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED && current(id)) queryOwned(id);
        else if (current(id)) finish(id, result.getResponseCode() == BillingClient.BillingResponseCode.USER_CANCELED ?
            "Purchase cancelled. No unlock was granted." : "Google Play could not confirm the purchase. Use Restore purchases to check.");
    }

    private void processPurchases(List<Purchase> purchases, boolean authoritative, Runnable done) {
        Purchase purchased = null; boolean waiting = false;
        for (Purchase p : purchases) if (p.getProducts().contains(PRODUCT)) {
            if (p.getPurchaseState() == Purchase.PurchaseState.PURCHASED && verified(p)) purchased = p;
            else if (p.getPurchaseState() == Purchase.PurchaseState.PENDING) waiting = true;
        }
        pending = waiting;
        if (purchased == null) {
            if (authoritative) { owned = false; cache.edit().clear().apply(); }
            done.run(); return;
        }
        final Purchase purchase = purchased;
        if (purchase.isAcknowledged()) { remember(purchase); done.run(); return; }
        final String token = purchase.getPurchaseToken();
        List<Runnable> existing = acknowledgements.get(token);
        if (existing != null) { existing.add(done); return; }
        List<Runnable> waitingCallbacks = new ArrayList<>(); waitingCallbacks.add(done);
        acknowledgements.put(token, waitingCallbacks);
        try {
            client.acknowledgePurchase(AcknowledgePurchaseParams.newBuilder().setPurchaseToken(token).build(), result -> main.post(() -> {
                if (destroyed) return;
                if (result.getResponseCode() == BillingClient.BillingResponseCode.OK) remember(purchase);
                else message = "Payment exists but acknowledgement is not confirmed. Restore purchases will retry.";
                List<Runnable> callbacks = acknowledgements.remove(token);
                if (callbacks != null) for (Runnable callback : callbacks) callback.run();
            }));
        } catch (Exception ignored) {
            acknowledgements.remove(token);
            for (Runnable callback : waitingCallbacks) callback.run();
        }
    }

    private boolean verified(Purchase purchase) {
        if (licensingKey == null || purchase.getPurchaseState() != Purchase.PurchaseState.PURCHASED || !purchase.getProducts().contains(PRODUCT)) return false;
        try {
            JSONObject payload = new JSONObject(purchase.getOriginalJson());
            if (!getContext().getPackageName().equals(payload.optString("packageName"))) return false;
            Signature verifier = Signature.getInstance("SHA1withRSA");
            verifier.initVerify(licensingKey);
            verifier.update(purchase.getOriginalJson().getBytes(StandardCharsets.UTF_8));
            return verifier.verify(Base64.decode(purchase.getSignature(), Base64.DEFAULT));
        } catch (Exception ignored) { return false; }
    }

    private void remember(Purchase purchase) {
        if (!verified(purchase)) return;
        cache.edit().putString("purchase", purchase.getOriginalJson()).putString("signature", purchase.getSignature())
            .putBoolean("acknowledged", true).apply();
        owned = true; pending = false;
    }

    @Override protected void handleOnDestroy() {
        main.post(() -> {
            if (active != null) finish(serial, "Billing activity closed. Restore purchases after reopening the game.");
            destroyed = true;
            if (client != null) client.endConnection();
            acknowledgements.clear();
        });
    }
}
