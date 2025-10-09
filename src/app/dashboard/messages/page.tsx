'use client';

import MessagingClient from "@/components/MessagingClient";
import PrivateRoute from "@/components/PrivateRoute";
import { MessagingProvider } from "@/contexts/MessagingContext";

export default function MessagingPage() {
  return (
    <PrivateRoute>
      <MessagingProvider>
        <MessagingClient userRole="USER" />
      </MessagingProvider>
    </PrivateRoute>
  );
}