# 🎯 Final Supabase Configuration for BridgeUp

You need to update these **exact values** in your Supabase Auth providers to enable BridgeUp OAuth:

## 🔍 Google OAuth Configuration

**Navigate to:** Supabase Project → Authentication → Providers → Google

**Current Client IDs:**
```
682302619545-umvagookghkn0u0dl8l8fcdke6j9mvr5.apps.googleusercontent.com
```

**UPDATE TO THIS EXACT STRING:**
```
682302619545-umvagookghkn0u0dl8l8fcdke6j9mvr5.apps.googleusercontent.com,753037060504-s9lvudr16n4cbpssfq7dbak0lt5hr7iv.apps.googleusercontent.com
```

## 🍎 Apple OAuth Configuration 

**Navigate to:** Supabase Project → Authentication → Providers → Apple

**Current Client IDs:**
```
com.wizzmo.app,wizzmo.com.signin,host.exp.Exponent
```

**UPDATE TO THIS EXACT STRING:**
```
com.wizzmo.app,wizzmo.com.signin,com.bridgeupapp.app,bridgeup.com.signin,host.exp.Exponent
```

## ✅ What This Does

- **Google**: Allows both Wizzmo and BridgeUp apps to authenticate with Google using the same Supabase backend
- **Apple**: Allows both Wizzmo and BridgeUp apps to use Sign in with Apple with the same Supabase backend
- **Data Separation**: The vertical column system ensures BridgeUp users only see BridgeUp content
- **Shared Users**: Users can potentially use the same account across both apps

## 🚀 After Configuration

Once you update Supabase with these exact strings:

1. **BridgeUp will be fully functional** with OAuth authentication
2. **Data separation is complete** - BridgeUp users will only see:
   - College prep categories (15 BridgeUp-specific categories)
   - BridgeUp mentors (when vertical filtering is applied)
   - BridgeUp questions and conversations
3. **Wizzmo continues working** with no changes needed

## 📱 Current BridgeUp Configuration

✅ **Bundle ID**: `com.bridgeupapp.app`  
✅ **Google Client ID**: `753037060504-s9lvudr16n4cbpssfq7dbak0lt5hr7iv.apps.googleusercontent.com`  
✅ **Vertical System**: Complete data separation  
✅ **Categories**: 15 college prep categories added to database  
✅ **Theme**: Professional blue/grey design  
✅ **Content**: High school → college prep focused

## 🔧 Apple Developer Requirements

For Apple Sign-In, you'll also need to:

1. **Create App ID**: `com.bridgeupapp.app` in Apple Developer Console
2. **Enable Sign in with Apple** for this App ID  
3. **Create Service ID**: `bridgeup.com.signin` (optional, for web)

---

**Copy the exact strings above into your Supabase Auth providers and BridgeUp will be fully operational!**