import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { keycloak, initKeycloak, getValidToken } from './keycloak';
import { AuthState, CitizenAuthMethod, UserProfile, UserRole } from '../types/auth';

const AuthContext = createContext<AuthState | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const extractUserProfile = useCallback((): UserProfile | null => {
    if (!keycloak.authenticated || !keycloak.tokenParsed) return null;

    const parsed = keycloak.tokenParsed as Record<string, unknown>;
    const realmAccess = parsed.realm_access as { roles?: string[] } | undefined;
    const roles: UserRole[] = (realmAccess?.roles || (parsed.roles as string[]) || []) as UserRole[];

    const sub = (parsed.sub as string) || '';
    const preferredUsername = (parsed.preferred_username as string) || '';
    const username = (parsed.username as string) || preferredUsername || sub;

    // Resolve canonical citizen ID: citizen_01..citizen_15 maps to CIT-000001..CIT-000015
    const isCitizen = roles.some((r) => r.toUpperCase() === 'CITIZEN');
    let canonicalCitizenId: string | undefined = (parsed.canonical_citizen_id as string) || undefined;
    if (!canonicalCitizenId && isCitizen) {
      if (preferredUsername.startsWith('CIT-')) {
        canonicalCitizenId = preferredUsername;
      } else if (preferredUsername.startsWith('citizen_') || username.startsWith('citizen_')) {
        const targetName = preferredUsername.startsWith('citizen_') ? preferredUsername : username;
        const parts = targetName.split('_');
        const num = parseInt(parts[1], 10);
        if (!isNaN(num)) {
          canonicalCitizenId = `CIT-${String(num).padStart(6, '0')}`;
        }
      }
    }

    const departmentCode = (parsed.department_code as string) || undefined;
    const email = (parsed.email as string) || undefined;

    return {
      sub,
      username,
      email,
      roles,
      preferred_username: preferredUsername,
      canonical_citizen_id: canonicalCitizenId,
      department_code: departmentCode,
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    initKeycloak().then((authenticated) => {
      if (!isMounted) return;
      setIsAuthenticated(authenticated);
      if (authenticated) {
        setToken(keycloak.token || null);
        setUser(extractUserProfile());
      } else if (import.meta.env.DEV) {
        // In local development, check if a dev persona session was saved
        const savedDevAuth = localStorage.getItem('fisop_dev_auth');
        if (savedDevAuth) {
          try {
            const parsed = JSON.parse(savedDevAuth);
            setUser(parsed.user);
            setToken(parsed.token);
            setIsAuthenticated(true);
          } catch {
            localStorage.removeItem('fisop_dev_auth');
          }
        }
      }
      setIsLoading(false);
    });

    keycloak.onTokenExpired = async () => {
      try {
        await keycloak.updateToken(30);
        if (isMounted) {
          setToken(keycloak.token || null);
        }
      } catch (err) {
        console.warn('Failed to refresh expired Keycloak token:', err);
      }
    };

    keycloak.onAuthLogout = () => {
      if (isMounted) {
        setIsAuthenticated(false);
        setUser(null);
        setToken(null);
      }
    };

    return () => {
      isMounted = false;
    };
  }, [extractUserProfile]);

  const login = useCallback(async (redirectPath?: string) => {
    try {
      const redirectUri = redirectPath
        ? `${window.location.origin}${redirectPath}`
        : `${window.location.origin}/access`;
      await keycloak.login({
        redirectUri,
      });
    } catch (err) {
      console.error('Keycloak login redirect error:', err);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      localStorage.removeItem('fisop_dev_auth');
      setIsAuthenticated(false);
      setUser(null);
      setToken(null);
      if (keycloak.authenticated) {
        await keycloak.logout({
          redirectUri: window.location.origin,
        });
      }
    } catch (err) {
      console.error('Keycloak logout error:', err);
    }
  }, []);

  const devLogin = useCallback((persona: 'CITIZEN' | 'DEPARTMENT_OFFICIAL' | 'ADMIN', targetId?: string | number) => {
    if (!import.meta.env.DEV) return;
    
    let devProfile: UserProfile;
    if (persona === 'CITIZEN') {
      let num = 1;
      if (typeof targetId === 'number') {
        num = targetId;
      } else if (typeof targetId === 'string') {
        const match = targetId.match(/\d+/);
        if (match) num = parseInt(match[0], 10);
      }
      const citNumStr = String(num).padStart(6, '0');
      const citId = `CIT-${citNumStr}`;
      devProfile = {
        sub: `dev-citizen-${String(num).padStart(2, '0')}-uuid`,
        username: `citizen_${String(num).padStart(2, '0')}`,
        preferred_username: citId,
        canonical_citizen_id: citId,
        email: `citizen.${citNumStr}@synthetic-gov.example`,
        roles: ['CITIZEN'],
      };
    } else if (persona === 'DEPARTMENT_OFFICIAL') {
      let deptCode = 'REV';
      let officerNum = 1;
      if (typeof targetId === 'string') {
        const parts = targetId.split('_');
        if (parts.length >= 2) {
          deptCode = parts[0].toUpperCase();
          officerNum = parseInt(parts[1], 10) || 1;
        } else {
          deptCode = targetId.toUpperCase();
        }
      }
      devProfile = {
        sub: `dev-${deptCode.toLowerCase()}-official-${officerNum}-uuid`,
        username: `official_${deptCode.toLowerCase()}_0${officerNum}`,
        preferred_username: `official_${deptCode.toLowerCase()}_0${officerNum}`,
        canonical_citizen_id: `${deptCode}-OFFICER-0${officerNum}`,
        department_code: deptCode,
        email: `${deptCode.toLowerCase()}_official_${officerNum}@gov.example`,
        roles: ['DEPARTMENT_OFFICIAL'],
      };
    } else {
      devProfile = {
        sub: 'dev-admin-user-uuid',
        username: 'admin_user',
        preferred_username: 'admin_user',
        canonical_citizen_id: 'ADMIN-ROOT',
        email: 'admin@synthetic-gov.example',
        roles: ['ADMIN', 'DATA_STEWARD', 'OPERATIONS'],
      };
    }

    // Fetch a real signed JWT from the backend dev-token endpoint
    fetch('/api/dev/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sub: devProfile.sub,
        username: devProfile.username,
        roles: devProfile.roles,
        email: devProfile.email,
        preferred_username: devProfile.preferred_username,
        department_code: devProfile.department_code ?? null,
      }),
    })
      .then((res) => res.json())
      .then((data: { access_token?: string }) => {
        const realToken = data.access_token;
        if (!realToken) throw new Error('No access_token returned');
        setUser(devProfile);
        setToken(realToken);
        setIsAuthenticated(true);
        localStorage.setItem('fisop_dev_auth', JSON.stringify({ user: devProfile, token: realToken }));
      })
      .catch((err) => {
        console.error('[Dev Login] Could not fetch signed token from backend:', err);
        setUser(devProfile);
        setToken(null);
        setIsAuthenticated(true);
        localStorage.setItem('fisop_dev_auth', JSON.stringify({ user: devProfile, token: null }));
      });
  }, []);

  const citizenLogin = useCallback(async (_method: CitizenAuthMethod, citizenId?: string | number): Promise<void> => {
    if (import.meta.env.DEV) {
      let num = 1;
      if (typeof citizenId === 'number') {
        num = citizenId;
      } else if (typeof citizenId === 'string') {
        const match = citizenId.match(/\d+/);
        if (match) num = parseInt(match[0], 10);
      }

      const citNumStr = String(num).padStart(6, '0');
      const citId = `CIT-${citNumStr}`;
      const citizenProfile: UserProfile = {
        sub: `dev-citizen-${String(num).padStart(2, '0')}-uuid`,
        username: `citizen_${String(num).padStart(2, '0')}`,
        preferred_username: citId,
        canonical_citizen_id: citId,
        email: `citizen.${citNumStr}@synthetic-gov.example`,
        roles: ['CITIZEN'],
      };

      return new Promise<void>((resolve) => {
        fetch('/api/dev/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sub: citizenProfile.sub,
            username: citizenProfile.username,
            roles: citizenProfile.roles,
            email: citizenProfile.email,
            preferred_username: citizenProfile.preferred_username,
            department_code: null,
          }),
        })
          .then((res) => res.json())
          .then((data: { access_token?: string }) => {
            const realToken = data.access_token;
            if (!realToken) throw new Error('No access_token returned');
            setUser(citizenProfile);
            setToken(realToken);
            setIsAuthenticated(true);
            localStorage.setItem(
              'fisop_dev_auth',
              JSON.stringify({ user: citizenProfile, token: realToken })
            );
            resolve();
          })
          .catch((err) => {
            console.error('[Citizen Login] Could not fetch signed token:', err);
            setUser(citizenProfile);
            setToken(null);
            setIsAuthenticated(true);
            localStorage.setItem(
              'fisop_dev_auth',
              JSON.stringify({ user: citizenProfile, token: null })
            );
            resolve();
          });
      });
    } else {
      throw new Error(
        'Production citizen authentication endpoint not yet configured.'
      );
    }
  }, []);

  const sendCitizenOtp = useCallback(async (phone: string): Promise<{ masked_phone: string }> => {
    const res = await fetch('/api/auth/citizen/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Could not send OTP.');
    }
    return { masked_phone: data.masked_phone };
  }, []);

  const verifyCitizenOtp = useCallback(async (phone: string, otp: string): Promise<void> => {
    const res = await fetch('/api/auth/citizen/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'OTP verification failed.');
    }
    const realToken = data.access_token;
    const profile: UserProfile = data.user;
    setUser(profile);
    setToken(realToken);
    setIsAuthenticated(true);
    localStorage.setItem('fisop_dev_auth', JSON.stringify({ user: profile, token: realToken }));
  }, []);

  const getToken = useCallback(async (): Promise<string | null> => {
    if (token) return token;
    return await getValidToken();
  }, [token]);

  const hasRole = useCallback(
    (roleToCheck: UserRole | UserRole[]): boolean => {
      if (!user || !user.roles) return false;
      const userRolesUpper = user.roles.map((r) => r.toUpperCase());
      const checks = Array.isArray(roleToCheck) ? roleToCheck : [roleToCheck];
      return checks.some((r) => userRolesUpper.includes(r.toUpperCase()));
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        token,
        login,
        logout,
        hasRole,
        getToken,
        devLogin,
        citizenLogin,
        sendCitizenOtp,
        verifyCitizenOtp,
      }}
    >

      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthState => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
