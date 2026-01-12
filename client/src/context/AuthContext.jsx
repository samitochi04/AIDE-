import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { supabase } from "../lib/supabaseClient";
import { useHcaptcha } from "../features/user/useHcaptcha";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const { getToken: getHcaptchaToken } = useHcaptcha();

  // Fetch user profile from database
  const fetchProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle(); // Use maybeSingle to not throw if no row found

      if (error) {
        console.error("Error fetching profile:", error);
        // Don't block on profile errors - user can still use the app
        setProfile(null);
        return null;
      }

      setProfile(data);
      return data;
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      setProfile(null);
      return null;
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;
    let timeoutId = null;

    async function initAuth() {
      try {
        // Get current session
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          // Don't await profile fetch - let it happen in background
          fetchProfile(currentSession.user.id).catch(console.error);
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
      } finally {
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    }

    // Timeout safety - ensure loading stops after 5 seconds max
    timeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.warn("Auth initialization timeout - forcing load complete");
        setLoading(false);
        setInitialized(true);
      }
    }, 5000);

    initAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        // Don't await - fetch in background
        fetchProfile(newSession.user.id).catch(console.error);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [fetchProfile, loading]);

  // Sign in with magic link
  const signInWithMagicLink = async (
    email,
    containerId = "hcaptcha-container"
  ) => {
    setLoading(true);
    try {
      // Get hCaptcha token if available - pass container ID
      const captchaToken = await getHcaptchaToken(containerId);

      const options = {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      };

      // Only include captchaToken if it exists
      if (captchaToken) {
        options.captchaToken = captchaToken;
      }

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options,
      });
      setLoading(false);
      return { error };
    } catch (err) {
      setLoading(false);
      return { error: err };
    }
  };

  // Sign in with password
  const signInWithPassword = async (
    email,
    password,
    containerId = "hcaptcha-container"
  ) => {
    setLoading(true);
    try {
      // Get hCaptcha token if available - pass container ID
      const captchaToken = await getHcaptchaToken(containerId);

      const options = {};

      // Only include captchaToken if it exists
      if (captchaToken) {
        options.captchaToken = captchaToken;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options,
      });
      setLoading(false);
      return { data, error };
    } catch (err) {
      setLoading(false);
      return { data: null, error: err };
    }
  };

  // Sign up with password
  const signUp = async (
    email,
    password,
    metadata = {},
    containerId = "hcaptcha-container"
  ) => {
    setLoading(true);
    try {
      // Get hCaptcha token if available - pass container ID
      const captchaToken = await getHcaptchaToken(containerId);

      const options = {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      };

      // Only include captchaToken if it exists
      if (captchaToken) {
        options.captchaToken = captchaToken;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options,
      });
      setLoading(false);
      return { data, error };
    } catch (err) {
      setLoading(false);
      return { data: null, error: err };
    }
  };

  // Sign in with OAuth (Google, etc.)
  const signInWithOAuth = async (provider) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error };
  };

  // Sign out
  const signOut = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
    setLoading(false);
    return { error };
  };

  // Reset password
  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    });
    return { error };
  };

  // Update password
  const updatePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error };
  };

  // Update profile
  const updateProfile = async (updates) => {
    if (!user) return { error: new Error("Not authenticated") };

    const { data, error } = await supabase
      .from("profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()
      .single();

    if (!error && data) {
      setProfile(data);
    }

    return { data, error };
  };

  // Refresh profile
  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const value = {
    user,
    profile,
    session,
    loading,
    initialized,
    isAuthenticated: !!user,
    signInWithMagicLink,
    signInWithPassword,
    signUp,
    signInWithOAuth,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
