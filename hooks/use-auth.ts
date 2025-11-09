"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import { onAuthStateChange, getUserProfile, signOut as firebaseSignOut } from "@/lib/firebase/auth";

/**
 * Hook for managing authentication
 */
export function useAuth() {
  const { user, userProfile, loading, error, setUser, setUserProfile, setLoading, setError } =
    useAuthStore();

  useEffect(() => {
    setLoading(true);

    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);

        // Fetch user profile
        try {
          const profile = await getUserProfile(firebaseUser.uid);
          setUserProfile(profile);
        } catch (err) {
          console.error("Error fetching user profile:", err);
          setError("Failed to load user profile");
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setUserProfile, setLoading, setError]);

  const signOut = async () => {
    try {
      await firebaseSignOut();
      setUser(null);
      setUserProfile(null);
    } catch (err) {
      console.error("Error signing out:", err);
      throw err;
    }
  };

  return {
    user,
    userProfile,
    loading,
    error,
    isAuthenticated: !!user,
    signOut,
  };
}
