"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/useAuth";
import { ReactNode, useEffect } from "react";

interface PrivateRouteProps {
  children: ReactNode;
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <p>Carregando...</p>
      </div>
    );
  }

  return <>{children}</>;
};

export default PrivateRoute;