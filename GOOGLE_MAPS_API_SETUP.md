# Google Maps API Setup Guide

## Required APIs

Your Google Maps API key needs **TWO APIs enabled**:

1. **Maps JavaScript API** - Required for displaying the map
2. **Places API** - Required for address autocomplete

## Step-by-Step Setup

### 1. Enable Required APIs

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Go to **APIs & Services** > **Library**
4. Search for and enable these APIs:
   - ✅ **Maps JavaScript API** (REQUIRED for map display)
   - ✅ **Places API** (REQUIRED for address autocomplete)

### 2. Verify Your API Key

1. Go to **APIs & Services** > **Credentials**
2. Find your API key: `AIzaSyCPiwvpr4dC6-Iuz0pdZCnfg9_jNO-zP50`
3. Click on it to edit

### 3. Configure API Key Restrictions (Recommended)

**Application Restrictions:**
- Select **HTTP referrers (web sites)**
- Add these referrers:
  - `localhost:*`
  - `127.0.0.1:*`
  - `http://localhost:5173/*`
  - Your production domain (when deployed)

**API Restrictions:**
- Select **Restrict key**
- Choose these APIs:
  - Maps JavaScript API
  - Places API

### 4. Verify Billing (If Required)

- Google Maps has a free tier ($200/month credit)
- For most real estate websites, this is sufficient
- You may need to enable billing, but won't be charged if you stay within free tier

## Troubleshooting

### Error: "This page didn't load Google Maps correctly"

**Solution 1: Enable Maps JavaScript API**
- Go to Google Cloud Console
- APIs & Services > Library
- Search "Maps JavaScript API"
- Click **Enable**

**Solution 2: Check API Key**
- Verify the key in `.env.local` matches your Google Cloud Console
- No extra spaces or characters

**Solution 3: Check API Restrictions**
- Make sure your domain is allowed in API key restrictions
- For localhost, add `localhost:*` and `127.0.0.1:*`

**Solution 4: Restart Server**
- After updating `.env.local`, restart your development server:
  ```bash
  npm run dev
  ```

### Error: "API key not valid"

- Verify the API key is correct
- Check that both Maps JavaScript API and Places API are enabled
- Verify billing is enabled (if required by Google)

## Current Configuration

Your `.env.local` file should contain:
```
VITE_GOOGLE_MAPS_API_KEY=AIzaSyCPiwvpr4dC6-Iuz0pdZCnfg9_jNO-zP50
```

## Testing

After setup:
1. Restart your development server
2. Go to the Map page
3. You should see Google Maps (not the error message)
4. Properties should appear as markers on the map

## Free Tier Limits

- **Maps JavaScript API**: 28,000 map loads per month (free)
- **Places API**: $200/month credit (usually covers thousands of requests)

For a real estate website, the free tier is typically sufficient.

