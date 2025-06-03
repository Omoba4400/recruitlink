# Setting up Twitter Authentication for SportFwd

## 1. Create a Twitter Developer Account

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/petition/essential/basic-info)
2. Sign in with your Twitter account
3. Apply for a developer account if you don't have one
4. Fill in the required information about your use case

## 2. Create a Twitter App

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/projects-and-apps)
2. Click "Create Project"
3. Name your project (e.g., "SportFwd")
4. Select your use case
5. Click "Create"
6. Click "Create App" within your project

## 3. Configure Your Twitter App

1. In your app settings, find the "OAuth 1.0a" section
2. Set up OAuth 1.0a settings:
   - Enable "OAuth 1.0a"
   - Set App permissions to "Read and write"
   - Type of App: "Web App"
   - Callback URL: `https://YOUR-PROJECT-ID.firebaseapp.com/__/auth/handler`
   - Website URL: Your website URL
   - Organization name: Your organization name
   - Organization website: Your website URL

3. Save your settings
4. Note down these credentials:
   - API Key (Consumer Key)
   - API Key Secret (Consumer Secret)

## 4. Configure Firebase with Twitter

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Authentication > Sign-in methods
4. Find "Twitter" in the provider list
5. Click "Enable"
6. Enter your Twitter API Key and API Secret Key
7. Click "Save"

## 5. Add Authorized Domains

1. Still in Firebase Authentication settings
2. Go to the "Authorized domains" section
3. Add your domains:
   - For development: add `localhost`
   - For production: add your actual domain

## 6. Testing the Setup

1. Try to link Twitter account in your app
2. You should see a Twitter login popup
3. After logging in, you'll be asked to authorize your app
4. Accept the authorization

## Troubleshooting

If you see "auth/operation-not-allowed" error:
1. Verify Twitter provider is enabled in Firebase
2. Check API Key and Secret are correctly entered
3. Verify callback URL in Twitter App matches Firebase
4. Make sure your domain is authorized in Firebase

Common Issues:

1. "Callback URL Mismatch":
   - Double-check the callback URL in Twitter App settings
   - It should match exactly what Firebase provides

2. "API Key Invalid":
   - Verify you're using the correct API Key and Secret
   - Regenerate keys if necessary

3. "App Not Authorized":
   - Check Twitter App settings
   - Verify OAuth settings are correct
   - Make sure app permissions include "Read and write"

## Important Notes

- Keep your API keys and secrets secure
- Never commit them to version control
- Use environment variables for configuration
- Test authentication flow in both development and production

Need help? Contact support at [your-support-email] 