import { useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
// @ts-ignore
import React, { createContext, useContext, useEffect, useState } from 'react';
// @ts-ignore
import ApiService from '../services/api';
import Logger from '../utils/logger';

// Token expiration utilities
const TOKEN_EXPIRATION_TIME = 24 * 60 * 60 * 1000; // 24 hours
const TOKEN_REFRESH_THRESHOLD = 2 * 60 * 60 * 1000; // 2 hours before expiration

const isTokenExpired = (tokenTimestamp: number): boolean => {
  const now = Date.now();
  return now - tokenTimestamp > TOKEN_EXPIRATION_TIME;
};

const shouldRefreshToken = (tokenTimestamp: number): boolean => {
  const now = Date.now();
  const timeUntilExpiration = TOKEN_EXPIRATION_TIME - (now - tokenTimestamp);
  return timeUntilExpiration < TOKEN_REFRESH_THRESHOLD;
};

const saveTokenTimestamp = async (timestamp: number) => {
  try {
    await SecureStore.setItemAsync('tokenTimestamp', timestamp.toString());
  } catch (error) {
    Logger.error('Failed to save token timestamp:', error);
  }
};

const getTokenTimestamp = async (): Promise<number | null> => {
  try {
    const timestamp = await SecureStore.getItemAsync('tokenTimestamp');
    return timestamp ? parseInt(timestamp, 10) : null;
  } catch (error) {
    Logger.error('Failed to get token timestamp:', error);
    return null;
  }
};


interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (password: string, email?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);

      // Load token from secure storage
      await ApiService.loadToken();

      if (ApiService.token) {
      // Check token expiration
      const tokenTimestamp = await getTokenTimestamp();
      
      if (tokenTimestamp && isTokenExpired(tokenTimestamp)) {
        Logger.log('Token expired, logging out');
        await ApiService.removeToken();
        await SecureStore.deleteItemAsync('tokenTimestamp');
        setIsAuthenticated(false);
        return;
      }
      
      // Check if token should be refreshed
      if (tokenTimestamp && shouldRefreshToken(tokenTimestamp)) {
        Logger.log('Token nearing expiration, should refresh');
        // TODO: Implement token refresh endpoint
      }
        // Verify token is still valid by making a test request
        try {
          await ApiService.getProfile();
          setIsAuthenticated(true);
          Logger.success('Token is valid, user authenticated');
        } catch (error) {
          Logger.log('❌ Token invalid, removing stored token');
          await ApiService.removeToken();
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
        Logger.info('No stored token found');
      }
    } catch (error) {
      Logger.error('Auth check error:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (password: string, email = 'admin@gmail.com'): Promise<boolean> => {
    try {
      const response = await ApiService.login(password, email);

      if (response.success && response.token) {
        await saveTokenTimestamp(Date.now());
        setIsAuthenticated(true);
        Logger.success('Login successful');
        return true;
      } else {
        Logger.log('❌ Login failed:', response.error);
        return false;
      }
    } catch (error) {
      Logger.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await ApiService.logout();
      setIsAuthenticated(false);
      Logger.success('Logout successful');
    } catch (error) {
      Logger.error('Logout error:', error);
      // Still clear local state even if API call fails
      setIsAuthenticated(false);
    }
  };

  // Handle navigation based on auth state
  useEffect(() => {
    if (isLoading) return;

    const inProtectedGroup = (segments as string[])[0] === '(protected)';
    const onSigninPage = (segments as string[])[0] === 'signin' || (segments as string[]).includes('signin');

    if (isAuthenticated) {
      // User is authenticated
      if (!inProtectedGroup) {
        // Redirect to home if not already in protected area
        router.replace('/(protected)/Home');
      }
    } else {
      // User is not authenticated
      if (inProtectedGroup) {
        // Redirect to signin if trying to access protected area
        router.replace('/signin');
      }
    }
  }, [isAuthenticated, isLoading, segments]);

  // Check auth status on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        login,
        logout,
        checkAuthStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}