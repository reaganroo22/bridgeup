/**
 * OAuth Authentication Service
 * Handles Apple and Google sign-in for Wizzmo
 */

import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import * as AppleAuthentication from 'expo-apple-authentication';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Complete the auth session for WebBrowser
WebBrowser.maybeCompleteAuthSession();

// OAuth redirect URI
const redirectUri = AuthSession.makeRedirectUri({
  scheme: 'mobile',
  path: '/auth',
});

console.log('[OAuth] Redirect URI:', redirectUri);

// Configure native Google Sign-In
GoogleSignin.configure({
  iosClientId: '682302619545-mski67oikngevikcke5t4m5j2vaus5vm.apps.googleusercontent.com',
  webClientId: '682302619545-umvagookghkn0u0dl8l8fcdke6j9mvr5.apps.googleusercontent.com',
});

/**
 * Sign in with Google using native iOS implementation
 */
export async function signInWithGoogle() {
  try {
    console.log('[OAuth] Starting native Google sign-in');

    // Check if Google Play Services are available (for Android)
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    // Sign in with Google natively
    const userInfo = await GoogleSignin.signIn();
    
    // Check if sign-in was cancelled
    if (!userInfo || !userInfo.data?.user) {
      console.log('[OAuth] Google sign-in was cancelled or returned no user data');
      return { data: null, error: new Error('Google sign-in was cancelled') };
    }

    console.log('[OAuth] Google sign-in successful:', {
      user: userInfo.data?.user?.id,
      email: userInfo.data?.user?.email,
    });

    // Get the ID token for Supabase
    const tokens = await GoogleSignin.getTokens();
    
    if (!tokens?.idToken) {
      console.error('[OAuth] No ID token received from Google');
      // Clean up any partial Google session
      await GoogleSignin.signOut();
      throw new Error('Failed to get authentication token from Google');
    }

    console.log('[OAuth] Got Google tokens');

    // Sign in to Supabase with the Google ID token
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: tokens.idToken,
    });

    if (error) {
      console.error('[OAuth] Supabase Google auth error:', error);
      // Clean up Google session on Supabase auth failure
      await GoogleSignin.signOut();
      throw error;
    }

    console.log('[OAuth] Supabase authentication successful');
    return { data, error: null };
  } catch (error) {
    console.error('[OAuth] Native Google sign-in error:', error);
    
    // Ensure we clean up any partial Google sessions
    try {
      await GoogleSignin.signOut();
    } catch (signOutError) {
      console.warn('[OAuth] Error cleaning up Google session:', signOutError);
    }
    
    // Check if this was a user cancellation
    const errorMessage = (error as Error).message;
    if (errorMessage.includes('cancelled') || errorMessage.includes('cancel') || 
        errorMessage.includes('user_cancelled') || errorMessage.includes('SIGN_IN_CANCELLED')) {
      return { data: null, error: new Error('Google sign-in was cancelled') };
    }
    
    return { data: null, error: error as Error };
  }
}

/**
 * Sign in with Apple using native iOS implementation
 */
export async function signInWithApple() {
  try {
    console.log('[OAuth] Starting Apple sign-in');

    // For iOS, use native Apple Sign In
    if (Platform.OS === 'ios') {
      // Check if Apple Sign In is available
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Apple Sign In is not available on this device');
      }

      // Sign in with Apple natively
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      console.log('[OAuth] Apple credential received:', {
        user: credential.user,
        email: credential.email,
        fullName: credential.fullName,
      });

      // Sign in to Supabase with the Apple ID token
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken!,
        nonce: credential.nonce,
      });

      if (error) {
        console.error('[OAuth] Supabase Apple auth error:', error);
        throw error;
      }

      console.log('[OAuth] Apple sign-in successful');
      return { data, error: null };
    } else {
      // For Android/Web, use web-based Apple OAuth
      const request = new AuthSession.AuthRequest({
        clientId: process.env.EXPO_PUBLIC_APPLE_CLIENT_ID || 'com.wizzmo.app.signin',
        scopes: ['email', 'name'],
        redirectUri,
        responseType: AuthSession.ResponseType.Code,
        state: await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          Math.random().toString(),
          { encoding: Crypto.CryptoEncoding.HEX }
        ),
      });

      const result = await request.promptAsync({
        authorizationEndpoint: 'https://appleid.apple.com/auth/authorize',
      });

      if (result.type === 'success' && result.params.code) {
        // Exchange code for session with Supabase
        const { data, error } = await supabase.auth.exchangeCodeForSession(result.params.code);

        if (error) {
          console.error('[OAuth] Supabase Apple auth error:', error);
          throw error;
        }

        console.log('[OAuth] Apple sign-in successful');
        return { data, error: null };
      } else {
        console.log('[OAuth] Apple sign-in cancelled or failed:', result.type);
        return { data: null, error: new Error('Apple sign-in was cancelled') };
      }
    }
  } catch (error) {
    console.error('[OAuth] Apple sign-in error:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Generic OAuth sign-in function
 */
export async function signInWithProvider(provider: 'google' | 'apple') {
  switch (provider) {
    case 'google':
      return signInWithGoogle();
    case 'apple':
      return signInWithApple();
    default:
      return { data: null, error: new Error('Unsupported OAuth provider') };
  }
}

/**
 * Get user profile data from OAuth provider
 */
export function extractUserDataFromOAuth(user: any) {
  const userData = {
    email: user.email,
    full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
    avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
    provider: user.app_metadata?.provider || 'unknown',
  };

  console.log('[OAuth] Extracted user data:', {
    email: userData.email,
    full_name: userData.full_name,
    provider: userData.provider,
    has_avatar: !!userData.avatar_url,
  });

  return userData;
}

/**
 * Check if OAuth is properly configured
 */
export function isOAuthConfigured() {
  const googleConfigured = !!process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
  const appleConfigured = Platform.OS === 'ios' || !!process.env.EXPO_PUBLIC_APPLE_CLIENT_ID;

  console.log('[OAuth] Configuration status:', {
    google: googleConfigured,
    apple: appleConfigured,
  });

  return {
    google: googleConfigured,
    apple: appleConfigured,
    anyConfigured: googleConfigured || appleConfigured,
  };
}

// Export the service as default
export default {
  signInWithGoogle,
  signInWithApple,
  signInWithProvider,
  extractUserDataFromOAuth,
  isOAuthConfigured,
};