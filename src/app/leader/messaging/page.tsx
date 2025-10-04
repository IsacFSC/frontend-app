'use client';

import MessagingClient from "@/components/MessagingClient";
import PrivateRoute from "@/components/PrivateRoute";

export default function MessagingPage() {
  return (
    <PrivateRoute>
      <MessagingClient userRole="LEADER" />
    </PrivateRoute>
  );
}