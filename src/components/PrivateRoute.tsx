
"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/useAuth";
import { ReactNode, useEffect } from "react";

interface PrivateRouteProps {
  children: ReactNode;
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const { isAuthenticated, user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated && !loading) {
      router.push("/login");
    }
  }, [isAuthenticated, loading, router]);

  if (!isAuthenticated) {
  if (loading) return <p>Carregando...</p>;
  return null;
  }

  // Check if user has a valid role
  if (user && user.role && !["ADMIN", "LEADER", "USER"].includes(user.role)) {
    if (!loading) {
      router.push("/login");
      return null;
    }
  }

  return <>{children}</>;
};

export default PrivateRoute;
