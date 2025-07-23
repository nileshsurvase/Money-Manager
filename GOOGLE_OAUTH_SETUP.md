# Google OAuth Setup Instructions

To fix the "redirect_uri_mismatch" error, you need to configure Google Cloud Console with the correct redirect URIs.

## Step 1: Go to Google Cloud Console

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Go to "APIs & Services" > "Credentials"

## Step 2: Configure OAuth 2.0 Client

1. Click on your OAuth 2.0 Client ID (or create one if it doesn't exist)
2. In the "Authorized redirect URIs" section, add these URIs:

For Replit deployment, add this exact URI:
```
https://97427dd1-f7f9-44fc-a649-05d1374d5eb9-00-1t3feqck2mwam.picard.replit.dev/auth/callback
```

Alternative URIs to try (add all of these):
```
https://97427dd1-f7f9-44fc-a649-05d1374d5eb9-00-1t3feqck2mwam.picard.replit.dev/auth/callback
https://5000-97427dd1-f7f9-44fc-a649-05d1374d5eb9-00-1t3feqck2mwam.picard.replit.dev/auth/callback
```

For development:
```
http://localhost:5000/auth/callback
https://localhost:5000/auth/callback
```

## Step 3: Get Current Redirect URI

The application logs the redirect URI it's trying to use. Check the console logs to see what URI is being generated, then add that exact URI to Google Cloud Console.

## Step 4: Required Scopes

Make sure your OAuth consent screen includes these scopes:
- `openid`
- `email` 
- `profile`
- `https://www.googleapis.com/auth/drive.file` (for Google Drive backup)

## Step 5: Update Environment Variables

Your `.env` file should have:
```
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

## Common Issues:

1. **Case sensitivity**: URIs are case-sensitive
2. **Protocol mismatch**: Make sure http/https matches
3. **Port numbers**: Include port if using localhost
4. **Trailing slashes**: Don't include trailing slashes in redirect URIs

After updating Google Cloud Console, it may take a few minutes for changes to take effect.