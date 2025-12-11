# Supabase Image Upload Instructions

## 📁 Upload Girl Images to Supabase Storage

### Step 1: Access Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Select the **girl-images** bucket

### Step 2: Upload Images
Upload these files from `/public/` folder:

- `girl2.png` → Upload as `girl2.png`
- `girl4.jpeg` → Upload as `girl4.jpeg`  
- `girl5.png` → Upload as `girl5.png`
- `girl8.png` → Upload as `girl8.png`
- `girl9.png` → Upload as `girl9.png`

### Step 3: Get Public URLs
After uploading, the URLs will be:
```
https://[PROJECT_ID].supabase.co/storage/v1/object/public/girl-images/girl2.png
https://[PROJECT_ID].supabase.co/storage/v1/object/public/girl-images/girl4.jpeg
https://[PROJECT_ID].supabase.co/storage/v1/object/public/girl-images/girl5.png
https://[PROJECT_ID].supabase.co/storage/v1/object/public/girl-images/girl8.png
https://[PROJECT_ID].supabase.co/storage/v1/object/public/girl-images/girl9.png
```

### Step 4: Test URLs
Click on each uploaded file and copy the public URL to test in browser.

## ✅ Benefits
- **Reduced app bundle size** by ~50MB
- **Easy image updates** without app rebuilds
- **CDN delivery** for faster loading
- **Centralized image management**

## 🔧 Technical Implementation
The paywall now uses:
- `GIRL_IMAGES.girl2` instead of `require('@/assets/images/girl2.png')`
- Dynamic URLs from `imageService.ts`
- Remote loading with `{ uri: URL }`