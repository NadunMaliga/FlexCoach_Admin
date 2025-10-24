import { useRouter, useSegments } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import ApiService from '../services/api';

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
        // Verify token is still valid by making a test request
        try {
          await ApiService.getProfile();
          setIsAuthenticated(true);
          console.log('✅ Token is valid, user authenticated');
        } catch (error) {
          console.log('❌ Token invalid, removing stored token');
          await ApiService.removeToken();
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
        console.log('ℹ️ No stored token found');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (password: string, email = 'admin@gmail.com'): Promise<boolean> => {
    try {
      const response = await ApiService.login(password, email);
      
      if (response.success && response.token) {
        setIsAuthenticated(true);
        console.log('✅ Login successful');
        return true;
      } else {
        console.log('❌ Login failed:', response.error);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await ApiService.logout();
      setIsAuthenticated(false);
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if API call fails
      setIsAuthenticated(false);
    }
  };

  // Handle navigation based on auth state
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inProtectedGroup = segments[0] === '(protected)';

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