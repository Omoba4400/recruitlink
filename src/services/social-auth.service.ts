import { 
  signInWithPopup, 
  linkWithPopup,
  OAuthProvider,
  TwitterAuthProvider,
  FacebookAuthProvider,
  AuthProvider
} from 'firebase/auth';
import { updateDoc, doc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { User } from '../types/user';

const twitterProvider = new TwitterAuthProvider();
const facebookProvider = new FacebookAuthProvider();

const getProviderSetupInstructions = (platform: string): string => {
  switch (platform) {
    case 'youtube':
      return 'To enable YouTube sign-in: \n1. Go to Firebase Console > Authentication > Sign-in methods\n2. Enable "Google" provider\n3. Add your authorized domain\n4. Configure OAuth consent screen in Google Cloud Console';
    case 'twitter':
      return 'To enable Twitter sign-in: \n1. Go to Firebase Console > Authentication > Sign-in methods\n2. Enable "Twitter" provider\n3. Add your Twitter API Key and Secret';
    case 'linkedin':
      return 'To enable LinkedIn sign-in: \n1. Go to Firebase Console > Authentication > Sign-in methods\n2. Enable "LinkedIn" provider\n3. Add your LinkedIn API Key and Secret';
    case 'instagram':
      return 'To enable Instagram sign-in: \n1. Go to Firebase Console > Authentication > Sign-in methods\n2. Enable "Facebook" provider\n3. Configure Facebook App settings\n4. Enable Instagram Basic Display API';
    default:
      return 'Please enable the authentication provider in Firebase Console > Authentication > Sign-in methods';
  }
};

export const linkSocialAccount = async (platform: string, userId: string) => {
  try {
    let provider: AuthProvider;
    let profileUrl = '';

    switch (platform) {
      case 'twitter':
        provider = twitterProvider;
        break;
      case 'instagram':
        // Instagram requires Facebook Login API
        provider = facebookProvider;
        break;
      case 'youtube':
        provider = new OAuthProvider('google.com');
        (provider as OAuthProvider).addScope('https://www.googleapis.com/auth/youtube.readonly');
        break;
      case 'linkedin':
        provider = new OAuthProvider('linkedin.com');
        break;
      default:
        throw new Error('Unsupported platform');
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('No user is currently signed in');
    }

    // Try to link the account
    const result = await linkWithPopup(currentUser, provider);
    
    // Get the profile URL based on the platform
    switch (platform) {
      case 'twitter':
        profileUrl = (result.user as any)?.reloadUserInfo?.screenName 
          ? `https://twitter.com/${(result.user as any).reloadUserInfo.screenName}`
          : '';
        break;
      case 'instagram':
        // Facebook API will be needed to get Instagram profile
        profileUrl = '';
        break;
      case 'youtube':
        profileUrl = `https://youtube.com/channel/${(result.user as any)?.reloadUserInfo?.providerUserInfo?.[0]?.rawId || ''}`;
        break;
      case 'linkedin':
        profileUrl = (result.user as any)?.reloadUserInfo?.profileUrl || '';
        break;
    }

    // Update the user's social links in Firestore
    if (profileUrl) {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        [`socialLinks.${platform}`]: profileUrl,
        updatedAt: new Date().toISOString(),
      });
    }

    return { success: true, profileUrl };
  } catch (error: any) {
    console.error(`Error linking ${platform} account:`, error);
    
    // Handle specific error cases
    if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
      return { success: false, cancelled: true };
    }
    
    if (error.code === 'auth/operation-not-allowed') {
      throw new Error(`Authentication provider for ${platform} is not enabled.\n\n${getProviderSetupInstructions(platform)}`);
    } else if (error.code === 'auth/credential-already-in-use') {
      throw new Error('This social media account is already linked to another user');
    } else if (error.code === 'auth/popup-blocked') {
      throw new Error('Please allow popups for this site to link your account');
    } else if (error.code === 'auth/internal-error') {
      throw new Error(`Failed to connect to ${platform}. Please check your internet connection and try again.`);
    } else {
      throw new Error(`Failed to link ${platform} account. Error: ${error.message || 'Unknown error'}`);
    }
  }
}; 