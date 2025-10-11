'use client';

import { AxiosError } from 'axios';
import { createContext, ReactNode, useEffect, useState, useCallback } from 'react'; // Adicione useCallback aqui
import { setCookie, parseCookies, destroyCookie } from 'nookies';
import { api } from '../services/api';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { jwtDecode } from 'jwt-decode';

// Based on prisma.schema
enum Role {
  ADMIN = 'ADMIN',
  LEADER = 'LEADER',
  USER = 'USER',
}

interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
}

interface AuthContextData {
  isAuthenticated: boolean;
  user: User | null;
  signIn: ({ email, password }: { email: string; password: string }) => Promise<void>;
  signOut: () => void;
  error: string | null;
  clearError: () => void;
  loading: boolean;
}

interface AuthProviderProps {
  children: ReactNode;
}

interface ErrorResponse {
  message?: string;
  error?: string;
  errors?: { message: string }[];
}

export const AuthContext = createContext({} as AuthContextData);

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const isAuthenticated = !!user;

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const signOut = useCallback(() => { // CORRIGIDO: Envolvido em useCallback
    destroyCookie(undefined, 'nextauth.token');
    localStorage.removeItem('user.data');
    setUser(null);
    router.push('/login');
  }, [router]); // router estável, mas uma boa prática adicioná-lo

  useEffect(() => {
    setLoading(true);
    const { 'nextauth.token': token } = parseCookies();

    if (token) {
      api.defaults.headers['Authorization'] = `Bearer ${token}`;
      const userDataStr = localStorage.getItem('user.data');
      if (userDataStr) {
        try {
          const restoredUser = JSON.parse(userDataStr);
          setUser(restoredUser as User);
        } catch {
          localStorage.removeItem('user.data');
          setUser(null);
        }
      } else {
        try {
            const decodedToken = jwtDecode<{ sub: number; name: string; email: string; role: Role; avatar?: string }>(token);
            const restoredUser = {
                id: decodedToken.sub,
                name: decodedToken.name,
                email: decodedToken.email,
                role: decodedToken.role,
                avatar: decodedToken.avatar,
            };
            setUser(restoredUser);
            localStorage.setItem('user.data', JSON.stringify(restoredUser));
        } catch {
            signOut();
        }
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  }, [signOut]);

    async function signIn({ email, password }: { email: string; password: string }) {
    setError(null);
    try {
      const { data } = await api.post('/auth', {
        email,
        password,
      });

      if (!data.token || !data.user) {
        console.error("Sign in failed: Invalid response from server.");
        setError("An unexpected error occurred. Please try again.");
        return;
      }

      const { token, user: userData } = data;

      setCookie(undefined, 'nextauth.token', token, {
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      });

      localStorage.setItem('user.data', JSON.stringify(userData));

      setUser(userData);
      api.defaults.headers['Authorization'] = `Bearer ${token}`;

      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to sign in', error);

      const err = error as AxiosError<ErrorResponse>;
      
      const errorMessage = err.response?.data?.message || "Email ou senha inválidos. Por favor, tente novamente.";

      toast.error(errorMessage, {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#FF4B4B',
          color: '#FFFFFF',
          border: '2px solid #FF4B4B',
        },
        iconTheme: {
          primary: '#FFFFFF',
          secondary: '#FF4B4B',
        },
      });
    }
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, signIn, signOut, error, clearError, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
