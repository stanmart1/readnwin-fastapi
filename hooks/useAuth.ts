"use client";

import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// For backward compatibility with components expecting session-like object
export const useSession = () => {
  const auth = useAuth();
  return {
    data: auth.user
      ? {
          user: {
            id: auth.user.id.toString(),
            email: auth.user.email,
            username: auth.user.username,
            firstName: auth.user.first_name || "",
            lastName: auth.user.last_name || "",
            role: auth.user.role?.name || "user",
            roleDisplayName: auth.user.role?.display_name || "User",
            roles: [auth.user.role?.name || "user"],
            permissions: auth.user.permissions || [],
            lastLogin: new Date().toISOString(),
          },
        }
      : null,
    status: auth.status,
  };
};
