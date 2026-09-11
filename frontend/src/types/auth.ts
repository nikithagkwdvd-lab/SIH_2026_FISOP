export type UserRole = 'CITIZEN' | 'DEPARTMENT_OFFICIAL' | 'ADMIN' | 'OPERATIONS' | string;

export type CitizenAuthMethod = 'mobile_otp' | 'aadhaar_otp' | 'digilocker';

export interface UserProfile {
  sub: string;
  username: string;
  email?: string;
  roles: UserRole[];
  preferred_username?: string;
  canonical_citizen_id?: string;
  department_code?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null;
  token: string | null;
  login: (redirectPath?: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  getToken: () => Promise<string | null>;
  devLogin?: (persona: 'CITIZEN' | 'DEPARTMENT_OFFICIAL' | 'ADMIN', targetId?: string | number) => void;
  /** Citizen-facing prototype authentication bridge (Mobile OTP / Aadhaar / DigiLocker) */
  citizenLogin: (method: CitizenAuthMethod, citizenId?: string | number) => Promise<void>;
  sendCitizenOtp?: (phone: string) => Promise<{ masked_phone: string }>;
  verifyCitizenOtp?: (phone: string, otp: string) => Promise<void>;
}


