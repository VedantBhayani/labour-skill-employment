import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthProvider';
import { apiRegistry, ApiConfig, IntegrationType } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

// SSO Provider types
export type SSOProviderType = 'google' | 'microsoft' | 'okta' | 'auth0' | 'custom';

interface SSOConfig {
  providerType: SSOProviderType;
  clientId: string;
  redirectUri: string;
  providerName: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  userInfoEndpoint?: string;
  scope: string;
  responseType: string;
  additionalParams?: Record<string, string>;
  logo?: string;
}

interface SSOUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  accessToken: string;
  idToken?: string;
  expiresAt: number;
  provider: SSOProviderType;
}

interface SSOContextType {
  configuredProviders: SSOConfig[];
  currentUser: SSOUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  addProvider: (config: SSOConfig) => void;
  removeProvider: (providerType: SSOProviderType) => void;
  login: (providerType: SSOProviderType) => void;
  logout: () => void;
  handleCallback: (providerType: SSOProviderType, code: string) => Promise<SSOUser>;
}

const SSOContext = createContext<SSOContextType | undefined>(undefined);

export function SSOProvider({ children }: { children: ReactNode }) {
  const { login: authLogin, user: authUser } = useAuth();
  const [configuredProviders, setConfiguredProviders] = useState<SSOConfig[]>([]);
  const [currentUser, setCurrentUser] = useState<SSOUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user is authenticated by checking token in localStorage
  useEffect(() => {
    const checkAuthentication = () => {
      const ssoUser = localStorage.getItem('sso_user');
      if (ssoUser) {
        try {
          const parsedUser = JSON.parse(ssoUser) as SSOUser;
          
          // Check if token is expired
          if (parsedUser.expiresAt < Date.now()) {
            localStorage.removeItem('sso_user');
            setCurrentUser(null);
            return;
          }
          
          setCurrentUser(parsedUser);
          
          // If auth system doesn't have a user, login with SSO user
          if (!authUser) {
            authLogin({
              id: parsedUser.id,
              name: parsedUser.name,
              email: parsedUser.email,
              avatar: parsedUser.picture,
              role: 'employee', // Default role, would be mapped in a real implementation
            });
          }
        } catch (error) {
          console.error('Failed to parse SSO user from localStorage', error);
          localStorage.removeItem('sso_user');
        }
      }
    };
    
    checkAuthentication();
  }, [authLogin, authUser]);

  // Add a new SSO provider
  const addProvider = (config: SSOConfig) => {
    setConfiguredProviders(prev => {
      // Check if provider already exists
      const existing = prev.findIndex(p => p.providerType === config.providerType);
      if (existing !== -1) {
        // Replace existing provider
        const newProviders = [...prev];
        newProviders[existing] = config;
        return newProviders;
      }
      // Add new provider
      return [...prev, config];
    });
  };

  // Remove an SSO provider
  const removeProvider = (providerType: SSOProviderType) => {
    setConfiguredProviders(prev => prev.filter(p => p.providerType !== providerType));
  };

  // Start SSO login process
  const login = (providerType: SSOProviderType) => {
    const provider = configuredProviders.find(p => p.providerType === providerType);
    if (!provider) {
      setError(`SSO provider ${providerType} not configured`);
      toast({
        title: "SSO Error",
        description: `SSO provider ${providerType} not configured`,
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Construct authorization URL
      const authUrl = new URL(provider.authorizationEndpoint);
      
      // Add required params
      authUrl.searchParams.append('client_id', provider.clientId);
      authUrl.searchParams.append('redirect_uri', provider.redirectUri);
      authUrl.searchParams.append('response_type', provider.responseType);
      authUrl.searchParams.append('scope', provider.scope);
      
      // Add state for security
      const state = generateRandomString(32);
      localStorage.setItem('sso_state', state);
      authUrl.searchParams.append('state', state);
      
      // Add additional params
      if (provider.additionalParams) {
        Object.entries(provider.additionalParams).forEach(([key, value]) => {
          authUrl.searchParams.append(key, value);
        });
      }
      
      // Redirect to authorization URL
      window.location.href = authUrl.toString();
    } catch (error) {
      console.error('SSO login failed', error);
      setError('Failed to initiate SSO login');
      setIsLoading(false);
      toast({
        title: "SSO Error",
        description: "Failed to initiate SSO login",
        variant: "destructive"
      });
    }
  };

  // Handle SSO callback
  const handleCallback = async (providerType: SSOProviderType, code: string): Promise<SSOUser> => {
    const provider = configuredProviders.find(p => p.providerType === providerType);
    if (!provider) {
      const error = `SSO provider ${providerType} not configured`;
      setError(error);
      toast({
        title: "SSO Error",
        description: error,
        variant: "destructive"
      });
      return Promise.reject(new Error(error));
    }

    setIsLoading(true);
    setError(null);

    try {
      // Exchange code for token
      // This would typically be done server-side to protect client secret
      // For demo purposes, we're doing it client-side
      const tokenResponse = await fetch(provider.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          client_id: provider.clientId,
          redirect_uri: provider.redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to exchange code for token');
      }

      const tokenData = await tokenResponse.json();
      
      // Get user info if endpoint is provided
      let userInfo = { sub: '', email: '', name: '', picture: '' };
      if (provider.userInfoEndpoint) {
        const userInfoResponse = await fetch(provider.userInfoEndpoint, {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
          },
        });
        
        if (userInfoResponse.ok) {
          userInfo = await userInfoResponse.json();
        }
      }
      
      // Create SSO user
      const ssoUser: SSOUser = {
        id: userInfo.sub || tokenData.sub || '',
        email: userInfo.email || '',
        name: userInfo.name || '',
        picture: userInfo.picture,
        accessToken: tokenData.access_token,
        idToken: tokenData.id_token,
        expiresAt: Date.now() + (tokenData.expires_in * 1000 || 3600000),
        provider: providerType,
      };
      
      // Save user to state and localStorage
      setCurrentUser(ssoUser);
      localStorage.setItem('sso_user', JSON.stringify(ssoUser));
      
      // Login to auth system
      authLogin({
        id: ssoUser.id,
        name: ssoUser.name,
        email: ssoUser.email,
        avatar: ssoUser.picture,
        role: 'employee', // Default role, would be mapped in a real implementation
      });
      
      setIsLoading(false);
      toast({
        title: "SSO Login Successful",
        description: `Logged in as ${ssoUser.name}`,
      });
      
      return ssoUser;
    } catch (error) {
      console.error('SSO callback failed', error);
      const errorMessage = 'Failed to complete SSO authentication';
      setError(errorMessage);
      setIsLoading(false);
      toast({
        title: "SSO Error",
        description: errorMessage,
        variant: "destructive"
      });
      return Promise.reject(new Error(errorMessage));
    }
  };

  // Logout from SSO
  const logout = () => {
    localStorage.removeItem('sso_user');
    setCurrentUser(null);
  };

  return (
    <SSOContext.Provider
      value={{
        configuredProviders,
        currentUser,
        isAuthenticated: !!currentUser,
        isLoading,
        error,
        addProvider,
        removeProvider,
        login,
        logout,
        handleCallback,
      }}
    >
      {children}
    </SSOContext.Provider>
  );
}

// Helper to generate random string for state
function generateRandomString(length: number): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomValues = new Uint8Array(length);
  window.crypto.getRandomValues(randomValues);
  randomValues.forEach(val => {
    result += charset[val % charset.length];
  });
  return result;
}

// Hook to use SSO context
export function useSSO() {
  const context = useContext(SSOContext);
  if (context === undefined) {
    throw new Error('useSSO must be used within an SSOProvider');
  }
  return context;
} 