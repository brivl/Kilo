import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import type { Session } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import Constants from 'expo-constants';
import { create } from 'zustand';

import { supabase } from '@/lib/supabase';
import { useToastStore } from '@/store/toastStore';

interface AuthState {
  session: Session | null;
  isLoading: boolean;
  initialize: () => void;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
}

function toastAuthError(message: string) {
  const toast = useToastStore.getState().showToast;
  if (message.includes('already registered') || message.includes('already exists')) {
    toast('An account with this email already exists', 'error');
  } else if (message.includes('Invalid login') || message.includes('invalid credentials')) {
    toast('Incorrect email or password', 'error');
  } else if (message.includes('network') || message.includes('fetch')) {
    toast("Couldn't reach server. Check your connection.", 'error');
  } else {
    toast('Something went wrong. Please try again.', 'error');
  }
}

export const useAuthStore = create<AuthState>(set => ({
  session: null,
  isLoading: true,

  initialize: () => {
    GoogleSignin.configure({
      iosClientId: Constants.expoConfig?.extra?.googleIosClientId as string,
    });
    supabase.auth.getSession().then(({ data }) => {
      set({ session: data.session, isLoading: false });
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session });
    });
  },

  signUp: async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      toastAuthError(error.message);
      throw error;
    }
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toastAuthError(error.message);
      throw error;
    }
  },

  signInWithApple: async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) throw new Error('No identity token from Apple');
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });
      if (error) throw error;
    } catch (e) {
      const err = e as { code?: string; message?: string };
      if (err.code === 'ERR_REQUEST_CANCELED') return;
      toastAuthError(err.message ?? 'Apple sign-in failed');
      throw e;
    }
  },

  signInWithGoogle: async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;
      if (!idToken) throw new Error('No ID token from Google');
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });
      if (error) throw error;
    } catch (e) {
      const err = e as { code?: string; message?: string };
      if (err.code === statusCodes.SIGN_IN_CANCELLED) return;
      toastAuthError(err.message ?? 'Google sign-in failed');
      throw e;
    }
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toastAuthError(error.message);
      throw error;
    }
  },

  sendPasswordReset: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      toastAuthError(error.message);
      throw error;
    }
    useToastStore.getState().showToast('Reset link sent to your email');
  },
}));
