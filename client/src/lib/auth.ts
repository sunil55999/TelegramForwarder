import { apiRequest } from "./queryClient";

export interface User {
  id: number;
  username: string;
  email: string;
  plan: string;
  telegramAccounts: any[];
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

let authToken: string | null = localStorage.getItem('auth_token');

export const getAuthToken = () => authToken;

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
};

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await apiRequest('POST', '/api/auth/login', { email, password });
  const data: AuthResponse = await response.json();
  setAuthToken(data.token);
  return data;
};

export const register = async (username: string, email: string, password: string): Promise<AuthResponse> => {
  const response = await apiRequest('POST', '/api/auth/register', { username, email, password });
  const data: AuthResponse = await response.json();
  setAuthToken(data.token);
  return data;
};

export const logout = () => {
  setAuthToken(null);
};

export const getCurrentUser = async (): Promise<User | null> => {
  if (!authToken) return null;
  
  try {
    const response = await fetch('/api/user/profile', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        logout();
        return null;
      }
      throw new Error('Failed to fetch user');
    }
    
    return await response.json();
  } catch (error) {
    logout();
    return null;
  }
};
