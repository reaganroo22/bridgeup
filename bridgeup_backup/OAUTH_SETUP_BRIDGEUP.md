# BridgeUp OAuth Configuration Setup

This document provides the exact steps to configure OAuth for BridgeUp to work alongside Wizzmo using the same Supabase backend.

## 🍎 Apple Sign-In Configuration

### 1. Apple Developer Console Setup
1. Go to [Apple Developer Console](https://developer.apple.com/account)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Create new **App ID**: `com.bridgeupapp.app`
4. Enable **Sign in with Apple** capability
5. Create new **Service ID**: `bridgeup.com.signin` (for web/OAuth)

### 2. Update Supabase Apple Provider
In your Supabase project → **Authentication** → **Providers** → **Apple**:

**Current Client IDs field:**
```
com.wizzmo.app,wizzmo.com.signin,host.exp.Exponent
```

**Update to include BridgeUp:**
```
com.wizzmo.app,wizzmo.com.signin,com.bridgeupapp.app,bridgeup.com.signin,host.exp.Exponent
```

**Callback URL stays the same:**
```
https://miygmdboiesbxwlqgnsx.supabase.co/auth/v1/callback
```

## 🔍 Google OAuth Configuration

### 1. Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services** → **Credentials**
3. Create new **OAuth 2.0 Client ID** for iOS:
   - Application type: **iOS**
   - Bundle ID: `com.bridgeupapp.app`
   - Name: `BridgeUp iOS Client`
4. Download the `GoogleService-Info.plist` file
5. Replace the placeholder file at `/GoogleService-Info-BridgeUp.plist`

### 2. Update Supabase Google Provider
In your Supabase project → **Authentication** → **Providers** → **Google**:

**Current Client IDs field:**
```
682302619545-umvagookghkn0u0dl8l8fcdke6j9mvr5.apps.googleusercontent.com
```

**Update to include BridgeUp:**
```
682302619545-umvagookghkn0u0dl8l8fcdke6j9mvr5.apps.googleusercontent.com,753037060504-s9lvudr16n4cbpssfq7dbak0lt5hr7iv.apps.googleusercontent.com
```

**Callback URL stays the same:**
```
https://miygmdboiesbxwlqgnsx.supabase.co/auth/v1/callback
```

### 3. Update app.json with Actual Client ID
Replace `BRIDGEUP_IOS_CLIENT_ID` in `app.json` with the actual client ID from your Google Cloud Console.

## 📱 RevenueCat Configuration (Optional)

If using in-app purchases, update the merchant identifier:
- Current: `merchant.com.wizzmo.app`
- BridgeUp: `merchant.com.bridgeupapp.app`

## 🧪 Testing

1. **Build the app**: `npx expo run:ios`
2. **Test Google Sign-In**: Ensure OAuth redirects work correctly
3. **Test Apple Sign-In**: Verify Sign in with Apple functions
4. **Verify Data Separation**: Confirm BridgeUp users see only BridgeUp content

## 📋 Final Checklist

- [ ] Apple App ID created (`com.bridgeupapp.app`)
- [ ] Apple Service ID created (`bridgeup.com.signin`)
- [ ] Supabase Apple Client IDs updated
- [ ] Google OAuth client created for iOS
- [ ] Actual `GoogleService-Info.plist` file added
- [ ] Supabase Google Client IDs updated
- [ ] `app.json` updated with actual client ID
- [ ] Bundle identifier correct in all files
- [ ] Test OAuth flow working
- [ ] Vertical filtering working (BridgeUp content only)

## 🔗 Key Files Updated

- `app.json` - Bundle IDs and OAuth configuration
- `GoogleService-Info-BridgeUp.plist` - Google services configuration
- `lib/supabaseService.ts` - Vertical filtering added
- `config/current-vertical.ts` - BridgeUp vertical configuration
- `constants/Colors.ts` - BridgeUp blue theme

## 🎯 What This Achieves

1. **Shared Backend**: Both apps use the same Supabase project
2. **Data Separation**: Vertical filtering ensures BridgeUp users only see BridgeUp content
3. **Independent Auth**: Each app has its own OAuth credentials
4. **Same User Base**: Users can potentially use both apps with the same account
5. **Brand Consistency**: Each app maintains its own visual identity

The setup maintains the one Supabase project architecture while providing completely separate user experiences for Wizzmo (college life advice) and BridgeUp (college prep for high schoolers).